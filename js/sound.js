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

    // Ruido blanco filtrado: base para viento, aplausos y encendido de TV.
    function noise({ start = 0, dur = 0.3, gain = 0.05, type = 'bandpass', freq = 1200, freqTo, q = 0.8 }) {
        const ac = audio();
        if (!ac) return;
        const t = ac.currentTime + start;
        const buffer = ac.createBuffer(1, Math.ceil(ac.sampleRate * dur), ac.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
        const src = ac.createBufferSource();
        src.buffer = buffer;
        const filter = ac.createBiquadFilter();
        filter.type = type;
        filter.Q.value = q;
        filter.frequency.setValueAtTime(freq, t);
        if (freqTo) filter.frequency.exponentialRampToValueAtTime(freqTo, t + dur);
        const g = ac.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(gain, t + Math.min(0.08, dur / 3));
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        src.connect(filter).connect(g).connect(ac.destination);
        src.start(t);
        src.stop(t + dur + 0.02);
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
        whoosh() {
            if (!enabled) return;
            noise({ dur: 1.4, gain: 0.06, freq: 300, freqTo: 2400, q: 0.6 });
        },
        tvOn() {
            if (!enabled) return;
            noise({ dur: 0.25, gain: 0.05, type: 'highpass', freq: 3000 });
            tone({ freq: 60, type: 'sawtooth', start: 0.05, dur: 0.5, gain: 0.02 });
        },
        applause(seconds = 3) {
            if (!enabled) return;
            const claps = Math.round(seconds * 40);
            for (let i = 0; i < claps; i++) {
                const start = Math.random() * seconds;
                const fade = 1 - start / seconds;
                noise({ start, dur: 0.05 + Math.random() * 0.04, gain: 0.03 * fade + 0.004, freq: 900 + Math.random() * 1600, q: 1.2 });
            }
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
