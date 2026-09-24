// js/effects.js — comportamiento de los efectos visuales compartidos:
// spotlight que sigue al puntero, meteoros, haces de grilla y number ticker.
(function () {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function initSpotlight() {
        document.addEventListener('pointermove', (e) => {
            const card = e.target.closest && e.target.closest('.spotlight');
            if (!card) return;
            const r = card.getBoundingClientRect();
            card.style.setProperty('--mx', `${e.clientX - r.left}px`);
            card.style.setProperty('--my', `${e.clientY - r.top}px`);
        }, { passive: true });
    }

    function meteors(container, count = 6) {
        if (!container || reducedMotion) return;
        for (let i = 0; i < count; i++) {
            const m = document.createElement('span');
            m.className = 'meteor';
            m.style.left = `${20 + Math.random() * 90}%`;
            m.style.animationDelay = `${(Math.random() * 12).toFixed(1)}s`;
            m.style.animationDuration = `${(7 + Math.random() * 7).toFixed(1)}s`;
            container.appendChild(m);
        }
    }

    // Haces sobre las líneas de la grilla: filas/columnas relativas al centro.
    function beams(grid, { rows = [-3, 2, 5], cols = [-6, 4] } = {}) {
        if (!grid || reducedMotion) return;
        rows.forEach((row, i) => {
            const b = document.createElement('span');
            b.className = 'fx-beam';
            b.style.setProperty('--row', row);
            b.style.setProperty('--delay', `${i * 3.1}s`);
            b.style.setProperty('--dur', `${8 + i * 2}s`);
            grid.appendChild(b);
        });
        cols.forEach((col, i) => {
            const b = document.createElement('span');
            b.className = 'fx-beam is-vertical';
            b.style.setProperty('--col', col);
            b.style.setProperty('--delay', `${1.7 + i * 4}s`);
            b.style.setProperty('--dur', `${10 + i * 3}s`);
            grid.appendChild(b);
        });
    }

    function countUp(el, to, { duration = 900 } = {}) {
        const target = Number(to) || 0;
        if (reducedMotion) {
            el.textContent = target;
            return;
        }
        const from = Number(el.dataset.value || 0);
        el.dataset.value = target;
        if (from === target) {
            el.textContent = target;
            return;
        }
        const t0 = performance.now();
        function frame(now) {
            const p = Math.min(1, (now - t0) / duration);
            const eased = 1 - Math.pow(1 - p, 3);
            el.textContent = Math.round(from + (target - from) * eased);
            if (p < 1) requestAnimationFrame(frame);
        }
        requestAnimationFrame(frame);
    }

    initSpotlight();

    window.S360 = window.S360 || {};
    window.S360.fx = { meteors, beams, countUp, reducedMotion };
})();
