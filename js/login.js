// js/login.js — acceso al panel.
(function () {
    const { ui, icons, fx } = window.S360;
    const form = document.getElementById('loginForm');
    const input = document.getElementById('password');
    const btn = document.getElementById('loginBtn');
    const errorEl = document.getElementById('loginError');
    const card = document.querySelector('.login-card');
    const toggle = document.getElementById('togglePass');

    ui.hydrateIcons();
    fx.beams(document.getElementById('fxGrid'));
    fx.meteors(document.getElementById('fxMeteors'), 5);

    // Solo se permite volver a páginas propias (evita redirecciones abiertas).
    function nextUrl() {
        const next = new URLSearchParams(location.search).get('next') || '';
        return /^(admin|index)\.html(#[a-z-]+)?$/.test(next) ? next : 'admin.html';
    }

    function showError(message) {
        errorEl.innerHTML = `${icons.svg('alert', 'icon icon-sm')}${ui.escapeHtml(message)}`;
        errorEl.hidden = false;
        input.setAttribute('aria-invalid', 'true');
        card.classList.remove('is-shaking');
        void card.offsetWidth;
        card.classList.add('is-shaking');
    }

    toggle.addEventListener('click', () => {
        const visible = input.type === 'text';
        input.type = visible ? 'password' : 'text';
        toggle.innerHTML = icons.svg(visible ? 'eye' : 'eyeOff');
        toggle.setAttribute('aria-label', visible ? 'Mostrar contraseña' : 'Ocultar contraseña');
        toggle.setAttribute('aria-pressed', String(!visible));
        input.focus();
    });

    input.addEventListener('input', () => {
        errorEl.hidden = true;
        input.removeAttribute('aria-invalid');
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!input.value) {
            showError('Ingresa la contraseña de administración.');
            input.focus();
            return;
        }
        ui.setBusy(btn, true);
        try {
            await Api.login(input.value);
            window.location.replace(nextUrl());
        } catch (err) {
            ui.setBusy(btn, false);
            showError(err.status === 401 ? 'Contraseña incorrecta. Inténtalo nuevamente.' : 'No se pudo conectar con el servidor.');
            input.select();
        }
    });

    Api.estadoSesion()
        .then((r) => { if (r.is_admin) window.location.replace(nextUrl()); })
        .catch(() => {});
})();
