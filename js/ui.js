// js/ui.js — componentes de interfaz compartidos: íconos declarativos,
// toasts, modales, confirmaciones y formateadores.
(function () {
    const { svg } = window.S360.icons;

    function escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    // <i data-icon="gift" class="icon-lg"></i> → SVG del registro.
    function hydrateIcons(root = document) {
        root.querySelectorAll('i[data-icon]').forEach((el) => {
            const cls = ['icon', el.className].filter(Boolean).join(' ');
            el.outerHTML = svg(el.dataset.icon, cls);
        });
    }

    // ---------- Toasts ----------
    let stack;
    const TOAST_ICONS = { success: 'checkCircle', error: 'alert', info: 'info' };

    function toast({ type = 'info', title, message = '', ms = 3500 }) {
        if (!stack) {
            stack = document.createElement('div');
            stack.className = 'toast-stack';
            stack.setAttribute('role', 'status');
            stack.setAttribute('aria-live', 'polite');
            document.body.appendChild(stack);
        }
        const el = document.createElement('div');
        el.className = `toast toast-${type}`;
        el.style.setProperty('--toast-ms', `${ms}ms`);
        el.innerHTML = `
            <span class="toast-icon">${svg(TOAST_ICONS[type] || 'info')}</span>
            <div class="toast-body">
                <p class="toast-title">${escapeHtml(title)}</p>
                ${message ? `<p class="toast-msg">${escapeHtml(message)}</p>` : ''}
            </div>`;
        stack.appendChild(el);
        setTimeout(() => {
            el.classList.add('is-leaving');
            el.addEventListener('animationend', () => el.remove(), { once: true });
        }, ms);
    }

    // ---------- Modales ----------
    function openModal({ title, content, footer, size = '', onClose }) {
        const lastFocus = document.activeElement;
        const backdrop = document.createElement('div');
        backdrop.className = 'modal-backdrop';
        backdrop.innerHTML = `
            <div class="modal ${size}" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
                <div class="modal-header">
                    <h2 class="modal-title" id="modalTitle">${escapeHtml(title)}</h2>
                    <button type="button" class="btn btn-ghost btn-icon btn-sm" data-close aria-label="Cerrar">${svg('x')}</button>
                </div>
                <div class="modal-body"></div>
                <div class="modal-footer"></div>
            </div>`;
        const body = backdrop.querySelector('.modal-body');
        const foot = backdrop.querySelector('.modal-footer');
        typeof content === 'string' ? (body.innerHTML = content) : body.appendChild(content);
        if (footer) {
            typeof footer === 'string' ? (foot.innerHTML = footer) : foot.appendChild(footer);
        } else {
            foot.remove();
        }

        function close() {
            document.removeEventListener('keydown', onKey);
            backdrop.remove();
            if (lastFocus && lastFocus.focus) lastFocus.focus();
            if (onClose) onClose();
        }
        function onKey(e) {
            if (e.key === 'Escape') close();
        }
        backdrop.addEventListener('mousedown', (e) => {
            if (e.target === backdrop) close();
        });
        backdrop.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', close));
        document.addEventListener('keydown', onKey);
        document.body.appendChild(backdrop);

        const firstField = backdrop.querySelector('input:not([type=hidden]), textarea, select, .modal-footer .btn');
        (firstField || backdrop.querySelector('[data-close]')).focus();
        return { el: backdrop, body, close };
    }

    function confirmDialog({ title, message, confirmText = 'Confirmar', danger = false }) {
        return new Promise((resolve) => {
            let answered = false;
            const content = document.createElement('div');
            content.innerHTML = `
                ${danger ? `<div class="modal-confirm-icon">${svg('alert')}</div>` : ''}
                <p class="muted">${escapeHtml(message)}</p>`;
            const footer = document.createElement('div');
            footer.style.display = 'contents';
            footer.innerHTML = `
                <button type="button" class="btn btn-secondary" data-close>Cancelar</button>
                <button type="button" class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-ok>${escapeHtml(confirmText)}</button>`;
            const modal = openModal({
                title,
                content,
                footer,
                size: 'modal-sm',
                onClose: () => { if (!answered) resolve(false); },
            });
            modal.el.querySelector('[data-ok]').addEventListener('click', () => {
                answered = true;
                resolve(true);
                modal.close();
            });
        });
    }

    function setBusy(button, busy) {
        button.disabled = busy;
        if (busy) button.setAttribute('aria-busy', 'true');
        else button.removeAttribute('aria-busy');
    }

    // ---------- Formateadores ----------
    function countdown(targetMs) {
        const diff = Math.max(0, targetMs - Date.now());
        const total = Math.floor(diff / 1000);
        return {
            done: diff === 0,
            days: Math.floor(total / 86400),
            hours: Math.floor((total % 86400) / 3600),
            minutes: Math.floor((total % 3600) / 60),
            seconds: total % 60,
        };
    }

    const pad = (n) => String(n).padStart(2, '0');

    function formatDateTime(iso, opts = { dateStyle: 'long', timeStyle: 'short' }) {
        const d = new Date(iso);
        return isNaN(d) ? '—' : new Intl.DateTimeFormat('es-CL', opts).format(d);
    }

    function stockLabel(stock) {
        if (stock < 0) return 'Ilimitado';
        if (stock === 0) return 'Agotado';
        return `${stock} disponible${stock === 1 ? '' : 's'}`;
    }

    const ESTADOS = {
        preparacion: { label: 'En preparación', badge: 'badge-warning' },
        en_vivo: { label: 'En vivo', badge: 'badge-live' },
        finalizado: { label: 'Finalizado', badge: 'badge-neutral' },
    };

    function applyAccent(acento) {
        if (acento && acento !== 'aurora') document.documentElement.dataset.accent = acento;
        else delete document.documentElement.dataset.accent;
    }

    window.S360.ui = {
        escapeHtml, hydrateIcons, toast, openModal, confirmDialog, setBusy,
        countdown, pad, formatDateTime, stockLabel, ESTADOS, applyAccent,
    };
})();
