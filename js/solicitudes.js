/* 
   Solicitudes Controller — Admin Logic (SQL + Log + Notificaciones)
   Diseño del respaldo original + lógica SQL completa.
   
   Funcionalidades:
   ✓ Ver solicitudes pendientes e historial
   ✓ Aprobar con categoría final + comentario obligatorio
   ✓ Rechazar con comentario obligatorio
   ✓ Reincorporar con comentario obligatorio
   ✓ Log de auditoría visible para todos los admins
   ✓ Toast de confirmación (sin alert())
*/

let currentTab    = 'PENDIENTE';
let allRequests   = [];
let selectedCategory = null;

document.addEventListener('DOMContentLoaded', () => {
    const userRole  = sessionStorage.getItem('userRole');
    const loggedIn  = sessionStorage.getItem('loggedInSupervisorName');
    const isAdmin   = userRole === 'admin' || (loggedIn && (loggedIn.includes('Administrador') || loggedIn.toUpperCase() === 'ADMIN'));

    if (!loggedIn || !isAdmin) {
        document.body.innerHTML = `
            <div class="w-full h-screen flex items-center justify-center bg-slate-100">
                <div class="text-center p-10 bg-white rounded-[2rem] shadow-2xl border border-slate-100 max-w-md">
                    <div class="w-20 h-20 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                        <i class="fa-solid fa-shield-halved text-3xl"></i>
                    </div>
                    <h2 class="text-2xl font-black text-slate-800 mb-4 uppercase tracking-tight">Acceso Denegado</h2>
                    <p class="text-slate-500 font-medium leading-relaxed mb-8">Esta sección es exclusiva para el perfil de <span class="text-[#004b87] font-black">Administración</span>.</p>
                    <a href="index.html" class="inline-flex items-center gap-2 bg-[#004b87] text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg">
                        <i class="fa-solid fa-house"></i> Volver al Inicio
                    </a>
                </div>
            </div>`;
        return;
    }

    window.addEventListener('db_ready', initSolicitudes);
    // Fallback si db_ready ya se disparó
    setTimeout(() => {
        if (allRequests.length === 0) initSolicitudes();
    }, 1500);
});

async function initSolicitudes() {
    await loadRequests();
    renderView();
}

