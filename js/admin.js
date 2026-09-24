// js/admin.js
(function () {
    const loadingGate = document.getElementById('loadingGate');
    const adminApp = document.getElementById('adminApp');

    function showToast(message, type) {
        const el = document.createElement('div');
        el.className = `toast toast-${type}`;
        el.textContent = message;
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 3000);
    }

    function toLocalInputValue(isoString) {
        const d = new Date(isoString);
        const pad = (n) => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }

    // ---------- Guardia de sesión ----------
    async function init() {
        try {
            const estado = await Api.estadoSesion();
            if (!estado.is_admin) {
                window.location.href = 'login.html';
                return;
            }
        } catch (e) {
            window.location.href = 'login.html';
            return;
        }
        loadingGate.hidden = true;
        adminApp.hidden = false;
        cargarEvento();
        cargarPremios();
        cargarHistorial();
    }

    document.getElementById('logoutBtn').addEventListener('click', async () => {
        try { await Api.logout(); } catch (e) { /* noop */ }
        window.location.href = 'login.html';
    });

    // ---------- Evento ----------
    async function cargarEvento() {
        try {
            const { evento } = await Api.obtenerEvento();
            document.getElementById('evTitulo').value = evento.titulo;
            document.getElementById('evSubtitulo').value = evento.subtitulo;
            document.getElementById('evObjetivo').value = toLocalInputValue(evento.objetivo);
        } catch (e) {
            showToast('No se pudo cargar la configuración del evento.', 'error');
        }
    }

    document.getElementById('eventoForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const objetivoLocal = document.getElementById('evObjetivo').value;
        try {
            await Api.guardarEvento({
                titulo: document.getElementById('evTitulo').value,
                subtitulo: document.getElementById('evSubtitulo').value,
                objetivo: new Date(objetivoLocal).toISOString(),
            });
            showToast('Evento actualizado.', 'ok');
        } catch (err) {
            showToast(err.message || 'No se pudo guardar el evento.', 'error');
        }
    });

    // ---------- Premios ----------
    const premioForm = document.getElementById('premioForm');
    const premioSubmitBtn = document.getElementById('premioSubmitBtn');
    const premioCancelBtn = document.getElementById('premioCancelBtn');
    const formPremioTitulo = document.getElementById('formPremioTitulo');

    function resetPremioForm() {
        premioForm.reset();
        document.getElementById('premioId').value = '';
        document.getElementById('premioColor').value = '#8e44ad';
        document.getElementById('premioStock').value = -1;
        document.getElementById('premioPeso').value = 1;
        premioSubmitBtn.textContent = 'Agregar premio';
        formPremioTitulo.textContent = 'Agregar premio';
        premioCancelBtn.hidden = true;
    }

    premioCancelBtn.addEventListener('click', resetPremioForm);

    async function cargarPremios() {
        const tbody = document.getElementById('premiosTbody');
        const vacio = document.getElementById('premiosVacio');
        try {
            const { premios } = await Api.listarPremios();
            tbody.innerHTML = '';
            vacio.hidden = premios.length > 0;
            premios.forEach((p) => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><span class="swatch" style="background:${p.color}"></span>${p.icono || ''} ${escapeHtml(p.nombre)}</td>
                    <td>${p.peso}</td>
                    <td>${p.stock < 0 ? 'Ilimitado' : p.stock}</td>
                    <td class="row-actions">
                        <button class="btn btn-ghost btn-sm" data-action="editar" data-id="${p.id}">Editar</button>
                        <button class="btn btn-danger btn-sm" data-action="eliminar" data-id="${p.id}">Eliminar</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });

            tbody.querySelectorAll('[data-action="editar"]').forEach((btn) => {
                btn.addEventListener('click', () => editarPremio(btn.dataset.id, premios));
            });
            tbody.querySelectorAll('[data-action="eliminar"]').forEach((btn) => {
                btn.addEventListener('click', () => eliminarPremio(btn.dataset.id));
            });
        } catch (e) {
            showToast('No se pudieron cargar los premios.', 'error');
        }
    }

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function editarPremio(id, premios) {
        const p = premios.find((x) => x.id === id);
        if (!p) return;
        document.getElementById('premioId').value = p.id;
        document.getElementById('premioNombre').value = p.nombre;
        document.getElementById('premioDescripcion').value = p.descripcion || '';
        document.getElementById('premioColor').value = p.color || '#8e44ad';
        document.getElementById('premioIcono').value = p.icono || '';
        document.getElementById('premioPeso').value = p.peso || 1;
        document.getElementById('premioStock').value = p.stock ?? -1;
        formPremioTitulo.textContent = 'Editar premio';
        premioSubmitBtn.textContent = 'Guardar cambios';
        premioCancelBtn.hidden = false;
        premioForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    async function eliminarPremio(id) {
        if (!confirm('¿Eliminar este premio? Esta acción no se puede deshacer.')) return;
        try {
            await Api.eliminarPremio(id);
            showToast('Premio eliminado.', 'ok');
            cargarPremios();
        } catch (e) {
            showToast(e.message || 'No se pudo eliminar el premio.', 'error');
        }
    }

    premioForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('premioId').value;
        const payload = {
            nombre: document.getElementById('premioNombre').value.trim(),
            descripcion: document.getElementById('premioDescripcion').value.trim(),
            color: document.getElementById('premioColor').value,
            icono: document.getElementById('premioIcono').value.trim() || '🎁',
            peso: parseInt(document.getElementById('premioPeso').value, 10) || 1,
            stock: parseInt(document.getElementById('premioStock').value, 10),
        };

        try {
            if (id) {
                await Api.actualizarPremio({ id, ...payload });
                showToast('Premio actualizado.', 'ok');
            } else {
                await Api.crearPremio(payload);
                showToast('Premio agregado.', 'ok');
            }
            resetPremioForm();
            cargarPremios();
        } catch (err) {
            showToast(err.message || 'No se pudo guardar el premio.', 'error');
        }
    });

    // ---------- Historial ----------
    async function cargarHistorial() {
        const tbody = document.getElementById('historialTbody');
        const vacio = document.getElementById('historialVacio');
        try {
            const { historial } = await Api.historial();
            tbody.innerHTML = '';
            vacio.hidden = historial.length > 0;
            historial.slice(0, 30).forEach((h) => {
                const tr = document.createElement('tr');
                const fecha = new Date(h.timestamp).toLocaleString('es-CL');
                tr.innerHTML = `<td>${h.icono || ''} ${escapeHtml(h.premio_nombre)}</td><td>${fecha}</td>`;
                tbody.appendChild(tr);
            });
        } catch (e) {
            // Historial no es crítico; fallamos en silencio.
        }
    }

    init();
})();
