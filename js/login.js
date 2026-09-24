// js/login.js
(function () {
    const form = document.getElementById('loginForm');
    const btn = document.getElementById('loginBtn');

    function showToast(message, type) {
        const el = document.createElement('div');
        el.className = `toast toast-${type}`;
        el.textContent = message;
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 3000);
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const password = document.getElementById('password').value;
        btn.disabled = true;
        btn.textContent = 'Ingresando…';
        try {
            await Api.login(password);
            window.location.href = 'admin.html';
        } catch (err) {
            showToast(err.message || 'No se pudo iniciar sesión.', 'error');
            btn.disabled = false;
            btn.textContent = 'Ingresar';
        }
    });

    // Si ya está logueado, saltar directo al panel.
    Api.estadoSesion().then((r) => {
        if (r.is_admin) window.location.href = 'admin.html';
    }).catch(() => {});
})();