async function loadRequests() {
    try {
        const res = await fetch('api/manage_requests.php?action=list');
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        allRequests = Array.isArray(data) ? data : [];
    } catch(e) {
        console.error('Error al cargar solicitudes:', e);
        allRequests = [];
    }
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────
window.setTab = function(tab) {
    currentTab = tab;
    renderView();
};

// ─── Render principal ─────────────────────────────────────────────────────────
function renderView() {
    const container  = document.getElementById('requests-container');
    const emptyState = document.getElementById('empty-state');
    const tPending   = document.getElementById('tab-pending');
    const tHistory   = document.getElementById('tab-history');
    const tLog       = document.getElementById('tab-log');

    if (!container) return;

    // Estilos de tabs
    const baseActive   = 'px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all shadow-lg flex items-center gap-3';
    const baseInactive = 'px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all shadow-md bg-white border border-slate-100 text-slate-400 hover:text-[#004b87] flex items-center gap-3';

    if (tPending) tPending.className = currentTab === 'PENDIENTE'  ? `${baseActive} bg-[#004b87] text-white`     : baseInactive;
    if (tHistory) tHistory.className = currentTab === 'HISTORIAL'  ? `${baseActive} bg-emerald-500 text-white`   : baseInactive;
    if (tLog)     tLog.className     = currentTab === 'LOG'        ? `${baseActive} bg-slate-700 text-white`     : baseInactive;

    container.innerHTML = '';

    if (currentTab === 'LOG') {
        renderLogView(container, emptyState);
        return;
    }

    const filtered = currentTab === 'PENDIENTE'
        ? allRequests.filter(r => r.status === 'PENDIENTE')
        : allRequests.filter(r => r.status !== 'PENDIENTE');

    if (filtered.length === 0) {
        if (emptyState) emptyState.classList.remove('hidden');
        return;
    }
    if (emptyState) emptyState.classList.add('hidden');

    filtered
        .slice()
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .forEach(req => {
            const card = document.createElement('div');
            card.className = 'bg-white rounded-[2rem] p-8 border border-slate-100 shadow-[0_10px_40px_rgba(0,0,0,0.03)] hover:shadow-2xl transition-all duration-500 relative flex flex-col md:flex-row gap-8 items-start md:items-center group overflow-hidden';

            const statusColor = req.status === 'PENDIENTE'
                ? 'bg-amber-500'
                : (req.status === 'APROBADA' ? 'bg-emerald-500' : (req.status === 'REINCORPORADA' ? 'bg-blue-500' : 'bg-rose-500'));

            card.innerHTML = `
                <div class="absolute left-0 top-0 w-1.5 h-full ${statusColor}"></div>

                <!-- Ejecutivo -->
                <div class="flex items-center gap-5 w-full md:w-64">
                    <div class="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-[#004b87] font-black text-xl group-hover:bg-[#004b87] group-hover:text-white transition-all shadow-sm">
                        ${(req.nombre || '?').charAt(0).toUpperCase()}
                    </div>
                    <div class="min-w-0">
                        <p class="text-[9px] font-black text-[#f37021] uppercase tracking-widest mb-1">Ejecutivo</p>
                        <h4 class="font-black text-slate-800 text-sm truncate uppercase leading-tight">${req.nombre}</h4>
                        <p class="text-[10px] font-mono text-slate-400 font-bold mt-1">${req.rut}</p>
                    </div>
                </div>

                <!-- Detalle -->
                <div class="flex-1 min-w-0">
                    <div class="grid grid-cols-2 lg:grid-cols-3 gap-6">
                        <div>
                            <p class="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Solicitado por</p>
                            <p class="text-[10px] font-black text-slate-700 uppercase"><i class="fa-solid fa-user-tie text-[#004b87] mr-1"></i> ${req.supervisor}</p>
                        </div>
                        <div>
                            <p class="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Fecha Efectiva</p>
                            <p class="text-[10px] font-black text-slate-700 uppercase"><i class="fa-solid fa-calendar-day text-[#f37021] mr-1"></i> ${req.fecha_egreso || '—'}</p>
                        </div>
                        <div>
                            <p class="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Categoría Propuesta</p>
                            <span class="text-[9px] font-black px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 uppercase">${req.categoria_propuesta}</span>
                        </div>
                    </div>
                    <div class="mt-5 p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <p class="text-[8px] font-black text-slate-400 uppercase tracking-[0.15em] mb-2 flex items-center gap-2">
                            <i class="fa-solid fa-comment-dots text-[#004b87]"></i> Justificación del Supervisor
                        </p>
                        <p class="text-xs text-slate-600 font-medium italic leading-relaxed">"${req.motivo}"</p>
                    </div>
                    ${req.comentario_admin ? `
                    <div class="mt-3 p-4 bg-blue-50 rounded-xl border border-blue-100">
                        <p class="text-[8px] font-black text-blue-400 uppercase tracking-[0.15em] mb-2 flex items-center gap-2">
                            <i class="fa-solid fa-user-shield text-blue-500"></i> Comentario del Administrador
                        </p>
                        <p class="text-xs text-blue-700 font-medium italic leading-relaxed">"${req.comentario_admin}"</p>
                    </div>` : ''}
                </div>

                <!-- Acciones -->
                <div class="w-full md:w-auto flex flex-row md:flex-col gap-3 shrink-0 pt-4 md:pt-0 border-t md:border-t-0 md:border-l border-slate-100 md:pl-8">
                    ${req.status === 'PENDIENTE' ? `
                        <button onclick="openApprovalModal(${req.id})"
                            class="flex-1 md:w-44 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 transition-all hover:-translate-y-1 flex items-center justify-center gap-2">
                            <i class="fa-solid fa-check-double text-xs"></i> Revisar y Aprobar
                        </button>
                        <button onclick="openRejectModal(${req.id})"
                            class="flex-1 md:w-44 py-3.5 bg-white border border-rose-100 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2">
                            <i class="fa-solid fa-xmark text-xs"></i> Rechazar
                        </button>
                    ` : `
                        <div class="flex flex-col items-center justify-center text-center p-4 w-44">
                            <div class="w-12 h-12 rounded-full ${req.status === 'APROBADA' ? 'bg-emerald-50 text-emerald-500' : (req.status === 'REINCORPORADA' ? 'bg-blue-50 text-blue-500' : 'bg-rose-50 text-rose-500')} flex items-center justify-center mb-2">
                                <i class="fa-solid ${req.status === 'APROBADA' ? 'fa-check' : (req.status === 'REINCORPORADA' ? 'fa-rotate-left' : 'fa-xmark')} text-lg"></i>
                            </div>
                            <p class="text-[10px] font-black uppercase tracking-widest ${req.status === 'APROBADA' ? 'text-emerald-600' : (req.status === 'REINCORPORADA' ? 'text-blue-500' : 'text-rose-600')}">${req.status}</p>
                            ${req.categoria_final ? `<p class="text-[8px] font-bold text-slate-400 uppercase mt-1">Como: ${req.categoria_final}</p>` : ''}
                            ${req.admin_nombre    ? `<p class="text-[8px] font-black text-slate-500 mt-2 bg-slate-50 py-1 px-2 rounded w-full truncate uppercase" title="${req.admin_nombre}"><i class="fa-solid fa-user-shield text-slate-400 mr-1"></i> ${req.admin_nombre}</p>` : ''}
                            ${req.status === 'APROBADA' ? `
                                <button onclick="openReincorporationModal(${req.id})"
                                    class="mt-3 px-3 py-1.5 border border-blue-200 text-blue-500 rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-blue-500 hover:text-white transition-all flex items-center justify-center gap-1.5 w-full">
                                    <i class="fa-solid fa-rotate-left"></i> Reincorporar
                                </button>` : ''}
                            ${req.status === 'REINCORPORADA' ? `
                                <div class="mt-3 p-2 bg-blue-50 rounded border border-blue-100 text-[7px] text-blue-600 font-bold uppercase italic break-words w-full">
                                    Reincorporado por:<br/><span class="font-black">${req.reincorporador_nombre || 'Administración'}</span>
                                </div>` : ''}
                        </div>
                    `}
                </div>
            `;
            container.appendChild(card);
        });
}

// ─── Log de Auditoría ─────────────────────────────────────────────────────────
async function renderLogView(container, emptyState) {
    if (emptyState) emptyState.classList.add('hidden');
    container.innerHTML = `<div class="col-span-full py-10 text-center"><i class="fa-solid fa-circle-notch fa-spin text-2xl text-slate-300"></i></div>`;

    try {
        const res  = await fetch('api/manage_requests.php?action=log_all');
        const logs = await res.json();

        if (!Array.isArray(logs) || logs.length === 0) {
            container.innerHTML = '';
            if (emptyState) emptyState.classList.remove('hidden');
            return;
        }

        const accionConfig = {
            'CREADA':        { color: 'bg-amber-500',   icon: 'fa-file-plus',    label: 'Creada',        text: 'text-amber-600'   },
            'APROBADA':      { color: 'bg-emerald-500', icon: 'fa-check-double', label: 'Aprobada',      text: 'text-emerald-600' },
            'RECHAZADA':     { color: 'bg-rose-500',    icon: 'fa-xmark',        label: 'Rechazada',     text: 'text-rose-600'    },
            'REINCORPORADA': { color: 'bg-blue-500',    icon: 'fa-rotate-left',  label: 'Reincorporada', text: 'text-blue-600'    }
        };

        container.innerHTML = `
            <div class="bg-white rounded-[2rem] border border-slate-100 shadow-[0_10px_40px_rgba(0,0,0,0.03)] overflow-hidden">
                <div class="p-6 border-b border-slate-100 flex items-center gap-4">
                    <div class="w-10 h-10 rounded-xl bg-slate-700 flex items-center justify-center">
                        <i class="fa-solid fa-scroll text-white text-sm"></i>
                    </div>
                    <div>
                        <h3 class="font-black text-slate-800 uppercase tracking-tight">Bitácora de Auditoría</h3>
                        <p class="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Registro completo de todas las acciones — visible para todos los administradores</p>
                    </div>
                    <span class="ml-auto bg-slate-100 text-slate-600 text-[10px] font-black px-3 py-1.5 rounded-full border border-slate-200 uppercase">${logs.length} registros</span>
                </div>
                <div class="divide-y divide-slate-50">
                    ${logs.map(log => {
                        const cfg = accionConfig[log.accion] || { color: 'bg-slate-400', icon: 'fa-circle', label: log.accion, text: 'text-slate-600' };
                        const ts  = new Date(log.timestamp);
                        const fecha = ts.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });
                        const hora  = ts.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
                        return `
                        <div class="flex items-start gap-5 px-6 py-5 hover:bg-slate-50/60 transition-colors group">
                            <!-- Indicador de acción -->
                            <div class="flex flex-col items-center gap-1 shrink-0 pt-1">
                                <div class="w-8 h-8 rounded-xl ${cfg.color} flex items-center justify-center shadow-sm">
                                    <i class="fa-solid ${cfg.icon} text-white text-xs"></i>
                                </div>
                            </div>
                            <!-- Contenido -->
                            <div class="flex-1 min-w-0">
                                <div class="flex flex-wrap items-center gap-3 mb-1.5">
                                    <span class="text-[9px] font-black ${cfg.text} uppercase tracking-widest bg-slate-50 px-2 py-0.5 rounded border">${cfg.label}</span>
                                    <span class="text-[10px] font-black text-slate-800 uppercase">${log.ejecutivo_nombre || '—'}</span>
                                    <span class="text-[9px] font-mono text-slate-400">${log.ejecutivo_rut || ''}</span>
                                </div>
                                <div class="flex flex-wrap gap-4 text-[9px] text-slate-500 font-bold uppercase mb-2">
                                    <span><i class="fa-solid fa-user-tie text-[#004b87] mr-1"></i> Supervisor: ${log.supervisor || '—'}</span>
                                    <span><i class="fa-solid fa-user-shield text-slate-400 mr-1"></i> Actor: ${log.actor_nombre} <span class="text-[8px] font-medium normal-case">(${log.actor_rol})</span></span>
                                </div>
                                ${log.comentario ? `
                                <div class="mt-2 p-3 bg-slate-50 rounded-lg border border-slate-100">
                                    <p class="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                                        <i class="fa-solid fa-comment-dots text-[#004b87]"></i> Comentario
                                    </p>
                                    <p class="text-[10px] text-slate-600 font-medium italic">"${log.comentario}"</p>
                                </div>` : ''}
                            </div>
                            <!-- Fecha -->
                            <div class="shrink-0 text-right">
                                <p class="text-[9px] font-black text-slate-500 uppercase">${fecha}</p>
                                <p class="text-[8px] font-bold text-slate-400 mt-0.5">${hora}</p>
                            </div>
                        </div>`;
                    }).join('')}
                </div>
            </div>
        `;
    } catch(e) {
        container.innerHTML = `<div class="py-16 text-center text-slate-400 text-sm">Error al cargar la bitácora.</div>`;
    }
}

// ─── Modal: Aprobar solicitud ─────────────────────────────────────────────────
window.openApprovalModal = function(id) {
    const req = allRequests.find(r => r.id == id);
    if (!req) return;
    selectedCategory = null;

    const modal = document.createElement('div');
    modal.id = 'modal-approval';
    modal.className = 'fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4';
    modal.innerHTML = `
        <div class="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden border border-white/20">
            <div class="bg-gradient-to-r from-[#004b87] to-[#002D56] p-8 text-white relative">
                <h3 class="text-xl font-black uppercase tracking-tight">Autorización de Egreso</h3>
                <p class="text-blue-200 text-[10px] font-bold uppercase tracking-widest mt-1">Validando solicitud de: ${req.supervisor}</p>
                <button onclick="document.getElementById('modal-approval').remove()"
                    class="absolute top-6 right-6 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>
            <div class="p-8 space-y-6">
                <!-- Propuesta del supervisor -->
                <div class="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                    <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Propuesta del Supervisor</p>
                    <p class="text-sm font-bold text-slate-700 uppercase">${req.categoria_propuesta}</p>
                </div>

                <!-- Selección de categoría final -->
                <div>
                    <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Clasificación de Egreso Final (Auditable)</label>
                    <div class="grid grid-cols-1 gap-3">
                        <button onclick="selectCategory(this, 'Renuncia/Termino')"
                            class="cat-pill w-full p-4 rounded-xl border-2 border-slate-100 text-left font-bold text-slate-600 hover:border-[#f37021] transition-all flex items-center justify-between">
                            Renuncia / Término <i class="fa-solid fa-circle-check opacity-0 text-[#f37021]"></i>
                        </button>
                        <button onclick="selectCategory(this, 'Fuera Falta Grave')"
                            class="cat-pill w-full p-4 rounded-xl border-2 border-slate-100 text-left font-bold text-slate-600 hover:border-[#f37021] transition-all flex items-center justify-between">
                            Fuera Falta Grave <i class="fa-solid fa-circle-check opacity-0 text-[#f37021]"></i>
                        </button>
                        <button onclick="selectCategory(this, 'Licencia/Apoyo')"
                            class="cat-pill w-full p-4 rounded-xl border-2 border-slate-100 text-left font-bold text-slate-600 hover:border-[#f37021] transition-all flex items-center justify-between">
                            Licencia / Apoyo Interno <i class="fa-solid fa-circle-check opacity-0 text-[#f37021]"></i>
                        </button>
                    </div>
                </div>

                <!-- Comentario obligatorio -->
                <div>
                    <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                        Comentario del Administrador <span class="text-rose-400">*</span>
                    </label>
                    <textarea id="approve-comentario" required placeholder="Justificación de la aprobación (obligatorio)..."
                        class="w-full h-24 p-4 rounded-xl border-2 border-slate-100 font-bold text-slate-700 bg-slate-50 focus:border-[#004b87] focus:outline-none resize-none text-sm"></textarea>
                </div>

                <button id="btn-approve" disabled onclick="confirmApproval(${req.id})"
                    class="w-full py-4 bg-emerald-500 text-white rounded-xl font-black uppercase tracking-widest shadow-xl shadow-emerald-500/20 opacity-50 cursor-not-allowed transition-all">
                    Confirmar y Procesar Baja
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    // Auto-seleccionar categoría propuesta
    const pills = modal.querySelectorAll('.cat-pill');
    pills.forEach(p => {
        if (p.innerText.trim().toLowerCase().includes((req.categoria_propuesta || '').split('/')[0].toLowerCase())) {
            selectCategory(p, req.categoria_propuesta);
        }
    });
};

window.selectCategory = function(btn, cat) {
    selectedCategory = cat;
    document.querySelectorAll('.cat-pill').forEach(b => {
        b.className = 'cat-pill w-full p-4 rounded-xl border-2 border-slate-100 text-left font-bold text-slate-600 hover:border-[#f37021] transition-all flex items-center justify-between';
        b.querySelector('i').className = 'fa-solid fa-circle-check opacity-0 text-[#f37021]';
    });
    btn.className = 'cat-pill w-full p-4 rounded-xl border-2 border-[#f37021] bg-orange-50/30 text-[#002D56] transition-all flex items-center justify-between shadow-sm';
    btn.querySelector('i').className = 'fa-solid fa-circle-check opacity-100 text-[#f37021]';

    const btnApprove = document.getElementById('btn-approve');
    if (btnApprove) {
        btnApprove.disabled = false;
        btnApprove.classList.remove('opacity-50', 'cursor-not-allowed');
        btnApprove.classList.add('hover:-translate-y-1', 'active:scale-95');
    }
};

async function confirmApproval(id) {
    const comentario = (document.getElementById('approve-comentario')?.value || '').trim();
    if (!comentario) {
        _shakeField('approve-comentario');
        return;
    }
    const adminName = sessionStorage.getItem('loggedInSupervisorName') || 'Administración';

    try {
        const res = await fetch('api/manage_requests.php?action=approve', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, categoriaFinal: selectedCategory, adminNombre: adminName, comentario })
        });
        const data = await res.json();
        if (data.success) {
            document.getElementById('modal-approval')?.remove();
            _showToast('SOLICITUD APROBADA CORRECTAMENTE', 'emerald');
            await loadRequests();
            renderView();
        } else {
            _showToast(data.error || 'Error al aprobar', 'rose');
        }
    } catch(e) {
        _showToast('Error de conexión', 'rose');
    }
}

// ─── Modal: Rechazar solicitud ────────────────────────────────────────────────
window.openRejectModal = function(id) {
    const req = allRequests.find(r => r.id == id);
    if (!req) return;

    const modal = document.createElement('div');
    modal.id = 'modal-reject';
    modal.className = 'fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4';
    modal.innerHTML = `
        <div class="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden border border-white/20">
            <div class="bg-gradient-to-r from-rose-500 to-rose-700 p-8 text-white relative">
                <h3 class="text-xl font-black uppercase tracking-tight">Rechazar Solicitud</h3>
                <p class="text-rose-100 text-[10px] font-bold uppercase tracking-widest mt-1">Ejecutivo: ${req.nombre}</p>
                <button onclick="document.getElementById('modal-reject').remove()"
                    class="absolute top-6 right-6 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>
            <div class="p-8 space-y-6">
                <div class="bg-rose-50 p-5 rounded-2xl border border-rose-100">
                    <p class="text-[9px] font-black text-rose-400 uppercase tracking-widest mb-1">Solicitud de</p>
                    <p class="text-sm font-bold text-rose-700 uppercase">${req.supervisor}</p>
                </div>
                <div>
                    <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                        Motivo del Rechazo <span class="text-rose-400">*</span>
                    </label>
                    <textarea id="reject-comentario" required placeholder="Explique el motivo del rechazo (obligatorio)..."
                        class="w-full h-28 p-4 rounded-xl border-2 border-slate-100 font-bold text-slate-700 bg-slate-50 focus:border-rose-500 focus:outline-none resize-none text-sm"></textarea>
                </div>
                <button onclick="confirmReject(${req.id})"
                    class="w-full py-4 bg-rose-500 text-white rounded-xl font-black uppercase tracking-widest shadow-xl shadow-rose-500/20 hover:-translate-y-1 transition-all active:scale-95">
                    Confirmar Rechazo
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
};

window.confirmReject = async function(id) {
    const comentario = (document.getElementById('reject-comentario')?.value || '').trim();
    if (!comentario) {
        _shakeField('reject-comentario');
        return;
    }
    const adminName = sessionStorage.getItem('loggedInSupervisorName') || 'Administración';

    try {
        const res = await fetch('api/manage_requests.php?action=reject', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, adminNombre: adminName, comentario })
        });
        const data = await res.json();
        if (data.success) {
            document.getElementById('modal-reject')?.remove();
            _showToast('SOLICITUD RECHAZADA', 'rose');
            await loadRequests();
            renderView();
        } else {
            _showToast(data.error || 'Error al rechazar', 'rose');
        }
    } catch(e) {
        _showToast('Error de conexión', 'rose');
    }
};

