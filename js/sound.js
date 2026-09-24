// js/sound.js — efectos de sonido sintetizados con Web Audio (sin archivos).
// Se puede silenciar; la preferencia queda guardada en este navegador.
(function () {
    const KEY = 's360-sound';
    let ctx = null;
    let enabled = true;
    try { enabled = localStorage.getItem(KEY) !== 'off'; } catch (e) { /* almacenamiento no disponible */ }

    function audio() {
        if (!ctx) {
            const AC = window.AudioContext || window.webkitAudioContext;
            if (!AC) return null;
            ctx = new AC();
        }
        if (ctx.state === 'suspended') ctx.resume();
        return ctx;
    }

    function tone({ freq, type = 'sine', start = 0, dur = 0.15, gain = 0.08 }) {
        const ac = audio();
        if (!ac) return;
        const t = ac.currentTime + start;
        const osc = ac.createOscillator();
        const g = ac.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, t);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(gain, t + 0.008);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        osc.connect(g).connect(ac.destination);
        osc.start(t);
        osc.stop(t + dur + 0.02);
    }

    const sound = {
        get enabled() { return enabled; },
        toggle() {
            enabled = !enabled;
            try { localStorage.setItem(KEY, enabled ? 'on' : 'off'); } catch (e) { /* noop */ }
            return enabled;
        },
        unlock() { if (enabled) audio(); },
        tick() {
            if (!enabled) return;
            tone({ freq: 1500, type: 'triangle', dur: 0.045, gain: 0.05 });
        },
        start() {
            if (!enabled) return;
            tone({ freq: 220, type: 'sine', dur: 0.35, gain: 0.07 });
            tone({ freq: 330, type: 'sine', start: 0.08, dur: 0.35, gain: 0.05 });
        },
        win() {
            if (!enabled) return;
            [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
                tone({ freq, type: 'triangle', start: i * 0.11, dur: 0.5, gain: 0.08 });
            });
            tone({ freq: 1567.98, type: 'sine', start: 0.46, dur: 0.9, gain: 0.05 });
        },
    };

    window.S360 = window.S360 || {};
    window.S360.sound = sound;
})();
