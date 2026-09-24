// js/stage.js — escenario del evento: etapas, cronómetro, premios, ruleta,
// ganador y cierre. El resultado de cada giro lo decide api/spin.php.
(function () {
    const { ui, icons, sound, fx } = window.S360;
    const $ = (sel, root = document) => root.querySelector(sel);
    const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

    const stage = $('#stage');
    const slides = $$('.slide');
    const els = {
        splash: $('#splash'),
        estadoBadge: $('#estadoBadge'),
        soundBtn: $('#soundBtn'),
        fullscreenBtn: $('#fullscreenBtn'),
        stepper: $('#stepperList'),
        prizeGrid: $('#prizeGrid'),
        statPremios: $('#statPremios'),
        statDisponibles: $('#statDisponibles'),
        wheel: $('#wheel'),
        wheelLights: $('#wheelLights'),
        pointer: $('#wheelPointer'),
        spinBtn: $('#spinBtn'),
        spinLabel: $('#spinLabel'),
        spinHint: $('#spinHint'),
        enJuego: $('#enJuegoCount'),
        giros: $('#girosCount'),
        inPlay: $('#inPlayList'),
        participante: $('#participanteInput'),
        winner: $('#winner'),
        winnerEmpty: $('#winnerEmpty'),
        winnerContent: $('#winnerContent'),
        winnerCard: $('.winner-card'),
        winnerKicker: $('#winnerKicker'),
        winnerName: $('#winnerName'),
        winnerPrize: $('.winner-prize'),
        winnerPrizeIcon: $('#winnerPrizeIcon'),
        winnerPrizeName: $('#winnerPrizeName'),
        winnerDesc: $('#winnerDesc'),
        assignForm: $('#assignForm'),
        assignInput: $('#assignInput'),
        assignBtn: $('#assignBtn'),
        finaleStats: $('#finaleStats'),
        finaleEntregados: $('#finaleEntregados'),
        finaleWinners: $('#finaleWinners'),
        veil: $('#veil'),
        flash: $('#flash'),
        confetti: $('#confettiCanvas'),
    };

    const state = {
        evento: null,
        premios: [],
        candidatos: [],
        isAdmin: false,
        historial: [],
        current: -1,
        spinning: false,
        result: null,
        wheelKey: '',
    };

    const HEX = /^#[0-9a-f]{6}$/i;
    const safeColor = (c) => (HEX.test(c || '') ? c : '#6a45ff');
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));

    ui.hydrateIcons();
    fx.beams($('#fxGrid'));
    fx.meteors($('#fxMeteors'), 6);

    // ---------- Etapas ----------
    slides.forEach((slide, i) => {
        const li = document.createElement('li');
        li.innerHTML = `<button type="button" class="step-btn" aria-label="${ui.escapeHtml(slide.dataset.label)}">
            <span class="step-num">${ui.pad(i + 1)}</span><span class="step-label">${ui.escapeHtml(slide.dataset.label)}</span></button>`;
        li.firstElementChild.addEventListener('click', () => goTo(i));
        els.stepper.appendChild(li);
    });

    function slideIndex(id) {
        return slides.findIndex((s) => s.id === id);
    }

    function goTo(target, { silent = false } = {}) {
        const next = typeof target === 'string' ? slideIndex(target) : target;
        if (next < 0 || next >= slides.length || next === state.current || state.spinning) return;

        const prev = slides[state.current];
        if (prev) {
            prev.classList.remove('is-active');
            if (!fx.reducedMotion) {
                prev.classList.add('is-leaving');
                setTimeout(() => prev.classList.remove('is-leaving'), 460);
            }
        }
        state.current = next;
        const slide = slides[next];
        slide.classList.add('is-active');
        stage.dataset.slide = slide.id;

        $$('.step-btn', els.stepper).forEach((btn, i) => {
            btn.classList.toggle('is-current', i === next);
            btn.classList.toggle('is-done', i < next);
            if (i === next) btn.setAttribute('aria-current', 'step');
            else btn.removeAttribute('aria-current');
        });

        if (!silent && !fx.reducedMotion) {
            els.veil.classList.remove('is-playing');
            void els.veil.offsetWidth;
            els.veil.classList.add('is-playing');
        }
        history.replaceState(null, '', `#${slide.id}`);
        onEnter(slide.id);
    }

    function onEnter(id) {
        if (id === 'premios') {
            fx.countUp(els.statPremios, state.premios.length);
            fx.countUp(els.statDisponibles, state.candidatos.length);
        }
        if (id === 'ruleta') {
            els.wheel.classList.remove('is-win');
            syncWheel(true);
        }
        if (id === 'ganador') renderWinner();
        if (id === 'cierre') renderFinale();
    }

    window.addEventListener('hashchange', () => {
        const i = slideIndex(location.hash.slice(1));
        if (i >= 0) goTo(i);
    });
    $('#prevBtn').addEventListener('click', () => goTo(state.current - 1));
    $('#nextBtn').addEventListener('click', () => goTo(state.current + 1));
    $$('[data-goto]').forEach((b) => b.addEventListener('click', () => goTo(b.dataset.goto)));

    // ---------- Teclado (compatible con presentadores inalámbricos) ----------
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey || e.metaKey || e.altKey) return;
        const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName);
        if (typing) {
            if (e.key === 'Escape') e.target.blur();
            return;
        }
        const key = e.key;
        if (key === 'ArrowRight' || key === 'PageDown') { e.preventDefault(); goTo(state.current + 1); }
        else if (key === 'ArrowLeft' || key === 'PageUp') { e.preventDefault(); goTo(state.current - 1); }
        else if (key === 'Home') goTo(0);
        else if (key === 'End') goTo(slides.length - 1);
        else if (key === 'f' || key === 'F') toggleFullscreen();
        else if (key === 'm' || key === 'M') toggleSound();
        else if (/^[1-9]$/.test(key)) goTo(Number(key) - 1);
        else if ((key === ' ' || key === 'Enter') && slides[state.current].id === 'ruleta') {
            if (e.target.tagName === 'BUTTON' && e.target !== els.spinBtn) return;
            e.preventDefault();
            spin();
        }
    });

    // ---------- Pantalla completa y controles que se ocultan ----------
    let idleTimer;
    function toggleFullscreen() {
        if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {});
        else document.exitFullscreen().catch(() => {});
    }
    function wakeChrome() {
        stage.classList.remove('is-idle');
        clearTimeout(idleTimer);
        if (document.fullscreenElement) idleTimer = setTimeout(() => stage.classList.add('is-idle'), 2600);
    }
    document.addEventListener('fullscreenchange', () => {
        const on = !!document.fullscreenElement;
        stage.classList.toggle('is-fullscreen', on);
        els.fullscreenBtn.innerHTML = icons.svg(on ? 'minimize' : 'maximize');
        els.fullscreenBtn.setAttribute('aria-label', on ? 'Salir de pantalla completa (F)' : 'Pantalla completa (F)');
        wakeChrome();
        state.wheel && state.wheel.resize();
    });
    document.addEventListener('pointermove', wakeChrome, { passive: true });
    document.addEventListener('keydown', wakeChrome);
    els.fullscreenBtn.addEventListener('click', toggleFullscreen);

    function renderSoundBtn() {
        els.soundBtn.innerHTML = icons.svg(sound.enabled ? 'volume' : 'mute');
        els.soundBtn.setAttribute('aria-label', sound.enabled ? 'Silenciar sonido (M)' : 'Activar sonido (M)');
        els.soundBtn.setAttribute('aria-pressed', String(!sound.enabled));
    }
    function toggleSound() {
        sound.toggle();
        renderSoundBtn();
    }
    els.soundBtn.addEventListener('click', toggleSound);
    renderSoundBtn();

    // ---------- Evento ----------
    function renderEvento() {
        const ev = state.evento;
        $$('[data-bind]').forEach((el) => { el.textContent = ev[el.dataset.bind] || ''; });
        ui.applyAccent(ev.acento);
        const estado = ui.ESTADOS[ev.estado] || ui.ESTADOS.preparacion;
        els.estadoBadge.className = `badge badge-dot ${estado.badge}`;
        els.estadoBadge.textContent = estado.label;
        document.title = `${ev.titulo} · SUBASTA 360`;
        tickCountdown();
    }

    function tickCountdown() {
        if (!state.evento) return;
        const target = new Date(state.evento.objetivo).getTime();
        const c = ui.countdown(target || Date.now());
        const caption = c.done
            ? (state.evento.estado === 'finalizado' ? 'El evento finalizó' : 'La subasta está en curso')
            : 'El evento comienza en';
        $$('[data-countdown-caption]').forEach((el) => { el.textContent = caption; });
        $$('.countdown').forEach((root) => {
            root.classList.toggle('is-done', c.done);
            const days = $('[data-unit="days"]', root);
            days.hidden = c.days === 0;
            $('.cd-value', days).textContent = ui.pad(c.days);
            $('[data-unit="hours"] .cd-value', root).textContent = ui.pad(c.hours);
            $('[data-unit="minutes"] .cd-value', root).textContent = ui.pad(c.minutes);
            $('[data-unit="seconds"] .cd-value', root).textContent = ui.pad(c.seconds);
        });
    }
    setInterval(tickCountdown, 1000);

    // ---------- Premios ----------
    function stockClass(stock) {
        if (stock < 0) return 'is-unlimited';
        if (stock === 0) return 'is-out';
        return '';
    }

    function renderPremios() {
        const premios = state.premios;
        els.statPremios.textContent = premios.length;
        els.statDisponibles.textContent = state.candidatos.length;
        els.statPremios.dataset.value = premios.length;
        els.statDisponibles.dataset.value = state.candidatos.length;

        if (!premios.length) {
            els.prizeGrid.innerHTML = `<div class="empty">
                <span class="empty-icon">${icons.svg('gift')}</span>
                <p class="empty-title">Los premios se anunciarán pronto</p>
                <p class="empty-text">Cárgalos desde el panel de administración.</p></div>`;
            return;
        }
        const n = premios.length;
        const cols = n <= 4 ? n : n <= 8 ? 4 : n <= 10 ? 5 : 6;
        els.prizeGrid.style.setProperty('--cols', cols);
        els.prizeGrid.classList.toggle('is-compact', n > 8);
        els.prizeGrid.innerHTML = premios.map((p, i) => `
            <article class="prize-card ${p.stock === 0 ? 'is-out' : ''}" style="--prize:${safeColor(p.color)};--i:${i}">
                <span class="prize-glow" aria-hidden="true"></span>
                <div class="prize-icon"><span class="prize-orbit" aria-hidden="true"></span>${icons.prize(p.icono)}</div>
                <h3 class="prize-name">${ui.escapeHtml(p.nombre)}</h3>
                <p class="prize-desc">${ui.escapeHtml(p.descripcion || '')}</p>
                <div class="prize-foot">
                    <span class="prize-stock ${stockClass(p.stock)}">${ui.escapeHtml(ui.stockLabel(p.stock))}</span>
                    <span class="prize-brand"><span class="brand-mark" aria-hidden="true"></span>360</span>
                </div>
            </article>`).join('');
    }

    // ---------- Ruleta ----------
    state.wheel = S360.createWheel($('#wheelCanvas'));
    for (let i = 0; i < 36; i++) {
        const bulb = document.createElement('span');
        bulb.style.setProperty('--i', i);
        els.wheelLights.appendChild(bulb);
    }
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => state.wheel.resize(), 200);
    });

    // El orden de los gajos debe ser el mismo que usa api/spin.php (orden del archivo).
    function syncWheel(force = false) {
        const key = state.candidatos.map((p) => `${p.id}|${p.nombre}|${p.color}`).join(';');
        if (!force && (state.spinning || key === state.wheelKey)) return;
        if (key !== state.wheelKey) {
            state.wheelKey = key;
            state.wheel.setItems(state.candidatos.map((p) => ({ ...p, color: safeColor(p.color) })));
        }
        highlightInPlay(state.wheel.indexAtPointer());
    }

    function renderInPlay() {
        const list = state.candidatos;
        els.enJuego.textContent = list.length;
        const max = 7;
        const items = list.slice(0, max).map((p) => `
            <li style="--prize:${safeColor(p.color)}" data-id="${ui.escapeHtml(p.id)}">
                <span class="inplay-icon">${icons.prize(p.icono)}</span>
                <span class="inplay-name">${ui.escapeHtml(p.nombre)}</span>
                <span class="inplay-stock">${p.stock < 0 ? '∞' : p.stock}</span>
            </li>`);
        if (list.length > max) items.push(`<li class="inplay-more">+${list.length - max} premios más</li>`);
        if (!list.length) items.push('<li class="inplay-more">Sin premios disponibles</li>');
        els.inPlay.innerHTML = items.join('');
    }

    function highlightInPlay(index) {
        const id = state.candidatos[index] && state.candidatos[index].id;
        $$('li[data-id]', els.inPlay).forEach((li) => li.classList.toggle('is-current', li.dataset.id === id));
    }

    function renderSpinButton() {
        const btn = els.spinBtn;
        btn.removeAttribute('aria-busy');
        els.spinHint.classList.remove('is-error');
        if (state.spinning) {
            btn.disabled = true;
            els.spinLabel.textContent = 'Girando…';
            els.spinHint.innerHTML = 'Mucha suerte';
            return;
        }
        if (!state.isAdmin) {
            btn.disabled = false;
            els.spinLabel.textContent = 'Iniciar sesión para girar';
            els.spinHint.textContent = 'Solo el operador del evento puede girar la ruleta';
            return;
        }
        if (!state.candidatos.length) {
            btn.disabled = true;
            els.spinLabel.textContent = 'Sin premios disponibles';
            els.spinHint.textContent = 'Agrega premios o stock desde el panel admin';
            return;
        }
        btn.disabled = false;
        els.spinLabel.textContent = 'Girar la ruleta';
        els.spinHint.innerHTML = '<kbd>Espacio</kbd> para girar';
    }

    function tickPointer() {
        if (fx.reducedMotion || !els.pointer.animate) return;
        els.pointer.animate(
            [{ transform: 'translateX(-50%) rotate(-20deg)' }, { transform: 'translateX(-50%) rotate(0deg)' }],
            { duration: 170, easing: 'cubic-bezier(.2,.8,.2,1)' }
        );
    }

    async function spin() {
        if (state.spinning) return;
        if (!state.isAdmin) {
            window.location.href = `login.html?next=${encodeURIComponent('index.html#ruleta')}`;
            return;
        }
        state.spinning = true;
        sound.unlock();

        // Refresca premios justo antes de girar para dibujar la lista vigente.
        await loadPremios();
        syncWheel(true);
        if (!state.candidatos.length) {
            state.spinning = false;
            renderSpinButton();
            return;
        }

        stage.classList.add('is-spinning');
        els.wheel.classList.remove('is-win');
        els.wheel.classList.add('is-spinning');
        renderSpinButton();

        let res;
        try {
            res = await Api.girar(els.participante.value.trim());
        } catch (err) {
            state.spinning = false;
            stage.classList.remove('is-spinning');
            els.wheel.classList.remove('is-spinning');
            if (err.status === 401) state.isAdmin = false;
            applyOperator();
            renderSpinButton();
            els.spinHint.textContent = err.message || 'No se pudo girar la ruleta.';
            els.spinHint.classList.add('is-error');
            ui.toast({ type: 'error', title: 'No se pudo girar', message: err.message });
            return;
        }

        let index = state.candidatos.findIndex((p) => p.id === res.ganador.id);
        if (index < 0) {
            // La lista cambió en el servidor entre la carga y el giro: se re-sincroniza.
            state.candidatos = state.candidatos.concat([res.ganador]);
            state.wheelKey = '';
            syncWheel(true);
            index = state.candidatos.length - 1;
        }

        sound.start();
        await state.wheel.spinTo(index, {
            onTick: () => {
                sound.tick();
                tickPointer();
                highlightInPlay(state.wheel.indexAtPointer());
            },
        });

        state.wheel.setHighlight(index);
        els.wheel.classList.remove('is-spinning');
        els.wheel.classList.add('is-win');
        stage.classList.remove('is-spinning');
        highlightInPlay(index);
        sound.win();

        state.result = { giro: res.giro, premio: res.ganador, fresh: true };
        els.participante.value = '';
        await wait(fx.reducedMotion ? 200 : 1300);
        state.spinning = false;
        renderSpinButton();
        goTo('ganador');

        loadPremios();
        loadHistorial();
    }

    els.spinBtn.addEventListener('click', spin);
    els.participante.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            spin();
        }
    });

    // ---------- Ganador ----------
    function celebrate(big) {
        if (fx.reducedMotion) return;
        els.flash.classList.remove('is-on');
        void els.flash.offsetWidth;
        els.flash.classList.add('is-on');
        const style = getComputedStyle(document.documentElement);
        const colors = [
            style.getPropertyValue('--accent-1').trim(),
            style.getPropertyValue('--accent-2').trim(),
            '#fde68a', '#f5b73b', '#ffffff',
            safeColor(state.result && state.result.premio.color),
        ];
        S360.confetti(els.confetti, { colors, count: big ? 190 : 110 });
    }

    function renderWinner() {
        const result = state.result;
        els.winner.classList.toggle('has-result', !!result);
        els.winnerEmpty.hidden = !!result;
        els.winnerContent.hidden = !result;
        if (!result) return;

        const { premio, giro } = result;
        const nombre = (giro && giro.participante) || '';
        els.winner.classList.toggle('is-selected', !nombre);
        els.winnerKicker.textContent = nombre ? 'Ganador' : 'Premio en subasta';
        els.winnerName.textContent = nombre;
        els.winnerName.hidden = !nombre;
        els.winnerPrize.style.setProperty('--prize', safeColor(premio.color));
        els.winnerPrizeIcon.innerHTML = icons.prize(premio.icono);
        els.winnerPrizeName.textContent = premio.nombre;
        els.winnerDesc.textContent = premio.descripcion || '';
        els.winnerDesc.hidden = !premio.descripcion;
        els.assignInput.value = '';

        if (result.fresh) {
            result.fresh = false;
            els.winnerCard.classList.remove('is-revealing');
            void els.winnerCard.offsetWidth;
            els.winnerCard.classList.add('is-revealing');
            celebrate(!!nombre);
        }
    }

    els.assignForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nombre = els.assignInput.value.trim();
        if (!nombre || !state.result) return;
        ui.setBusy(els.assignBtn, true);
        try {
            await Api.asignarGanador(state.result.giro.id, nombre);
            state.result.giro.participante = nombre;
            state.result.fresh = true;
            renderWinner();
            sound.win();
            loadHistorial();
        } catch (err) {
            ui.toast({ type: 'error', title: 'No se pudo guardar el ganador', message: err.message });
        } finally {
            ui.setBusy(els.assignBtn, false);
        }
    });

    $('#nextPrizeBtn').addEventListener('click', () => goTo('ruleta'));

    // ---------- Cierre ----------
    function renderFinale() {
        const entregas = state.historial;
        els.finaleStats.hidden = !state.isAdmin || !entregas.length;
        if (els.finaleStats.hidden) return;
        els.finaleEntregados.dataset.value = 0;
        fx.countUp(els.finaleEntregados, entregas.length, { duration: 1400 });
        els.finaleWinners.innerHTML = entregas
            .filter((h) => h.participante)
            .slice(0, 8)
            .map((h) => `<li><strong>${ui.escapeHtml(h.participante)}</strong> · ${ui.escapeHtml(h.premio_nombre)}</li>`)
            .join('');
    }

    // ---------- Datos ----------
    function applyOperator() {
        stage.classList.toggle('is-operator', state.isAdmin);
    }

    async function loadSession() {
        try {
            state.isAdmin = !!(await Api.estadoSesion()).is_admin;
        } catch (e) {
            state.isAdmin = false;
        }
        applyOperator();
        renderSpinButton();
    }

    async function loadEvento() {
        const { evento } = await Api.obtenerEvento();
        const changed = JSON.stringify(evento) !== JSON.stringify(state.evento);
        state.evento = evento;
        if (changed) renderEvento();
    }

    async function loadPremios() {
        try {
            const { premios } = await Api.listarPremios();
            const changed = JSON.stringify(premios) !== JSON.stringify(state.premios);
            state.premios = premios;
            state.candidatos = premios.filter((p) => (p.stock ?? -1) !== 0);
            if (changed) {
                renderPremios();
                renderInPlay();
                syncWheel();
                renderSpinButton();
            }
        } catch (e) {
            // Se mantiene el último estado conocido; el polling reintentará.
        }
    }

    async function loadHistorial() {
        if (!state.isAdmin) return;
        try {
            state.historial = (await Api.historial()).historial;
            els.giros.textContent = state.historial.length;
        } catch (e) {
            // No crítico para el escenario.
        }
    }

    async function init() {
        const started = performance.now();
        try {
            await Promise.all([loadEvento(), loadPremios(), loadSession()]);
        } catch (e) {
            ui.toast({ type: 'error', title: 'Sin conexión con el servidor', message: 'Revisa que la ventana del servidor siga abierta.', ms: 6000 });
            state.evento = state.evento || { titulo: 'SUBASTA 360', subtitulo: '', bienvenida: '', estado: 'preparacion', objetivo: new Date().toISOString() };
            renderEvento();
        }
        await loadHistorial();

        const initial = slideIndex(location.hash.slice(1));
        goTo(initial >= 0 ? initial : 0, { silent: true });

        const elapsed = performance.now() - started;
        setTimeout(() => els.splash.classList.add('is-done'), Math.max(0, 700 - elapsed));
    }

    // Refresco en vivo: los cambios hechos en el panel admin llegan al escenario.
    setInterval(() => {
        if (state.spinning || document.hidden) return;
        loadEvento().catch(() => {});
        loadPremios();
    }, 15000);
    window.addEventListener('focus', () => {
        if (state.spinning) return;
        loadSession().then(loadHistorial);
        loadPremios();
    });

    init();
})();
