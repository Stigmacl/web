// js/stage.js — controla la presentación de la pantalla principal:
// navegación de slides, cronómetro, ruleta (canvas) y reveal del ganador.
(function () {
    const slides = Array.from(document.querySelectorAll('.slide'));
    const dotsHolder = document.getElementById('stageDots');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    const girarBtn = document.getElementById('girarBtn');
    const ruletaCanvas = document.getElementById('ruletaCanvas');
    const ruletaMensaje = document.getElementById('ruletaMensaje');
    const confettiLayer = document.getElementById('confettiLayer');
    const slideGanador = document.getElementById('slide-ganador');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let currentSlide = 0;
    let isAdmin = false;
    let candidatosActuales = [];
    let currentRotationDeg = 0;
    let girando = false;

    // ---------- Navegación de slides ----------
    slides.forEach((_, i) => {
        const dot = document.createElement('button');
        dot.className = 'stage-dot';
        dot.setAttribute('aria-label', `Ir a la diapositiva ${i + 1}`);
        dot.addEventListener('click', () => goToSlide(i));
        dotsHolder.appendChild(dot);
    });

    function updateDots() {
        Array.from(dotsHolder.children).forEach((d, i) => {
            d.classList.toggle('active', i === currentSlide);
        });
    }

    function goToSlide(idx) {
        idx = Math.max(0, Math.min(slides.length - 1, idx));
        if (idx === currentSlide) return;
        slides[currentSlide].classList.remove('active');
        currentSlide = idx;
        slides[currentSlide].classList.add('active');
        updateDots();
        if (slides[currentSlide].id === 'slide-ruleta') {
            refreshRuletaState();
        }
    }

    prevBtn.addEventListener('click', () => goToSlide(currentSlide - 1));
    nextBtn.addEventListener('click', () => goToSlide(currentSlide + 1));

    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight' || e.key === 'PageDown') goToSlide(currentSlide + 1);
        if (e.key === 'ArrowLeft' || e.key === 'PageUp') goToSlide(currentSlide - 1);
        if (e.key === 'f' || e.key === 'F') toggleFullscreen();
    });

    updateDots();

    // ---------- Pantalla completa ----------
    function toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {});
        } else {
            document.exitFullscreen().catch(() => {});
        }
    }
    fullscreenBtn.addEventListener('click', toggleFullscreen);

    // ---------- Evento / cronómetro ----------
    async function iniciarEvento() {
        try {
            const { evento } = await Api.obtenerEvento();
            document.getElementById('eventoTituloPortada').textContent = evento.titulo;
            document.getElementById('eventoSubtituloTop').textContent = evento.subtitulo;
            document.getElementById('eventoTituloRuleta').textContent = evento.titulo;

            const objetivo = new Date(evento.objetivo).getTime();
            const tick = () => {
                const diff = Math.max(0, objetivo - Date.now());
                const totalSeg = Math.floor(diff / 1000);
                const horas = Math.floor(totalSeg / 3600);
                const min = Math.floor((totalSeg % 3600) / 60);
                const seg = totalSeg % 60;
                document.getElementById('cronoHoras').textContent = String(horas).padStart(2, '0');
                document.getElementById('cronoMin').textContent = String(min).padStart(2, '0');
                document.getElementById('cronoSeg').textContent = String(seg).padStart(2, '0');
            };
            tick();
            setInterval(tick, 1000);
        } catch (e) {
            console.error('No se pudo cargar la configuración del evento', e);
        }
    }

    // ---------- Ruleta: dibujo ----------
    function setupCanvas() {
        const dpr = window.devicePixelRatio || 1;
        const size = 640;
        ruletaCanvas.width = size * dpr;
        ruletaCanvas.height = size * dpr;
        const ctx = ruletaCanvas.getContext('2d');
        ctx.scale(dpr, dpr);
        return { ctx, size };
    }

    function truncar(texto, max) {
        return texto.length > max ? texto.slice(0, max - 1) + '…' : texto;
    }

    function dibujarRuleta(premios) {
        const { ctx, size } = setupCanvas();
        ctx.clearRect(0, 0, size, size);
        const cx = size / 2;
        const cy = size / 2;
        const radius = size / 2 - 8;
        const n = premios.length;

        if (n === 0) {
            ctx.beginPath();
            ctx.arc(cx, cy, radius, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255,255,255,0.08)';
            ctx.fill();
            ctx.fillStyle = '#fdfaf3';
            ctx.font = '600 20px Segoe UI, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Sin premios cargados', cx, cy);
            return;
        }

        const segAngle = (Math.PI * 2) / n;
        premios.forEach((p, i) => {
            const start = i * segAngle;
            const end = start + segAngle;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.arc(cx, cy, radius, start, end);
            ctx.closePath();
            ctx.fillStyle = p.color || '#8e44ad';
            ctx.fill();
            ctx.lineWidth = 2;
            ctx.strokeStyle = 'rgba(18,8,31,0.6)';
            ctx.stroke();

            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(start + segAngle / 2);
            ctx.textAlign = 'right';
            ctx.fillStyle = '#fdfaf3';
            ctx.font = '600 19px Segoe UI, sans-serif';
            ctx.shadowColor = 'rgba(0,0,0,0.45)';
            ctx.shadowBlur = 4;
            ctx.fillText(truncar(p.nombre, 24), radius - 22, 6);
            ctx.restore();
        });

        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.lineWidth = 8;
        ctx.strokeStyle = '#eec55e';
        ctx.stroke();
    }

    // ---------- Ruleta: estado / auth ----------
    async function refreshRuletaState() {
        try {
            const estado = await Api.estadoSesion();
            isAdmin = !!estado.is_admin;
        } catch (e) {
            isAdmin = false;
        }

        try {
            const { premios } = await Api.listarPremios();
            candidatosActuales = premios.filter((p) => (p.stock ?? -1) !== 0);
        } catch (e) {
            candidatosActuales = [];
        }
        dibujarRuleta(candidatosActuales);
        ruletaCanvas.style.transform = `rotate(${currentRotationDeg}deg)`;

        if (!isAdmin) {
            girarBtn.textContent = 'Iniciar sesión para girar';
            girarBtn.disabled = false;
            ruletaMensaje.textContent = 'El operador del evento debe iniciar sesión como admin en esta pantalla.';
            ruletaMensaje.hidden = false;
        } else if (candidatosActuales.length === 0) {
            girarBtn.textContent = 'Sin premios disponibles';
            girarBtn.disabled = true;
            ruletaMensaje.textContent = 'Cargá premios desde el panel admin para poder girar.';
            ruletaMensaje.hidden = false;
        } else {
            girarBtn.textContent = 'Girar la ruleta';
            girarBtn.disabled = girando;
            ruletaMensaje.hidden = true;
        }
    }

    girarBtn.addEventListener('click', async () => {
        if (!isAdmin) {
            window.location.href = 'login.html';
            return;
        }
        if (girando || candidatosActuales.length === 0) return;
        await girar();
    });

    async function girar() {
        girando = true;
        girarBtn.disabled = true;
        girarBtn.textContent = 'Girando…';

        let resultado;
        try {
            resultado = await Api.girar();
        } catch (e) {
            girando = false;
            ruletaMensaje.textContent = e.message || 'No se pudo girar la ruleta.';
            ruletaMensaje.hidden = false;
            girarBtn.disabled = false;
            girarBtn.textContent = 'Girar la ruleta';
            return;
        }

        const ganador = resultado.ganador;
        const idx = candidatosActuales.findIndex((p) => p.id === ganador.id);
        const n = candidatosActuales.length;
        const segAngleDeg = 360 / n;
        const midAngleDeg = (idx >= 0 ? idx : 0) * segAngleDeg + segAngleDeg / 2;
        const targetMod = ((270 - midAngleDeg) % 360 + 360) % 360;
        const extraSpins = 6 + Math.floor(Math.random() * 3);
        const delta = extraSpins * 360 + ((targetMod - (currentRotationDeg % 360) + 360) % 360);

        currentRotationDeg += delta;
        ruletaCanvas.style.transition = reducedMotion
            ? 'transform 0.4s ease'
            : 'transform 4.4s cubic-bezier(0.15, 0.65, 0.1, 1)';
        ruletaCanvas.style.transform = `rotate(${currentRotationDeg}deg)`;

        const onDone = () => {
            ruletaCanvas.removeEventListener('transitionend', onDone);
            mostrarGanador(ganador);
            girando = false;
        };
        ruletaCanvas.addEventListener('transitionend', onDone);
    }

    function mostrarGanador(premio) {
        document.getElementById('ganadorNombre').textContent = premio.nombre;
        document.getElementById('ganadorDesc').textContent = premio.descripcion || '';
        document.getElementById('ganadorIconoTexto').textContent = (premio.icono || '').trim();

        goToSlide(slides.findIndex((s) => s.id === 'slide-ganador'));
        slideGanador.classList.remove('curtains-open');
        confettiLayer.innerHTML = '';
        // Forzar reflow para poder reiniciar la transición del telón.
        void slideGanador.offsetWidth;
        slideGanador.classList.add('curtains-open');

        if (!reducedMotion) {
            lanzarConfeti();
        }
    }

    function lanzarConfeti(cantidad = 140) {
        const colores = ['#eec55e', '#e0273f', '#f5dd8f', '#fdfaf3', '#b91c3c'];
        const frag = document.createDocumentFragment();
        for (let i = 0; i < cantidad; i++) {
            const el = document.createElement('div');
            el.className = 'confetti-piece';
            el.style.left = Math.random() * 100 + '%';
            el.style.background = colores[Math.floor(Math.random() * colores.length)];
            el.style.animationDuration = (2.4 + Math.random() * 2.2) + 's';
            el.style.animationDelay = (Math.random() * 0.8) + 's';
            frag.appendChild(el);
        }
        confettiLayer.appendChild(frag);
    }

    document.getElementById('volverRuletaBtn').addEventListener('click', () => {
        goToSlide(slides.findIndex((s) => s.id === 'slide-ruleta'));
    });

    // ---------- Init ----------
    iniciarEvento();
    refreshRuletaState();
})();
