// js/reactions.js — reacciones en vivo (corazones, likes, emojis y comentarios)
// que flotan en la etapa de puja, al estilo de una transmisión en vivo.
(function () {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const HEART = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#fff" d="M12 21s-7.5-4.6-9.6-9.2C.9 8.5 2.8 4.5 6.6 4.5c2.1 0 3.9 1.2 5.4 3 1.5-1.8 3.3-3 5.4-3 3.8 0 5.7 4 4.2 7.3C19.5 16.4 12 21 12 21Z"/></svg>';
    const LIKE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#fff" d="M2 10.5h4V21H2zM8 21V10.2l4.6-7.4c.9-1.4 3-.6 2.8 1.1L14.8 9H20a2 2 0 0 1 2 2.3l-1.3 7.9A2.2 2.2 0 0 1 18.5 21z"/></svg>';

    const KINDS = {
        heart: () => `<span class="rx rx-badge is-heart">${HEART}</span>`,
        like: () => `<span class="rx rx-badge is-like">${LIKE}</span>`,
        clap: () => '<span class="rx rx-emoji">👏</span>',
        fire: () => '<span class="rx rx-emoji">🔥</span>',
        love: () => '<span class="rx rx-emoji">😍</span>',
        laugh: () => '<span class="rx rx-emoji">😂</span>',
        party: () => '<span class="rx rx-emoji">🎉</span>',
        wow: () => '<span class="rx rx-emoji">🤩</span>',
    };
    const AMBIENT = ['heart', 'heart', 'heart', 'like', 'like', 'fire', 'clap', 'love', 'laugh', 'party', 'wow'];

    const COMMENTS = [
        '¡Subo la oferta! 🔥', 'Ese premio es mío 😎', '¡Voy con todo! 💪', '¿Quién da más? 👀',
        '¡Qué buen premio! 😍', 'Ofrezco más puntos 🚀', '¡Nadie me gana hoy!', '👏👏👏',
        '¡Vamos que se puede! 🙌', 'Me lo merezco 😂', '¡Esto está que arde! 🔥', '¡Última oferta! ⏳',
        'Lo quiero, lo quiero ❤️', '¡Qué nervios! 😅',
    ];
    const AVATAR_TONES = [
        'linear-gradient(135deg,#8b6cff,#22d3ee)', 'linear-gradient(135deg,#f472b6,#fb7185)',
        'linear-gradient(135deg,#34d399,#0ea5e9)', 'linear-gradient(135deg,#fbbf24,#f97316)',
        'linear-gradient(135deg,#60a5fa,#6366f1)',
    ];

    const rand = (min, max) => min + Math.random() * (max - min);
    const pick = (list) => list[Math.floor(Math.random() * list.length)];

    function createReactions(stream, feed) {
        let running = false;
        let rxTimer = null;
        let cmTimer = null;
        let lastComment = '';

        function spawn(kind = pick(AMBIENT)) {
            if (reducedMotion) return;
            const wrap = document.createElement('div');
            wrap.innerHTML = KINDS[kind]();
            const el = wrap.firstElementChild;
            el.style.left = `${rand(4, 70)}%`;
            el.style.setProperty('--sway', `${rand(-3.5, 3.5).toFixed(2)}em`);
            el.style.setProperty('--tilt', `${rand(-18, 18).toFixed(0)}deg`);
            el.style.setProperty('--scale', rand(0.8, 1.25).toFixed(2));
            el.style.animationDuration = `${rand(3.4, 5.4).toFixed(2)}s`;
            el.addEventListener('animationend', () => el.remove(), { once: true });
            stream.appendChild(el);
        }

        function comment(text) {
            let msg = text;
            if (!msg) {
                do { msg = pick(COMMENTS); } while (msg === lastComment);
            }
            lastComment = msg;
            const el = document.createElement('div');
            el.className = 'live-comment';
            const avatar = document.createElement('span');
            avatar.className = 'live-avatar';
            avatar.style.background = pick(AVATAR_TONES);
            avatar.innerHTML = window.S360.icons.svg('user');
            const bubble = document.createElement('span');
            bubble.className = 'live-bubble';
            bubble.textContent = msg;
            el.append(avatar, bubble);
            feed.appendChild(el);
            while (feed.children.length > 4) feed.firstElementChild.remove();
            setTimeout(() => {
                el.classList.add('is-out');
                setTimeout(() => el.remove(), 500);
            }, 7000);
        }

        function burst(kind, count = 14) {
            for (let i = 0; i < count; i++) setTimeout(() => spawn(kind), i * 70);
        }

        function loopReactions() {
            if (!running) return;
            spawn();
            rxTimer = setTimeout(loopReactions, rand(280, 720));
        }

        function loopComments() {
            if (!running) return;
            comment();
            cmTimer = setTimeout(loopComments, rand(2200, 4200));
        }

        function start() {
            if (running) return;
            running = true;
            loopReactions();
            cmTimer = setTimeout(loopComments, 900);
        }

        function stop() {
            running = false;
            clearTimeout(rxTimer);
            clearTimeout(cmTimer);
        }

        function clear() {
            stop();
            stream.innerHTML = '';
            feed.innerHTML = '';
        }

        return { start, stop, clear, burst, comment };
    }

    window.S360 = window.S360 || {};
    window.S360.createReactions = createReactions;
})();
