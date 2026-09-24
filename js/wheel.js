// js/wheel.js — ruleta en canvas. El premio lo elige el servidor; este módulo
// solo dibuja y anima hasta el gajo indicado.
(function () {
    const TAU = Math.PI * 2;
    const POINTER = -Math.PI / 2; // el indicador está arriba
    const mod = (a, m) => ((a % m) + m) % m;
    const easeOutQuart = (p) => 1 - Math.pow(1 - p, 4);
    const easeInOutSine = (p) => -(Math.cos(Math.PI * p) - 1) / 2;

    function hexToRgb(hex) {
        const m = /^#?([0-9a-f]{6})$/i.exec(hex || '');
        const n = m ? parseInt(m[1], 16) : 0x6a45ff;
        return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    }

    function shade(hex, amount) {
        const [r, g, b] = hexToRgb(hex);
        const t = amount < 0 ? 0 : 255;
        const p = Math.abs(amount);
        return `rgb(${Math.round((t - r) * p + r)}, ${Math.round((t - g) * p + g)}, ${Math.round((t - b) * p + b)})`;
    }

    function isLight(hex) {
        const [r, g, b] = hexToRgb(hex).map((v) => {
            const c = v / 255;
            return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.45;
    }

    function createWheel(canvas, { size = 720 } = {}) {
        const ctx = canvas.getContext('2d');
        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        let items = [];
        let rotation = 0;
        let highlight = -1;
        let face = null;
        let dpr = 1;

        function resize() {
            dpr = Math.min(window.devicePixelRatio || 1, 2);
            canvas.width = size * dpr;
            canvas.height = size * dpr;
            face = null;
            draw();
        }

        function fitLabel(c, text, maxWidth, baseSize) {
            let fontSize = baseSize;
            c.font = `600 ${fontSize}px Inter, "Segoe UI", sans-serif`;
            while (c.measureText(text).width > maxWidth && fontSize > 13) {
                fontSize -= 1;
                c.font = `600 ${fontSize}px Inter, "Segoe UI", sans-serif`;
            }
            let label = text;
            while (c.measureText(label).width > maxWidth && label.length > 4) {
                label = label.slice(0, -2) + '…';
            }
            return label;
        }

        // La cara de la ruleta se pre-renderiza una vez; cada frame solo la rota.
        function renderFace() {
            const off = document.createElement('canvas');
            off.width = off.height = size * dpr;
            const c = off.getContext('2d');
            c.scale(dpr, dpr);
            const center = size / 2;
            const R = center - 2;

            c.beginPath();
            c.arc(center, center, R, 0, TAU);
            c.fillStyle = '#0b0e22';
            c.fill();

            if (!items.length) {
                c.fillStyle = '#a9b0cf';
                c.font = '600 24px Inter, "Segoe UI", sans-serif';
                c.textAlign = 'center';
                c.textBaseline = 'middle';
                c.fillText('Sin premios disponibles', center, center + R * 0.42);
                face = off;
                return;
            }

            const seg = TAU / items.length;
            const baseFont = Math.max(15, Math.min(26, Math.round(280 / (items.length + 6))));

            items.forEach((item, i) => {
                const a0 = i * seg;
                const grad = c.createRadialGradient(center, center, R * 0.18, center, center, R);
                grad.addColorStop(0, shade(item.color, -0.55));
                grad.addColorStop(0.6, shade(item.color, -0.12));
                grad.addColorStop(1, item.color);

                c.beginPath();
                c.moveTo(center, center);
                c.arc(center, center, R, a0, a0 + seg);
                c.closePath();
                c.fillStyle = grad;
                c.fill();
                c.lineWidth = 2;
                c.strokeStyle = 'rgba(5, 6, 15, 0.55)';
                c.stroke();

                c.save();
                c.translate(center, center);
                c.rotate(a0 + seg / 2);
                if (item.mystery) {
                    // Gajo incógnito: un "?" grande, girado para leerse desde el borde.
                    c.rotate(Math.PI / 2);
                    const disc = Math.min(baseFont * 1.5, R * seg * 0.3);
                    c.beginPath();
                    c.arc(0, -R * 0.64, disc, 0, TAU);
                    c.fillStyle = 'rgba(255, 255, 255, 0.14)';
                    c.fill();
                    c.lineWidth = 2;
                    c.strokeStyle = 'rgba(255, 255, 255, 0.4)';
                    c.stroke();
                    c.textAlign = 'center';
                    c.textBaseline = 'middle';
                    c.fillStyle = '#ffffff';
                    c.shadowColor = 'rgba(0, 0, 0, 0.4)';
                    c.shadowBlur = 8;
                    c.font = `800 ${Math.round(disc * 1.25)}px Sora, Inter, sans-serif`;
                    c.fillText('?', 0, -R * 0.64 + disc * 0.06);
                    c.restore();
                    return;
                }
                const light = isLight(item.color);
                const label = fitLabel(c, item.nombre, R * 0.58, baseFont);
                c.textAlign = 'right';
                c.textBaseline = 'middle';
                c.fillStyle = light ? '#0b0d1c' : '#ffffff';
                if (!light) {
                    c.shadowColor = 'rgba(0, 0, 0, 0.5)';
                    c.shadowBlur = 6;
                }
                c.fillText(label, R - 28, 0);
                c.restore();
            });

            // Brillo diagonal sutil para dar volumen.
            const gloss = c.createLinearGradient(0, 0, size, size);
            gloss.addColorStop(0, 'rgba(255,255,255,0.14)');
            gloss.addColorStop(0.45, 'rgba(255,255,255,0)');
            gloss.addColorStop(1, 'rgba(0,0,0,0.22)');
            c.beginPath();
            c.arc(center, center, R, 0, TAU);
            c.fillStyle = gloss;
            c.fill();

            c.lineWidth = 3;
            c.strokeStyle = 'rgba(255,255,255,0.22)';
            c.stroke();
            face = off;
        }

        function draw() {
            if (!face) renderFace();
            const w = canvas.width;
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.clearRect(0, 0, w, w);
            ctx.save();
            ctx.translate(w / 2, w / 2);
            ctx.rotate(rotation);
            ctx.drawImage(face, -w / 2, -w / 2);

            if (highlight >= 0 && items.length > 1) {
                const seg = TAU / items.length;
                const R = (size / 2 - 2) * dpr;
                items.forEach((_, i) => {
                    if (i === highlight) return;
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.arc(0, 0, R, i * seg, (i + 1) * seg);
                    ctx.closePath();
                    ctx.fillStyle = 'rgba(5, 6, 15, 0.62)';
                    ctx.fill();
                });
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.arc(0, 0, R - 2 * dpr, highlight * seg, (highlight + 1) * seg);
                ctx.closePath();
                ctx.lineWidth = 4 * dpr;
                ctx.strokeStyle = 'rgba(255,255,255,0.9)';
                ctx.shadowColor = 'rgba(255,255,255,0.8)';
                ctx.shadowBlur = 18 * dpr;
                ctx.stroke();
            }
            ctx.restore();
        }

        function setItems(next) {
            items = next.map((p) => ({ id: p.id, nombre: p.nombre, color: p.color, mystery: !!p.mystery }));
            highlight = -1;
            face = null;
            draw();
        }

        function setHighlight(index) {
            highlight = index;
            draw();
        }

        function indexAtPointer() {
            if (!items.length) return -1;
            const seg = TAU / items.length;
            return Math.floor(mod(POINTER - rotation, TAU) / seg) % items.length;
        }

        function spinTo(index, { duration = 6200, turns = 7, onTick } = {}) {
            const n = items.length;
            if (!n) return Promise.resolve();
            highlight = -1;
            const seg = TAU / n;
            const jitter = (Math.random() - 0.5) * seg * 0.55;
            const targetMod = mod(POINTER - (index * seg + seg / 2 + jitter), TAU);
            const start = rotation;
            const quick = reducedMotion;
            const windupMs = quick ? 0 : 380;
            const windup = quick ? 0 : 0.2;
            const mainMs = quick ? 700 : duration;
            const fullTurns = quick ? 1 : turns;
            const delta = fullTurns * TAU + mod(targetMod - mod(start, TAU), TAU);
            const base = start - windup;

            return new Promise((resolve) => {
                let t0 = null;
                let lastIndex = indexAtPointer();
                let lastTickAt = 0;
                let prevRot = start;
                let prevTime = 0;
                let lastBlur = 0;

                function frame(now) {
                    if (t0 === null) { t0 = now; prevTime = now; }
                    const t = now - t0;
                    if (t < windupMs) {
                        rotation = start - windup * easeInOutSine(t / windupMs);
                    } else {
                        const p = Math.min(1, (t - windupMs) / mainMs);
                        rotation = base + (delta + windup) * easeOutQuart(p);
                    }

                    const dt = Math.max(1, now - prevTime) / 1000;
                    const speed = Math.abs(rotation - prevRot) / dt;
                    prevRot = rotation;
                    prevTime = now;
                    const blur = quick ? 0 : Math.min(6, speed * 0.17);
                    if (Math.abs(blur - lastBlur) > 0.3 || (blur < 0.3 && lastBlur !== 0)) {
                        lastBlur = blur < 0.3 ? 0 : blur;
                        canvas.style.filter = lastBlur ? `blur(${lastBlur.toFixed(1)}px)` : '';
                    }

                    const idx = indexAtPointer();
                    if (idx !== lastIndex) {
                        lastIndex = idx;
                        if (onTick && now - lastTickAt > 38) {
                            lastTickAt = now;
                            onTick(speed);
                        }
                    }

                    draw();
                    if (t < windupMs + mainMs) {
                        requestAnimationFrame(frame);
                    } else {
                        rotation = start + delta;
                        canvas.style.filter = '';
                        draw();
                        resolve();
                    }
                }
                requestAnimationFrame(frame);
            });
        }

        resize();
        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(() => { face = null; draw(); });
        }

        return { setItems, setHighlight, spinTo, resize, indexAtPointer };
    }

    window.S360 = window.S360 || {};
    window.S360.createWheel = createWheel;
})();
