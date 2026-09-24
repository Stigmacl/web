// js/admin.js — panel de administración SUBASTA 360.
(function () {
    const { ui, icons, fx } = window.S360;
    const $ = (sel, root = document) => root.querySelector(sel);
    const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

    const VIEWS = ['dashboard', 'evento', 'premios', 'ruleta', 'historial', 'configuracion'];
    const HEX = /^#[0-9a-f]{6}$/i;
    const safeColor = (c) => (HEX.test(c || '') ? c : '#6a45ff');
    const SWATCHES = ['#6a45ff', '#2f6bff', '#0ea5e9', '#14b8a6', '#22c55e', '#eab308', '#f97316', '#ef4444', '#ec4899', '#a855f7'];
    const ACCENTS = [
        { key: 'aurora', name: 'Aurora', desc: 'Violeta y cian (por defecto)', g: 'linear-gradient(135deg,#8b6cff,#22d3ee)', glow: '#8b6cff' },
        { key: 'oceano', name: 'Océano', desc: 'Azul y turquesa', g: 'linear-gradient(135deg,#3b82f6,#2dd4bf)', glow: '#3b82f6' },
        { key: 'magenta', name: 'Magenta', desc: 'Púrpura y rosa', g: 'linear-gradient(135deg,#c084fc,#f472b6)', glow: '#c084fc' },
        { key: 'solar', name: 'Solar', desc: 'Ámbar y coral', g: 'linear-gradient(135deg,#fbbf24,#fb7185)', glow: '#fbbf24' },
    ];

    const store = { evento: null, premios: [], historial: [] };
    let eventoDirty = false;
    let adminWheel = null;

    const candidatos = () => store.premios.filter((p) => (p.stock ?? -1) !== 0);
    const pesoTotal = () => candidatos().reduce((sum, p) => sum + Math.max(1, Number(p.peso) || 1), 0);
    const probabilidad = (p) => ((p.stock ?? -1) === 0 ? 0 : (Math.max(1, Number(p.peso) || 1) / (pesoTotal() || 1)) * 100);
    const pct = (n) => `${n >= 10 || n === 0 ? Math.round(n) : n.toFixed(1)}%`;
    const premioById = (id) => store.premios.find((p) => p.id === id);

    function redirectLogin() {
        window.location.replace(`login.html?next=${encodeURIComponent(`admin.html${location.hash}`)}`);
    }

    function handleError(err, title) {
        if (err && err.status === 401) {
            ui.toast({ type: 'error', title: 'Tu sesión expiró', message: 'Vuelve a ingresar para continuar.' });
            setTimeout(redirectLogin, 1200);
            return;
        }
        ui.toast({ type: 'error', title, message: err && err.message });
    }

    function relativeTime(iso) {
        const diff = (new Date(iso).getTime() - Date.now()) / 1000;
        if (isNaN(diff)) return '';
        const rtf = new Intl.RelativeTimeFormat('es', { numeric: 'auto' });
        const abs = Math.abs(diff);
        if (abs < 60) return rtf.format(Math.round(diff), 'second');
        if (abs < 3600) return rtf.format(Math.round(diff / 60), 'minute');
        if (abs < 86400) return rtf.format(Math.round(diff / 3600), 'hour');
        return rtf.format(Math.round(diff / 86400), 'day');
    }

    function chip(premioLike, cls = '') {
        const color = safeColor(premioLike && premioLike.color);
        return `<span class="prize-chip ${cls}" style="--prize:${color}">${icons.prize(premioLike && premioLike.icono)}</span>`;
    }

    function emptyState({ icon, title, text, action = '' }) {
        return `<div class="empty"><span class="empty-icon">${icons.svg(icon)}</span>
            <p class="empty-title">${ui.escapeHtml(title)}</p><p class="empty-text">${ui.escapeHtml(text)}</p>${action}</div>`;
    }

    // ---------- Router ----------
    function currentView() {
        const v = location.hash.slice(1);
        return VIEWS.includes(v) ? v : 'dashboard';
    }

    function showView() {
        const view = currentView();
        $$('.view').forEach((s) => s.classList.toggle('is-active', s.id === `view-${view}`));
        $$('.sidebar-nav a').forEach((a) => {
            const on = a.dataset.view === view;
            a.classList.toggle('is-active', on);
            if (on) a.setAttribute('aria-current', 'page');
            else a.removeAttribute('aria-current');
        });
        const title = $(`#view-${view}`).dataset.title;
        $('#viewTitle').textContent = title;
        $('#crumb').textContent = title;
        document.title = `${title} · SUBASTA 360`;
        closeSidebar();
        if (view === 'dashboard') renderDashboard();
    }

    // ---------- Sidebar móvil ----------
    const sidebar = $('#sidebar');
    const scrim = $('#scrim');
    const menuBtn = $('#menuBtn');
    function openSidebar() {
        sidebar.classList.add('is-open');
        scrim.hidden = false;
        menuBtn.setAttribute('aria-expanded', 'true');
    }
    function closeSidebar() {
        sidebar.classList.remove('is-open');
        scrim.hidden = true;
        menuBtn.setAttribute('aria-expanded', 'false');
    }
    menuBtn.addEventListener('click', openSidebar);
    scrim.addEventListener('click', closeSidebar);
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && sidebar.classList.contains('is-open')) closeSidebar();
    });

    $('#logoutBtn').addEventListener('click', async () => {
        try { await Api.logout(); } catch (e) { /* la sesión se descarta igual */ }
        window.location.replace('login.html');
    });

    // ---------- Evento ----------
    function splitDate(iso) {
        const d = new Date(iso);
        if (isNaN(d)) return { fecha: '', hora: '' };
        return {
            fecha: `${d.getFullYear()}-${ui.pad(d.getMonth() + 1)}-${ui.pad(d.getDate())}`,
            hora: `${ui.pad(d.getHours())}:${ui.pad(d.getMinutes())}`,
        };
    }

    function setEstadoBadge(el, estado) {
        const e = ui.ESTADOS[estado] || ui.ESTADOS.preparacion;
        el.className = `badge badge-dot ${e.badge}`;
        el.textContent = e.label;
    }

    function fillEventoForm() {
        const ev = store.evento;
        const { fecha, hora } = splitDate(ev.objetivo);
        $('#evTitulo').value = ev.titulo || '';
        $('#evSubtitulo').value = ev.subtitulo || '';
        $('#evBienvenida').value = ev.bienvenida || '';
        $('#evFecha').value = fecha;
        $('#evHora').value = hora;
        const radio = $(`input[name="estado"][value="${ev.estado}"]`) || $('#estPrep');
        radio.checked = true;
        $('#evSorpresa').checked = ev.sorpresa !== false;
        eventoDirty = false;
        renderPreview();
    }

    function formObjetivo() {
        const fecha = $('#evFecha').value;
        const hora = $('#evHora').value;
        if (!fecha || !hora) return null;
        const d = new Date(`${fecha}T${hora}`);
        return isNaN(d) ? null : d;
    }

    function renderPreview() {
        $('#pvTitulo').textContent = $('#evTitulo').value.trim() || 'Nombre del evento';
        $('#pvBienvenida').textContent = $('#evBienvenida').value.trim();
        const d = formObjetivo();
        $('#pvFecha').textContent = d ? ui.formatDateTime(d.toISOString()) : '';
        const estado = ($('input[name="estado"]:checked') || {}).value;
        setEstadoBadge($('#pvEstado'), estado);
    }

    function renderEventoChrome() {
        const ev = store.evento;
        ui.applyAccent(ev.acento);
        setEstadoBadge($('#topEstado'), ev.estado);
        setEstadoBadge($('#dashEstado'), ev.estado);
        $('#dashTitulo').textContent = ev.titulo;
        $('#dashSubtitulo').textContent = ev.subtitulo || '';
        $('#dashFecha').textContent = ui.formatDateTime(ev.objetivo);
        if (!eventoDirty) fillEventoForm();
        renderAccent();
    }

    function tickCountdown() {
        if (!store.evento) return;
        const c = ui.countdown(new Date(store.evento.objetivo).getTime());
        const box = $('#dashCountdown');
        ['days', 'hours', 'minutes', 'seconds'].forEach((u) => { $(`[data-unit="${u}"]`, box).textContent = ui.pad(c[u]); });
        $('#dashCaption').textContent = c.done
            ? (store.evento.estado === 'finalizado' ? 'Evento finalizado' : 'Evento en curso')
            : 'Comienza en';
    }

    function setupEventoForm() {
        const form = $('#eventoForm');
        form.addEventListener('input', () => {
            eventoDirty = true;
            renderPreview();
        });
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const errorEl = $('#eventoError');
            const titulo = $('#evTitulo').value.trim();
            const objetivo = formObjetivo();
            errorEl.hidden = true;
            if (!titulo || !objetivo) {
                errorEl.innerHTML = `${icons.svg('alert', 'icon icon-sm')}${!titulo ? 'El evento necesita un nombre.' : 'Indica una fecha y hora válidas.'}`;
                errorEl.hidden = false;
                (!titulo ? $('#evTitulo') : $('#evFecha')).focus();
                return;
            }
            const btn = $('#eventoSaveBtn');
            ui.setBusy(btn, true);
            try {
                const { evento } = await Api.guardarEvento({
                    titulo,
                    subtitulo: $('#evSubtitulo').value.trim(),
                    bienvenida: $('#evBienvenida').value.trim(),
                    estado: $('input[name="estado"]:checked').value,
                    sorpresa: $('#evSorpresa').checked,
                    objetivo: objetivo.toISOString(),
                });
                store.evento = evento;
                eventoDirty = false;
                renderEventoChrome();
                tickCountdown();
                ui.toast({ type: 'success', title: 'Evento actualizado', message: 'El escenario se actualizará en segundos.' });
            } catch (err) {
                handleError(err, 'No se pudo guardar el evento');
            } finally {
                ui.setBusy(btn, false);
            }
        });
    }

    // ---------- Dashboard ----------
    function renderDashboard() {
        const disponibles = candidatos().length;
        fx.countUp($('#statTotal'), store.premios.length);
        fx.countUp($('#statDisponibles'), disponibles);
        fx.countUp($('#statEntregados'), store.historial.length);
        $('#statRuleta').textContent = disponibles ? 'Lista para girar' : 'Sin premios';
        $('#statRuletaFoot').textContent = disponibles ? `${disponibles} premio${disponibles === 1 ? '' : 's'} en juego` : 'Agrega premios o stock';

        const last = store.historial[0];
        $('#lastWinner').innerHTML = last
            ? `<div class="last-winner-body">
                    <span class="last-winner-trophy">${icons.svg('trophy', 'icon icon-lg')}</span>
                    <div>
                        <p class="last-winner-name">${last.participante ? ui.escapeHtml(last.participante) : 'Ganador sin asignar'}</p>
                        <p class="last-winner-prize">${chip({ ...premioById(last.premio_id), icono: last.icono }, 'is-sm')}${ui.escapeHtml(last.premio_nombre)}</p>
                        <p class="last-winner-time">${ui.escapeHtml(relativeTime(last.timestamp))}</p>
                    </div>
               </div>`
            : emptyState({ icon: 'trophy', title: 'Aún no hay ganadores', text: 'El primer giro de la ruleta aparecerá aquí.' });

        const recent = store.historial.slice(0, 5);
        $('#activityList').innerHTML = recent.length
            ? recent.map((h) => `<li>
                    ${chip({ ...premioById(h.premio_id), icono: h.icono }, 'is-sm')}
                    <div class="activity-main">
                        <p>${h.participante ? `<strong>${ui.escapeHtml(h.participante)}</strong> ganó ${ui.escapeHtml(h.premio_nombre)}` : `Salió <strong>${ui.escapeHtml(h.premio_nombre)}</strong>`}</p>
                        <p class="activity-sub">${h.participante ? 'Ganador confirmado' : 'Ganador sin asignar'}</p>
                    </div>
                    <time datetime="${ui.escapeHtml(h.timestamp)}">${ui.escapeHtml(relativeTime(h.timestamp))}</time>
               </li>`).join('')
            : `<li>${emptyState({ icon: 'activity', title: 'Sin actividad todavía', text: 'Los giros de la ruleta se registran automáticamente.' })}</li>`;
    }

    // ---------- Premios ----------
    function estadoPremio(p) {
        if (p.stock === 0) return '<span class="badge badge-dot badge-danger">Agotado</span>';
        if (p.stock > 0 && p.stock <= 2) return '<span class="badge badge-dot badge-warning">Últimas unidades</span>';
        return '<span class="badge badge-dot badge-success">Disponible</span>';
    }

    function renderPremios() {
        const all = store.premios;
        const q = $('#premioSearch').value.trim().toLowerCase();
        const list = q ? all.filter((p) => `${p.nombre} ${p.descripcion || ''}`.toLowerCase().includes(q)) : all;
        const agotados = all.filter((p) => p.stock === 0).length;
        const ilimitados = all.filter((p) => p.stock < 0).length;
        $('#navPremiosCount').textContent = all.length;
        $('#premiosSummary').innerHTML = `
            <span class="summary-chip">Total <strong>${all.length}</strong></span>
            <span class="summary-chip">En ruleta <strong>${candidatos().length}</strong></span>
            <span class="summary-chip">Agotados <strong>${agotados}</strong></span>
            <span class="summary-chip">Ilimitados <strong>${ilimitados}</strong></span>`;

        const empty = $('#premiosEmpty');
        const table = $('#premiosTable');
        if (!list.length) {
            table.hidden = true;
            empty.hidden = false;
            empty.innerHTML = all.length
                ? emptyState({ icon: 'gift', title: 'Sin resultados', text: `No hay premios que coincidan con “${q}”.` })
                : emptyState({
                    icon: 'gift',
                    title: 'Aún no hay premios',
                    text: 'Crea el primer premio para que aparezca en el escenario y en la ruleta.',
                    action: `<button type="button" class="btn btn-primary" data-new-premio>${icons.svg('plus')}Crear premio</button>`,
                });
            return;
        }
        table.hidden = false;
        empty.hidden = true;
        $('#premiosTbody').innerHTML = list.map((p) => {
            const prob = probabilidad(p);
            const color = safeColor(p.color);
            const stock = p.stock < 0
                ? '<span class="badge badge-accent">Ilimitado</span>'
                : `<div class="stock-stepper">
                        <button type="button" class="btn btn-secondary" data-stock="-1" data-id="${ui.escapeHtml(p.id)}" aria-label="Restar stock de ${ui.escapeHtml(p.nombre)}" ${p.stock <= 0 ? 'disabled' : ''}>−</button>
                        <span class="stock-value">${p.stock}</span>
                        <button type="button" class="btn btn-secondary" data-stock="1" data-id="${ui.escapeHtml(p.id)}" aria-label="Sumar stock de ${ui.escapeHtml(p.nombre)}">+</button>
                   </div>`;
            return `<tr>
                <td class="cell-main"><div class="cell-prize">${chip(p)}<div>
                    <p class="cell-prize-name">${ui.escapeHtml(p.nombre)}</p>
                    <p class="cell-prize-desc">${ui.escapeHtml(p.descripcion || 'Sin descripción')}</p></div></div></td>
                <td data-label="Stock">${stock}</td>
                <td data-label="Probabilidad"><div class="odds-cell" style="--prize:${color}">
                    <span>Peso ${p.peso} · ${prob ? pct(prob) : 'Fuera de ruleta'}</span>
                    <div class="bar"><i style="width:${prob.toFixed(1)}%"></i></div></div></td>
                <td data-label="Estado">${estadoPremio(p)}</td>
                <td class="t-right" data-label="Acciones"><div class="row-actions">
                    <button type="button" class="btn btn-ghost btn-icon" data-edit="${ui.escapeHtml(p.id)}" aria-label="Editar ${ui.escapeHtml(p.nombre)}" title="Editar">${icons.svg('pencil')}</button>
                    <button type="button" class="btn btn-ghost btn-icon" data-delete="${ui.escapeHtml(p.id)}" aria-label="Eliminar ${ui.escapeHtml(p.nombre)}" title="Eliminar">${icons.svg('trash')}</button>
                </div></td>
            </tr>`;
        }).join('');
    }

    async function changeStock(id, delta, button) {
        const p = premioById(id);
        if (!p || p.stock < 0) return;
        const stock = Math.max(0, p.stock + delta);
        button.disabled = true;
        try {
            await Api.actualizarPremio({ id, stock });
            p.stock = stock;
            renderAllPremios();
        } catch (err) {
            handleError(err, 'No se pudo actualizar el stock');
            button.disabled = false;
        }
    }

    async function deletePremio(id) {
        const p = premioById(id);
        if (!p) return;
        const ok = await ui.confirmDialog({
            title: 'Eliminar premio',
            message: `“${p.nombre}” se eliminará de forma permanente. El historial conserva los giros ya registrados.`,
            confirmText: 'Eliminar premio',
            danger: true,
        });
        if (!ok) return;
        try {
            await Api.eliminarPremio(id);
            store.premios = store.premios.filter((x) => x.id !== id);
            renderAllPremios();
            ui.toast({ type: 'success', title: 'Premio eliminado' });
        } catch (err) {
            handleError(err, 'No se pudo eliminar el premio');
        }
    }

    function openPremioModal(premio) {
        const form = $('#premioFormTpl').content.firstElementChild.cloneNode(true);
        const isEmoji = premio && premio.icono && !premio.icono.startsWith('icon:');
        let icono = premio ? premio.icono : 'icon:gift';
        let color = premio ? safeColor(premio.color) : SWATCHES[0];

        const f = {
            nombre: $('#pNombre', form),
            descripcion: $('#pDescripcion', form),
            emoji: $('#pEmoji', form),
            peso: $('#pPeso', form),
            stock: $('#pStock', form),
            ilimitado: $('#pIlimitado', form),
            error: $('[data-error]', form),
        };
        f.nombre.value = premio ? premio.nombre : '';
        f.descripcion.value = premio ? premio.descripcion || '' : '';
        f.emoji.value = isEmoji ? premio.icono : '';
        f.peso.value = premio ? premio.peso : 1;
        f.ilimitado.checked = premio ? premio.stock < 0 : false;
        f.stock.value = premio && premio.stock >= 0 ? premio.stock : 1;
        f.stock.disabled = f.ilimitado.checked;

        const iconsBox = $('[data-icons]', form);
        Object.entries(icons.PRIZE_ICONS).forEach(([key, label]) => {
            const b = document.createElement('button');
            b.type = 'button';
            b.className = 'icon-option';
            b.setAttribute('role', 'radio');
            b.setAttribute('aria-label', label);
            b.title = label;
            b.dataset.value = `icon:${key}`;
            b.innerHTML = icons.svg(key);
            iconsBox.appendChild(b);
        });

        const swatchBox = $('[data-swatches]', form);
        swatchBox.innerHTML = SWATCHES.map((c) => `<button type="button" class="swatch" role="radio" aria-label="Color ${c}" data-value="${c}" style="--c:${c}"></button>`).join('')
            + `<label class="swatch swatch-custom" title="Color personalizado"><span class="sr-only">Color personalizado</span><input type="color" value="${color}"></label>`;

        function oddsFor() {
            const peso = Math.max(1, parseInt(f.peso.value, 10) || 1);
            const stock = f.ilimitado.checked ? -1 : parseInt(f.stock.value, 10) || 0;
            if (stock === 0) return 0;
            const others = candidatos().filter((p) => !premio || p.id !== premio.id)
                .reduce((sum, p) => sum + Math.max(1, Number(p.peso) || 1), 0);
            return (peso / (others + peso)) * 100;
        }

        function sync() {
            $$('.icon-option', iconsBox).forEach((b) => b.setAttribute('aria-checked', String(!f.emoji.value.trim() && b.dataset.value === icono)));
            $$('.swatch[data-value]', swatchBox).forEach((b) => b.setAttribute('aria-checked', String(b.dataset.value.toLowerCase() === color.toLowerCase())));
            const current = f.emoji.value.trim() || icono;
            const preview = $('[data-preview]', form);
            preview.style.setProperty('--prize', color);
            $('[data-preview-icon]', form).innerHTML = icons.prize(current);
            $('[data-preview-name]', form).textContent = f.nombre.value.trim() || 'Nuevo premio';
            const stockTxt = f.ilimitado.checked ? 'Ilimitado' : ui.stockLabel(parseInt(f.stock.value, 10) || 0);
            $('[data-preview-meta]', form).textContent = `${stockTxt} · Peso ${Math.max(1, parseInt(f.peso.value, 10) || 1)}`;
            $('[data-odds]', form).textContent = `Probabilidad estimada: ${pct(oddsFor())}`;
        }

        iconsBox.addEventListener('click', (e) => {
            const b = e.target.closest('.icon-option');
            if (!b) return;
            icono = b.dataset.value;
            f.emoji.value = '';
            sync();
        });
        swatchBox.addEventListener('click', (e) => {
            const b = e.target.closest('.swatch[data-value]');
            if (!b) return;
            color = b.dataset.value;
            sync();
        });
        $('.swatch-custom input', swatchBox).addEventListener('input', (e) => {
            color = e.target.value;
            sync();
        });
        f.ilimitado.addEventListener('change', () => {
            f.stock.disabled = f.ilimitado.checked;
            sync();
        });
        form.addEventListener('input', sync);
        sync();

        const footer = document.createElement('div');
        footer.style.display = 'contents';
        footer.innerHTML = `<button type="button" class="btn btn-secondary" data-close>Cancelar</button>
            <button type="submit" class="btn btn-primary" data-save>${icons.svg('checkCircle')}${premio ? 'Guardar cambios' : 'Crear premio'}</button>`;
        const modal = ui.openModal({ title: premio ? 'Editar premio' : 'Nuevo premio', content: form, footer });
        const saveBtn = $('[data-save]', modal.el);

        async function save(e) {
            if (e) e.preventDefault();
            const nombre = f.nombre.value.trim();
            f.error.hidden = true;
            if (!nombre) {
                f.error.innerHTML = `${icons.svg('alert', 'icon icon-sm')}El premio necesita un nombre.`;
                f.error.hidden = false;
                f.nombre.focus();
                return;
            }
            const payload = {
                nombre,
                descripcion: f.descripcion.value.trim(),
                color,
                icono: f.emoji.value.trim() || icono,
                peso: Math.max(1, parseInt(f.peso.value, 10) || 1),
                stock: f.ilimitado.checked ? -1 : Math.max(0, parseInt(f.stock.value, 10) || 0),
            };
            ui.setBusy(saveBtn, true);
            try {
                if (premio) await Api.actualizarPremio({ id: premio.id, ...payload });
                else await Api.crearPremio(payload);
                modal.close();
                ui.toast({ type: 'success', title: premio ? 'Premio actualizado' : 'Premio creado', message: nombre });
                await loadPremios();
                renderAllPremios();
            } catch (err) {
                ui.setBusy(saveBtn, false);
                handleError(err, 'No se pudo guardar el premio');
            }
        }
        form.addEventListener('submit', save);
        saveBtn.addEventListener('click', save);
    }

    function setupPremios() {
        $('#newPremioBtn').addEventListener('click', () => openPremioModal(null));
        $('#premioSearch').addEventListener('input', renderPremios);
        $('#view-premios').addEventListener('click', (e) => {
            const edit = e.target.closest('[data-edit]');
            const del = e.target.closest('[data-delete]');
            const stock = e.target.closest('[data-stock]');
            if (e.target.closest('[data-new-premio]')) openPremioModal(null);
            else if (edit) openPremioModal(premioById(edit.dataset.edit));
            else if (del) deletePremio(del.dataset.delete);
            else if (stock) changeStock(stock.dataset.id, Number(stock.dataset.stock), stock);
        });
    }

    // ---------- Ruleta ----------
    function renderRuleta() {
        const list = candidatos();
        if (!adminWheel) adminWheel = S360.createWheel($('#adminWheel'));
        adminWheel.setItems(list.map((p) => ({ ...p, color: safeColor(p.color) })));
        const estado = $('#ruletaEstado');
        estado.className = `badge badge-dot ${list.length ? 'badge-success' : 'badge-warning'}`;
        estado.textContent = list.length ? 'Lista' : 'Sin premios';
        $('#oddsList').innerHTML = list.length
            ? list
                .map((p) => ({ p, prob: probabilidad(p) }))
                .sort((a, b) => b.prob - a.prob)
                .map(({ p, prob }) => `<li style="--prize:${safeColor(p.color)}">
                    <div class="odds-row">${chip(p, 'is-sm')}<span class="name">${ui.escapeHtml(p.nombre)}</span><span class="pct">${pct(prob)}</span></div>
                    <div class="bar"><i style="width:${prob.toFixed(1)}%"></i></div></li>`)
                .join('')
            : `<li>${emptyState({ icon: 'wheel', title: 'La ruleta está vacía', text: 'Agrega premios con stock para que aparezcan aquí.' })}</li>`;
    }

    // ---------- Historial ----------
    function renderHistorial() {
        const list = store.historial;
        const asignados = list.filter((h) => h.participante).length;
        $('#historialSummary').innerHTML = `
            <span class="summary-chip">Giros <strong>${list.length}</strong></span>
            <span class="summary-chip">Con ganador <strong>${asignados}</strong></span>
            <span class="summary-chip">Sin asignar <strong>${list.length - asignados}</strong></span>`;
        const empty = $('#historialEmpty');
        const table = $('#historialTbody').closest('table');
        table.hidden = !list.length;
        empty.hidden = !!list.length;
        if (!list.length) {
            empty.innerHTML = emptyState({ icon: 'history', title: 'Sin giros registrados', text: 'Cada giro de la ruleta queda registrado aquí con fecha, premio y ganador.' });
            return;
        }
        $('#historialTbody').innerHTML = list.map((h, i) => `<tr>
            <td class="index-cell" data-label="#">${list.length - i}</td>
            <td data-label="Fecha">${ui.escapeHtml(ui.formatDateTime(h.timestamp, { dateStyle: 'medium', timeStyle: 'short' }))}</td>
            <td data-label="Ganador" class="winner-cell ${h.participante ? '' : 'is-empty'}">${h.participante ? ui.escapeHtml(h.participante) : 'Sin asignar'}</td>
            <td data-label="Premio"><div class="cell-prize">${chip({ ...premioById(h.premio_id), icono: h.icono }, 'is-sm')}<span>${ui.escapeHtml(h.premio_nombre)}</span></div></td>
        </tr>`).join('');
    }

    // ---------- Configuración visual ----------
    function renderAccent() {
        const current = (store.evento && store.evento.acento) || 'aurora';
        $('#accentGrid').innerHTML = ACCENTS.map((a) => `
            <button type="button" class="accent-option" role="radio" aria-checked="${a.key === current}" data-accent="${a.key}">
                <span class="accent-swatch" style="--g:${a.g};--glow:${a.glow}"></span>
                <span><span class="accent-name">${a.name}</span><br><span class="accent-desc">${a.desc}</span></span>
            </button>`).join('');
    }

    function setupAccent() {
        $('#accentGrid').addEventListener('click', async (e) => {
            const b = e.target.closest('[data-accent]');
            if (!b || b.getAttribute('aria-checked') === 'true') return;
            try {
                const { evento } = await Api.guardarEvento({ acento: b.dataset.accent });
                store.evento = evento;
                renderEventoChrome();
                ui.toast({ type: 'success', title: 'Identidad visual actualizada', message: 'El escenario usará el nuevo acento.' });
            } catch (err) {
                handleError(err, 'No se pudo cambiar el acento');
            }
        });
    }

    // ---------- Datos ----------
    async function loadEvento() { store.evento = (await Api.obtenerEvento()).evento; }
    async function loadPremios() { store.premios = (await Api.listarPremios()).premios; }
    async function loadHistorial() { store.historial = (await Api.historial()).historial; }

    function renderAllPremios() {
        renderPremios();
        renderRuleta();
        if (currentView() === 'dashboard') renderDashboard();
    }

    async function refreshLive() {
        if (document.hidden || document.querySelector('.modal-backdrop')) return;
        try {
            const before = JSON.stringify([store.premios, store.historial]);
            await Promise.all([loadPremios(), loadHistorial()]);
            if (before !== JSON.stringify([store.premios, store.historial])) {
                renderAllPremios();
                renderHistorial();
            }
        } catch (err) {
            if (err.status === 401) handleError(err);
        }
    }

    async function init() {
        try {
            if (!(await Api.estadoSesion()).is_admin) return redirectLogin();
        } catch (e) {
            return redirectLogin();
        }

        ui.hydrateIcons();
        $('#app').hidden = false;
        setupEventoForm();
        setupPremios();
        setupAccent();
        window.addEventListener('hashchange', showView);

        try {
            await Promise.all([loadEvento(), loadPremios(), loadHistorial()]);
        } catch (err) {
            handleError(err, 'No se pudieron cargar los datos');
        }
        if (store.evento) renderEventoChrome();
        renderPremios();
        renderRuleta();
        renderHistorial();
        showView();
        tickCountdown();
        setInterval(tickCountdown, 1000);
        setInterval(refreshLive, 15000);
        $('#gate').classList.add('is-done');
    }

    init();
})();
