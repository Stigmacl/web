// js/confetti.js — confeti liviano en canvas para la celebración del ganador.
(function () {
    function launch(canvas, { colors, count = 170, duration = 4200 } = {}) {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        const ctx = canvas.getContext('2d');
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const w = canvas.clientWidth;
        const h = canvas.clientHeight;
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        const palette = colors && colors.length ? colors : ['#8b6cff', '#22d3ee', '#fde68a', '#ffffff'];
        const parts = [];
        for (let i = 0; i < count; i++) {
            const fromLeft = i % 2 === 0;
            const angle = (fromLeft ? -60 : -120) + (Math.random() - 0.5) * 40;
            const speed = 9 + Math.random() * 9;
            parts.push({
                x: fromLeft ? w * 0.08 : w * 0.92,
                y: h * 0.95,
                vx: Math.cos((angle * Math.PI) / 180) * speed,
                vy: Math.sin((angle * Math.PI) / 180) * speed,
                size: 5 + Math.random() * 7,
                color: palette[i % palette.length],
                rot: Math.random() * Math.PI,
                spin: (Math.random() - 0.5) * 0.3,
                wobble: Math.random() * 10,
                round: Math.random() < 0.3,
            });
        }

        const t0 = performance.now();
        function frame(now) {
            const elapsed = now - t0;
            ctx.clearRect(0, 0, w, h);
            const fade = Math.max(0, 1 - Math.max(0, elapsed - duration * 0.7) / (duration * 0.3));
            parts.forEach((p) => {
                p.vx *= 0.985;
                p.vy = p.vy * 0.985 + 0.28;
                p.wobble += 0.12;
                p.x += p.vx + Math.sin(p.wobble) * 0.6;
                p.y += p.vy;
                p.rot += p.spin;
                ctx.save();
                ctx.globalAlpha = fade;
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rot);
                ctx.fillStyle = p.color;
                if (p.round) {
                    ctx.beginPath();
                    ctx.arc(0, 0, p.size * 0.4, 0, Math.PI * 2);
                    ctx.fill();
                } else {
                    ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
                }
                ctx.restore();
            });
            if (elapsed < duration) requestAnimationFrame(frame);
            else ctx.clearRect(0, 0, w, h);
        }
        requestAnimationFrame(frame);
    }

    window.S360 = window.S360 || {};
    window.S360.confetti = launch;
})();
