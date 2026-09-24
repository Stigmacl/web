// js/theater.js — el teatro detrás del escenario: cámara entre escenas,
// puertas, telón, público en las butacas, humo con viento y medios propios.
(function () {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const world = document.getElementById('world');

    // Cámara y telón por etapa del evento.
    const SHOTS = {
        bienvenida: { cam: 'exterior', curtain: 'closed', board: 'live' },
        'como-funciona': { cam: 'hall', curtain: 'closed' },
        premios: { cam: 'hall', curtain: 'closed' },
        preparacion: { cam: 'hall', curtain: 'half' },
        ruleta: { cam: 'stage', curtain: 'open' },
        puja: { cam: 'screen', curtain: 'closed' },
        ganador: { cam: 'stage', curtain: 'open' },
        cierre: { cam: 'exterior', curtain: 'closed', board: 'outro' },
    };

    // ---------- Público en las butacas ----------
    function drawSeats(canvas) {
        const w = canvas.clientWidth;
        const h = canvas.clientHeight;
        if (!w || !h) return;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
        const ctx = canvas.getContext('2d');
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, w, h);

        let seed = 7;
        const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
        const rows = 6;
        for (let r = 0; r < rows; r++) {
            const depth = r / (rows - 1); // 0 = fila lejana, 1 = fila cercana
            const seatW = w / (34 - depth * 20);
            const seatH = seatW * 0.95;
            const baseY = h * (0.1 + depth * 0.78);
            const curve = h * 0.18 * (1 - depth * 0.4);
            for (let x = -seatW * 0.5 + (r % 2) * seatW * 0.5; x < w + seatW; x += seatW) {
                const dx = (x - w / 2) / (w / 2);
                const y = baseY - curve * dx * dx;
                const light = 0.35 + 0.35 * (1 - Math.abs(dx));
                // Respaldo de la butaca.
                const sw = seatW * 0.86;
                const grad = ctx.createLinearGradient(0, y, 0, y + seatH);
                grad.addColorStop(0, `rgba(${Math.round(150 * light)}, 28, 40, 1)`);
                grad.addColorStop(0.25, '#3a0a12');
                grad.addColorStop(1, '#0c0205');
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.roundRect(x - sw / 2, y, sw, seatH, [seatW * 0.28, seatW * 0.28, 2, 2]);
                ctx.fill();
                // Silueta del público.
                if (rnd() < 0.72) {
                    const head = seatW * (0.2 + rnd() * 0.04);
                    const hx = x + (rnd() - 0.5) * seatW * 0.12;
                    const hy = y - head * 0.9;
                    ctx.fillStyle = '#040204';
                    ctx.beginPath();
                    ctx.ellipse(hx, y + seatH * 0.15, seatW * 0.38, seatH * 0.3, 0, Math.PI, 0);
                    ctx.fill();
                    ctx.beginPath();
                    ctx.arc(hx, hy, head, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.strokeStyle = `rgba(255, 196, 140, ${0.18 + light * 0.25})`;
                    ctx.lineWidth = Math.max(1, seatW * 0.03);
                    ctx.beginPath();
                    ctx.arc(hx, hy, head, Math.PI * 1.1, Math.PI * 1.9);
                    ctx.stroke();
                }
            }
        }
        const fade = ctx.createLinearGradient(0, 0, 0, h);
        fade.addColorStop(0, 'rgba(4,2,6,0)');
        fade.addColorStop(1, 'rgba(4,2,6,0.65)');
        ctx.fillStyle = fade;
        ctx.fillRect(0, 0, w, h);
    }

    // ---------- Humo con viento ----------
    function createSmoke(canvas) {
        const ctx = canvas.getContext('2d');
        const MODES = {
            exterior: { rgb: '185, 198, 255', count: 26, band: [0.7, 1.02], rise: -0.012, wind: 0.34, alpha: [0.05, 0.11] },
            interior: { rgb: '255, 206, 170', count: 34, band: [0.4, 1.02], rise: -0.05, wind: 0.16, alpha: [0.04, 0.1] },
        };
        const sprite = document.createElement('canvas');
        sprite.width = sprite.height = 128;
        const sctx = sprite.getContext('2d');
        let mode = 'exterior';
        let parts = [];
        let w = 0;
        let h = 0;
        let gust = 0;
        let nextGust = 0;
        let last = 0;

        function paintSprite() {
            const g = sctx.createRadialGradient(64, 64, 0, 64, 64, 64);
            g.addColorStop(0, `rgba(${MODES[mode].rgb}, 1)`);
            g.addColorStop(0.45, `rgba(${MODES[mode].rgb}, 0.45)`);
            g.addColorStop(1, `rgba(${MODES[mode].rgb}, 0)`);
            sctx.clearRect(0, 0, 128, 128);
            sctx.fillStyle = g;
            sctx.fillRect(0, 0, 128, 128);
        }

        function spawn(anywhere) {
            const m = MODES[mode];
            const r = w * (0.12 + Math.random() * 0.2);
            return {
                x: anywhere ? Math.random() * (w + r * 2) - r : -r,
                y: h * (m.band[0] + Math.random() * (m.band[1] - m.band[0])),
                r,
                vx: 0.2 + Math.random() * 0.5,
                vy: m.rise * (0.5 + Math.random()),
                a: m.alpha[0] + Math.random() * (m.alpha[1] - m.alpha[0]),
                phase: Math.random() * Math.PI * 2,
            };
        }

        function resize() {
            // Media resolución: el humo es difuso y así rinde bien en proyectores.
            w = Math.round(canvas.clientWidth * 0.5);
            h = Math.round(canvas.clientHeight * 0.5);
            canvas.width = w;
            canvas.height = h;
            parts = Array.from({ length: MODES[mode].count }, () => spawn(true));
        }

        function frame(now) {
            const dt = Math.min(50, now - (last || now));
            last = now;
            if (now > nextGust) {
                gust = 0.6 + Math.random() * 0.8;
                nextGust = now + 6000 + Math.random() * 7000;
            }
            gust *= 0.992;
            const m = MODES[mode];
            const wind = m.wind + Math.sin(now * 0.00025) * 0.12 + gust * 0.4;
            ctx.clearRect(0, 0, w, h);
            for (const p of parts) {
                p.x += (p.vx + wind) * dt * 0.05;
                p.y += p.vy * dt * 0.05;
                if (p.x - p.r > w || p.y + p.r < h * 0.25) Object.assign(p, spawn(false));
                const breathe = 0.75 + 0.25 * Math.sin(p.phase + now * 0.0006);
                ctx.globalAlpha = p.a * breathe;
                ctx.drawImage(sprite, p.x - p.r, p.y - p.r * 0.6, p.r * 2, p.r * 1.2);
            }
            ctx.globalAlpha = 1;
            if (!document.hidden) requestAnimationFrame(frame);
        }

        function setMode(next) {
            if (next === mode) return;
            mode = next;
            paintSprite();
            parts = Array.from({ length: MODES[mode].count }, () => spawn(true));
        }

        paintSprite();
        resize();
        if (reducedMotion) {
            frame(0);
        } else {
            requestAnimationFrame(frame);
            document.addEventListener('visibilitychange', () => {
                if (!document.hidden) { last = 0; requestAnimationFrame(frame); }
            });
        }
        return { resize, setMode };
    }

    // ---------- Medios propios (assets/img) ----------
    function mount(container, media) {
        if (!container || !media) return false;
        const el = document.createElement(media.video ? 'video' : 'img');
        el.src = media.url;
        if (media.video) {
            Object.assign(el, { muted: true, loop: true, autoplay: true, playsInline: true });
        } else {
            el.alt = '';
        }
        container.appendChild(el);
        return true;
    }

    async function loadMedia() {
        try {
            const res = await fetch('api/escenas.php', { credentials: 'same-origin' });
            const { escenas } = await res.json();
            if (mount(world.querySelector('[data-media="fachada"]'), escenas.fachada)) {
                world.classList.add('has-fachada');
                document.getElementById('stage').classList.add('has-fachada');
            }
            mount(world.querySelector('[data-media="escenario"]'), escenas.escenario);
            if (escenas.humo && escenas.humo.video) mount(world.querySelector('[data-media="humo"]'), escenas.humo);
        } catch (e) {
            // Sin medios propios: se usa la ilustración animada.
        }
    }

    // ---------- Cámara ----------
    const seats = world.querySelector('.seats');
    const smoke = createSmoke(world.querySelector('.smoke-canvas'));
    let current = null;
    let doorTimer;

    function apply(shot) {
        world.dataset.cam = shot.cam;
        world.dataset.curtain = shot.curtain || 'closed';
        world.dataset.board = shot.board || 'live';
        smoke.setMode(shot.cam === 'exterior' ? 'exterior' : 'interior');
    }

    // Devuelve cuántos ms conviene esperar antes de mostrar el contenido.
    function go(slideId, { instant = false } = {}) {
        const shot = SHOTS[slideId] || SHOTS.premios;
        const from = current;
        current = shot.cam;
        clearTimeout(doorTimer);

        if (instant || reducedMotion || from === null) {
            world.classList.toggle('doors-open', shot.cam !== 'exterior');
            apply(shot);
            return 0;
        }
        if (from === 'exterior' && shot.cam !== 'exterior') {
            // Se abren las puertas y la cámara entra al teatro.
            world.classList.add('doors-open');
            world.dataset.board = shot.board || 'live';
            doorTimer = setTimeout(() => apply(shot), 700);
            window.S360.sound && window.S360.sound.whoosh();
            return 1700;
        }
        if (shot.cam === 'exterior' && from !== 'exterior') {
            // Sale del teatro y las puertas se cierran detrás.
            world.classList.add('doors-open');
            apply(shot);
            doorTimer = setTimeout(() => world.classList.remove('doors-open'), 1500);
            window.S360.sound && window.S360.sound.whoosh();
            return 1300;
        }
        apply(shot);
        return from === shot.cam ? 0 : 650;
    }

    let resizeTimer;
    function resize() {
        drawSeats(seats);
        smoke.resize();
    }
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(resize, 200);
    });
    document.fonts && document.fonts.ready.then(() => drawSeats(seats));
    drawSeats(seats);
    loadMedia();

    let celebrateTimer;
    window.S360 = window.S360 || {};
    window.S360.theater = {
        go,
        resize,
        setSpinning(on) { world.classList.toggle('is-spinning', on); },
        celebrate(ms = 6000) {
            world.classList.add('is-celebrating');
            clearTimeout(celebrateTimer);
            celebrateTimer = setTimeout(() => world.classList.remove('is-celebrating'), ms);
        },
    };
})();