// ─── Modal: Reincorporar ejecutivo ────────────────────────────────────────────
window.openReincorporationModal = function(id) {
    const req = allRequests.find(r => r.id == id);
    if (!req) return;

    const modal = document.createElement('div');
    modal.id = 'modal-reinc';
    modal.className = 'fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4';
    modal.innerHTML = `
        <div class="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden border border-white/20">
            <div class="bg-blue-600 p-8 text-white relative">
                <h3 class="text-xl font-black uppercase tracking-tight">Reincorporar Ejecutivo</h3>
                <p class="text-blue-100 text-[10px] font-bold uppercase tracking-widest mt-1">Reversión de baja para: ${req.nombre}</p>
                <button onclick="document.getElementById('modal-reinc').remove()"
                    class="absolute top-6 right-6 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>
            <div class="p-8 space-y-6">
                <div class="bg-blue-50 p-5 rounded-2xl border border-blue-100 flex items-start gap-4">
                    <i class="fa-solid fa-circle-info text-blue-400 mt-0.5"></i>
                    <div>
                        <p class="text-[9px] font-black text-blue-500 uppercase tracking-widest mb-1">Información</p>
                        <p class="text-xs text-blue-700 font-medium">El ejecutivo <strong>${req.nombre}</strong> será reincorporado como <strong>Activo</strong> en la dotación del supervisor <strong>${req.supervisor}</strong>.</p>
                    </div>
                </div>
                <div>
                    <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                        Justificación de la Reincorporación <span class="text-rose-400">*</span>
                    </label>
                    <textarea id="reinc-reason" required placeholder="Explique el motivo del reingreso o corrección de la baja (obligatorio)..."
                        class="w-full h-32 p-4 rounded-xl border-2 border-slate-100 font-bold text-slate-700 bg-slate-50 focus:border-blue-500 focus:outline-none resize-none text-sm"></textarea>
                </div>
                <button onclick="confirmReincorporation(${req.id})"
                    class="w-full py-4 bg-blue-600 text-white rounded-xl font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:-translate-y-1 transition-all active:scale-95">
                    Confirmar Reincorporación Efectiva
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
};

window.confirmReincorporation = async function(id) {
    const motivo = (document.getElementById('reinc-reason')?.value || '').trim();
    if (!motivo) {
        _shakeField('reinc-reason');
        return;
    }
    const adminName = sessionStorage.getItem('loggedInSupervisorName') || 'Administración';

    try {
        const res = await fetch('api/manage_requests.php?action=reincorporar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, reincorporadorNombre: adminName, motivoReincorporacion: motivo })
        });
        const data = await res.json();
        if (data.success) {
            document.getElementById('modal-reinc')?.remove();
            _showToast('EJECUTIVO REINCORPORADO EXITOSAMENTE', 'blue');
            await loadRequests();
            renderView();
        } else {
            _showToast(data.error || 'Error al reincorporar', 'rose');
        }
    } catch(e) {
        _showToast('Error de conexión', 'rose');
    }
};

// ─── Helpers UI ───────────────────────────────────────────────────────────────
function _showToast(msg, color = 'emerald') {
    const colorMap = {
        emerald: 'bg-emerald-500',
        rose:    'bg-rose-500',
        blue:    'bg-blue-500'
    };
    const toast = document.createElement('div');
    toast.className = `fixed bottom-10 left-1/2 -translate-x-1/2 ${colorMap[color] || 'bg-slate-700'} text-white px-8 py-4 rounded-2xl shadow-2xl z-[200] font-black uppercase text-xs tracking-widest`;
    toast.style.cssText = 'animation: fadeIn 0.3s ease-out;';
    toast.innerText = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function _shakeField(fieldId) {
    const el = document.getElementById(fieldId);
    if (!el) return;
    el.classList.add('border-rose-400');
    el.focus();
    el.style.animation = 'none';
    el.offsetHeight; // reflow
    el.style.animation = 'shake 0.4s ease';
    setTimeout(() => {
        el.classList.remove('border-rose-400');
        el.style.animation = '';
    }, 600);
}
