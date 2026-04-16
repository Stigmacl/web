/* 
   Gestión — Ejecutivos Module (RESTAURACIÓN TOTAL DE DISEÑO Y FUNCIONALIDAD)
   • Supervisor: ve sus ejecutivos directos
   • Jefatura:   ve sus supervisores como cards. Click en uno → subtabla de ejecutivos
*/

// ============================================================
// SVG ICON HELPERS (Originales del Respaldo)
// ============================================================
const EJ_SVG_USER = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;
const EJ_SVG_ALERT = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;
const EJ_SVG_USERS = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`;
const EJ_SVG_BACK = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>`;
const EJ_SVG_CHECK = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><polyline points="20 6 9 17 4 12"/></svg>`;
const EJ_SVG_CARD = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>`;
const EJ_SVG_PEN = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;
const EJ_SVG_LOCK = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`;

// ============================================================
// INIT
// ============================================================
let currentExecutiveStatusFilter = 'Activo';

// Función de inicialización para el HTML
function initEjecutivos() {
    renderEjecutivosUI();
}

window.addEventListener('db_ready', () => {
    renderEjecutivosUI();
});

// ============================================================
// MAIN RENDER
// ============================================================
function renderEjecutivosUI() {
    const container = document.getElementById('ejecutivos-cards-container');
    const badge = document.getElementById('count-ejecutivos-badge');
    if (!container) return;

    container.innerHTML = '';

    const userRole = sessionStorage.getItem('userRole');
    const loggedInSup = window.loggedInSupervisorName || sessionStorage.getItem('loggedInSupervisorName');
    let jefSups = [];

    // 1. Obtener supervisores a cargo si es admin/jefatura
    const storedSups = sessionStorage.getItem('loggedInJefaturaSups');
    if (storedSups) {
        try { jefSups = JSON.parse(storedSups); } catch(e) { jefSups = []; }
    }
    
    // Si no hay en sesión, intentar detectar por mapa global (fallback)
    if (jefSups.length === 0 && typeof globalJefaturaMap !== 'undefined' && loggedInSup) {
        const user = (loggedInSup || "").toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toUpperCase();
        Object.keys(globalJefaturaMap).forEach(jef => {
            const jefNorm = jef.toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toUpperCase();
            if (jefNorm === user) jefSups = globalJefaturaMap[jef];
        });
    }

    // Si es ADMIN y sigue sin tener supervisores específicos, le mostramos TODOS los supervisores del sistema
    if (userRole === 'admin' && jefSups.length === 0 && typeof globalExecutives !== 'undefined') {
        const allSups = new Set();
        globalExecutives.forEach(ex => {
            if (ex.supervisor && ex.isActivo !== false) allSups.add(ex.supervisor.trim());
        });
        jefSups = Array.from(allSups).sort();
    }

    const isJefatura = (userRole === 'admin' || (Array.isArray(jefSups) && jefSups.length > 0));

    if (isJefatura) {
        window.loggedInJefaturaSups = jefSups;
        renderSupervisorCards(container, badge);
    } else {
        renderExecutiveCards(container, badge, loggedInSup, false);
    }
}

// ============================================================
// JEFATURA: SUPERVISOR CARDS VIEW
// ============================================================
function renderSupervisorCards(container, badge) {
    const sups = window.loggedInJefaturaSups || [];
    const executives = (typeof globalExecutives !== 'undefined') ? globalExecutives : [];
    const errors = (typeof globalErrorsCollection !== 'undefined') ? globalErrorsCollection : [];
    
    if (badge) badge.innerText = sups.length;

    sups.forEach(supName => {
        const supKey = supName.trim().toUpperCase();
        const supExecs = executives.filter(ex => (ex.supervisor || '').trim().toUpperCase() === supKey && ex.isActivo !== false);
        
        const supErrors = errors.filter(err => {
            if ((err.supervisor || '').trim().toUpperCase() !== supKey) return false;
            const isError = err.agendamientoEstado === 'RECHAZADO' || (err.categoria !== 'Agendamientos' && err.agendamientoEstado !== 'EJECUTADO');
            return isError;
        });
        
        const supPend = supErrors.filter(e => {
            const st = (e.estado || '').toLowerCase();
            return st === 'pendiente' || st === '';
        }).length;

        const supResueltos = supErrors.length - supPend;
        const pct = supErrors.length > 0 ? Math.round((supResueltos / supErrors.length) * 100) : 100;
        
        const statusBg = pct === 100 ? '#10B981' : supPend > 0 ? '#F59E0B' : '#10B981';

        const card = document.createElement('div');
        card.className = 'group relative bg-white rounded-[2rem] border border-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.05)] hover:shadow-[0_16px_48px_rgba(0,75,135,0.12)] hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden flex flex-col';
        card.onclick = () => drillDownSupervisor(supName);

        card.innerHTML = `
            <div class="h-1 w-full bg-gradient-to-r from-[#004b87] to-[#F37021] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div class="p-6 flex flex-col flex-1">
                <div class="flex items-start gap-4 mb-5">
                    <div class="relative flex-shrink-0">
                        <div class="w-12 h-12 rounded-2xl overflow-hidden shadow-md ring-2 ring-slate-100 group-hover:ring-[#004b87]/20 transition-all">
                            <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(supName)}&background=004b87&color=ffffff&bold=true&font-size=0.38&size=64" class="w-full h-full object-cover">
                        </div>
                        <div class="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center" style="background: ${statusBg}"></div>
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="text-[9px] font-black text-slate-400 uppercase tracking-[0.18em] mb-0.5">Supervisor</p>
                        <h4 class="text-[13px] font-black text-slate-800 group-hover:text-[#004b87] transition-colors leading-tight uppercase tracking-tight line-clamp-2">${supName}</h4>
                    </div>
                </div>
                <div class="grid grid-cols-3 gap-2 mb-5">
                    <div class="text-center bg-blue-50/60 rounded-xl py-2.5 border border-blue-100/50">
                        <div class="text-xl font-black text-[#004b87] tabular-nums">${supExecs.length}</div>
                        <div class="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Ejec.</div>
                    </div>
                    <div class="text-center ${supErrors.length > 0 ? 'bg-rose-50' : 'bg-slate-50/60'} rounded-xl py-2.5 border ${supErrors.length > 0 ? 'border-rose-100/50' : 'border-slate-100/50'}">
                        <div class="text-xl font-black ${supErrors.length > 0 ? 'text-rose-500' : 'text-slate-400'} tabular-nums">${supErrors.length}</div>
                        <div class="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Errors</div>
                    </div>
                    <div class="text-center ${supPend > 0 ? 'bg-amber-50' : 'bg-emerald-50'} rounded-xl py-2.5 border ${supPend > 0 ? 'border-amber-100/50' : 'border-emerald-100/50'}">
                        <div class="text-xl font-black ${supPend > 0 ? 'text-amber-500' : 'text-emerald-500'} tabular-nums">${pct}%</div>
                        <div class="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Gest.</div>
                    </div>
                </div>
                <div class="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between">
                    <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-[#004b87] transition-colors">Ver Equipo</span>
                    <div class="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-[#004b87] group-hover:text-white transition-all">
                        <i class="fa-solid fa-chevron-right text-[10px]"></i>
                    </div>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

// ============================================================
// DRILL-DOWN: Ver ejecutivos de un supervisor
// ============================================================
function setStatusFilter(status, supervisorName) {
    currentExecutiveStatusFilter = status;
    drillDownSupervisor(supervisorName);
}

function drillDownSupervisor(supervisorName) {
    const container = document.getElementById('ejecutivos-cards-container');
    const badge = document.getElementById('count-ejecutivos-badge');
    if (!container) return;

    container.innerHTML = '';

    const nav = document.createElement('div');
    nav.className = 'col-span-full mb-6 flex items-center justify-between';
    nav.innerHTML = `
        <div class="flex items-center gap-4">
            <button onclick="renderEjecutivosUI()"
                class="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-slate-500 hover:text-[#004b87] bg-white border border-slate-200 hover:border-[#004b87]/30 px-4 py-2.5 rounded-xl transition-all duration-200 cursor-pointer shadow-sm">
                ${EJ_SVG_BACK.replace('class="', 'class="w-3.5 h-3.5 ')}
                Supervisores
            </button>
            <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded-xl overflow-hidden shadow ring-2 ring-white">
                    <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(supervisorName)}&background=004b87&color=ffffff&bold=true&size=48" class="w-full h-full object-cover">
                </div>
                <div>
                    <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Vista de Ejecutivos</p>
                    <h3 class="text-[13px] font-black text-slate-800 uppercase tracking-tight">${supervisorName}</h3>
                </div>
            </div>
        </div>
        <div class="flex items-center gap-2 bg-white/50 p-1.5 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto max-w-full">
            <button onclick="setStatusFilter('Activo', '${supervisorName}')" class="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${currentExecutiveStatusFilter === 'Activo' ? 'bg-[#004b87] text-white' : 'text-slate-400 hover:text-slate-600'}">Vigentes</button>
            <button onclick="setStatusFilter('Fuera Falta Grave', '${supervisorName}')" class="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${currentExecutiveStatusFilter === 'Fuera Falta Grave' ? 'bg-[#004b87] text-white shadow-lg shadow-blue-200' : 'text-slate-400 hover:text-slate-600'}">Fuera Falta Grave</button>
            <button onclick="setStatusFilter('Renuncia/Termino', '${supervisorName}')" class="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${currentExecutiveStatusFilter === 'Renuncia/Termino' ? 'bg-[#004b87] text-white shadow-lg shadow-blue-200' : 'text-slate-400 hover:text-slate-600'}">Renuncias</button>
            <button onclick="setStatusFilter('Licencia/Apoyo', '${supervisorName}')" class="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${currentExecutiveStatusFilter === 'Licencia/Apoyo' ? 'bg-[#004b87] text-white shadow-lg shadow-blue-200' : 'text-slate-400 hover:text-slate-600'}">Licencia/Apoyos</button>
        </div>
    `;
    container.appendChild(nav);

    renderExecutiveCards(container, badge, supervisorName, true);
}

// ============================================================
// EXECUTIVE CARDS: shared by supervisor mode and drill-down
// ============================================================
function renderExecutiveCards(container, badge, supervisorName, isDrillDown) {
    const executives = (typeof globalExecutives !== 'undefined') ? globalExecutives : [];
    const errors = (typeof globalErrorsCollection !== 'undefined') ? globalErrorsCollection : [];
    const supKey = (supervisorName || "").trim().toUpperCase();

    const allTeam = executives
        .map(ex => (typeof ExecutiveStore !== 'undefined') ? ExecutiveStore.getEnrichedEx(ex) : ex)
        .filter(ex => (ex.supervisor || "").trim().toUpperCase() === supKey);
        
    const myTeam = isDrillDown 
        ? allTeam.filter(ex => ex.estadoDotacion === currentExecutiveStatusFilter)
        : allTeam.filter(ex => ex.isActivo !== false);

    if (!isDrillDown && badge) badge.innerText = myTeam.length;

    if (myTeam.length === 0) {
        const el = document.createElement('div');
        el.className = 'col-span-full py-14 text-center text-slate-400 text-sm italic';
        el.innerText = 'No hay ejecutivos asignados a este supervisor.';
        container.appendChild(el);
        return;
    }

    myTeam.forEach(ex => {
        const initials = (ex.nombre || "U").split(' ').filter(n => n.length > 0).map(n => n[0]).slice(0, 2).join('').toUpperCase();
        
        const errorsCount = errors.filter(err => {
            if (!err.ejecutivo) return false;
            const isError = err.agendamientoEstado === 'RECHAZADO' || (err.categoria !== 'Agendamientos' && err.agendamientoEstado !== 'EJECUTADO');
            if (!isError) return false;
            
            const errVal = err.ejecutivo.trim().toUpperCase();
            const exName = (ex.nombre || "").trim().toUpperCase();
            const exRut = (ex.rut || "").toString().toUpperCase().replace(/[^0-9K]/g, "");
            return errVal === exName || errVal === exRut || (errVal.length >= 7 && exRut.startsWith(errVal));
        }).length;
        
        const isVigente = ex.isActivo !== false;

        const card = document.createElement('div');
        card.className = 'bg-white rounded-[2rem] border border-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_48px_rgba(243,112,33,0.12)] border-t-4 border-t-[#F37021] hover:-translate-y-1 transition-all duration-300 group overflow-hidden flex flex-col h-full relative';

        card.innerHTML = `
            <div class="absolute -right-6 -bottom-6 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                <svg viewBox="0 0 120 120" class="w-32 h-32 text-slate-50 fill-current"><circle cx="60" cy="60" r="60"/></svg>
            </div>
            <div class="p-6 flex flex-col flex-1 relative z-10">
                <div class="flex items-start justify-between mb-5">
                    <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 border border-slate-200 flex items-center justify-center text-[#004b87] font-black text-xl group-hover:from-[#004b87] group-hover:to-[#002D56] group-hover:text-white group-hover:border-transparent transition-all duration-400 shadow-sm">
                        ${initials}
                    </div>
                    <div class="flex flex-col items-end gap-1.5">
                        <span class="inline-flex items-center gap-1.5 text-[9px] font-black px-2.5 py-1 rounded-full border uppercase tracking-widest ${
                            ex.estadoDotacion === 'Activo' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                        }">
                            <span class="w-1.5 h-1.5 rounded-full ${ex.estadoDotacion === 'Activo' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}"></span>
                            ${ex.estadoDotacion === 'Activo' ? 'Vigente' : ex.estadoDotacion}
                        </span>
                        <span class="text-[9px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded border border-slate-100 uppercase">${ex.usuario || 'Sin User'}</span>
                    </div>
                </div>
                <div class="mb-5 flex-1">
                    <p class="text-[9px] font-black text-[#F37021] uppercase tracking-widest mb-1 opacity-80">Ejecutivo / RUT</p>
                    <h4 class="font-black text-[#002D56] text-[14px] leading-tight tracking-tight group-hover:text-[#004b87] transition-colors uppercase mb-2 line-clamp-2">${ex.nombre}</h4>
                    <div class="flex items-center gap-2">
                        <span class="text-[11px] text-slate-500 font-mono font-bold bg-slate-50 px-2 py-1 rounded border border-slate-100">${ex.rut}</span>
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50 mb-5">
                    <div>
                        <p class="text-[8px] font-bold text-slate-400 uppercase tracking-tight mb-1.5">Errores</p>
                        <div class="flex items-center gap-2">
                            <div class="h-8 w-8 rounded-lg flex items-center justify-center text-xs font-black border ${
                                errorsCount > 0 ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-slate-50 text-slate-400 border-slate-200'
                            }">${errorsCount}</div>
                            <div class="text-slate-300 w-3.5 h-3.5">${EJ_SVG_ALERT.replace('xmlns', 'class="w-3.5 h-3.5" xmlns')}</div>
                        </div>
                    </div>
                    <div class="text-right">
                        <p class="text-[8px] font-bold text-slate-400 uppercase tracking-tight mb-1.5">Contrato</p>
                        <span class="text-[9px] font-black text-[#004b87] bg-blue-50 px-2 py-1 rounded border border-blue-100 uppercase inline-block mb-1">${ex.tipoContrato || 'INDEFINIDO'}</span>
                        <div class="text-[8px] font-bold text-slate-400 italic uppercase">${ex.jornada ? ex.jornada + ' hrs' : '40 hrs'}</div>
                    </div>
                </div>
                <div class="flex gap-2.5 mt-auto">
                    <a href="gestion.html?rut=${ex.rut}"
                        class="flex-1 py-3 bg-[#004b87] text-white rounded-2xl text-[10px] font-black hover:bg-[#002D56] transition-all text-center shadow-lg shadow-[#004b87]/20 flex items-center justify-center gap-2 uppercase tracking-wider">
                        ${EJ_SVG_CARD.replace('xmlns', 'class="w-3.5 h-3.5 opacity-70" xmlns')}
                        Hoja de Vida
                    </a>
                    <button onclick="openEditModal('${ex.rut}')"
                        class="w-12 h-12 bg-white border border-slate-200 text-slate-400 rounded-2xl hover:text-[#004b87] hover:border-[#004b87] transition-all flex items-center justify-center cursor-pointer">
                        ${EJ_SVG_PEN.replace('xmlns', 'class="w-4 h-4" xmlns')}
                    </button>
                    ${isVigente ? `
                    <button onclick="requestExit('${ex.rut}', '${ex.nombre.replace(/'/g, "\\'")}')" 
                        class="w-12 h-12 bg-rose-50 border border-rose-100 text-rose-500 rounded-2xl hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center cursor-pointer group/exit relative" title="Solicitar Egreso">
                        <i class="fa-solid fa-door-open text-xs"></i>
                    </button>
                    ` : ''}
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

// ============================================================
// MODAL: Editar Perfil del Ejecutivo
// ============================================================
function openEditModal(rut) {
    const executives = (typeof globalExecutives !== 'undefined') ? globalExecutives : [];
    const rawEx = executives.find(x => x.rut === rut);
    if (!rawEx) return;
    const ex = (typeof ExecutiveStore !== 'undefined') ? ExecutiveStore.getEnrichedEx(rawEx) : rawEx;

    const formatDateForInput = (dateStr) => {
        if (!dateStr) return "";
        try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return "";
            return d.toISOString().split('T')[0];
        } catch (e) { return ""; }
    };

    document.getElementById('edit-rut-hidden').value = ex.rut;
    document.getElementById('edit-nombre').value = ex.nombre;
    document.getElementById('edit-usuario').value = ex.usuario || "";
    document.getElementById('edit-nacimiento').value = ex.fechaNacimiento || "";
    document.getElementById('edit-ingreso').value = formatDateForInput(ex.contratoDesde || ex.ingreso);
    document.getElementById('edit-vencimiento').value = formatDateForInput(ex.contratoHasta || ex.vencimiento);
    document.getElementById('edit-tipo-contrato').value = ex.tipoContrato || "INDEFINIDO";
    document.getElementById('edit-jornada').value = ex.jornada || "40";
    document.getElementById('edit-modalidad').value = ex.modalidad || "PRESENCIAL";
    document.getElementById('edit-vpx').value = ex.vpx || "";

    document.getElementById('edit-profile-modal').classList.remove('hidden');
}

function closeEditModal() {
    document.getElementById('edit-profile-modal').classList.add('hidden');
}

function saveExecutiveEdit() {
    const rut = document.getElementById('edit-rut-hidden').value;
    const data = {
        usuario: document.getElementById('edit-usuario').value,
        fechaNacimiento: document.getElementById('edit-nacimiento').value,
        contratoDesde: document.getElementById('edit-ingreso').value,
        contratoHasta: document.getElementById('edit-vencimiento').value,
        tipoContrato: document.getElementById('edit-tipo-contrato').value,
        jornada: document.getElementById('edit-jornada').value,
        modalidad: document.getElementById('edit-modalidad').value,
        vpx: document.getElementById('edit-vpx').value
    };

    if (typeof ExecutiveStore !== 'undefined') {
        ExecutiveStore.saveEdit(rut, data);
        renderEjecutivosUI();
        closeEditModal();
        alert("Perfil de ejecutivo actualizado correctamente.");
    }
}

// ============================================================
// SOLICITUD DE EGRESO (Supervisor -> Admin)
// ============================================================
window.requestExit = function(rut, nombre) {
    const supervisor = sessionStorage.getItem('loggedInSupervisorName');
    renderExitRequestModal(rut, nombre, supervisor);
};

function renderExitRequestModal(rut, nombre, supervisor) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4';
    modal.innerHTML = `
        <div class="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden border border-white/20 animate-in fade-in zoom-in duration-300">
            <div class="divider bg-gradient-to-r from-rose-500 to-rose-700 p-8 text-white relative">
                <div class="flex items-center gap-4 mb-2">
                    <div class="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center border border-white/20">
                        <i class="fa-solid fa-user-minus text-lg"></i>
                    </div>
                    <h3 class="text-xl font-black uppercase tracking-tight">Solicitar Egreso</h3>
                </div>
                <p class="text-rose-100 text-[10px] font-bold uppercase tracking-widest opacity-80">Ejecutivo: ${nombre}</p>
                <button onclick="this.closest('.fixed').remove()" class="absolute top-6 right-6 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>
            <div class="p-8">
                <form id="exit-request-form" class="space-y-6">
                    <div>
                        <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <i class="fa-solid fa-list-ul text-rose-500"></i> Categoría Sugerida
                        </label>
                        <select id="exit-category" class="w-full h-14 px-4 rounded-2xl border-2 border-slate-100 font-bold text-slate-700 bg-slate-50 focus:border-rose-500 focus:outline-none appearance-none cursor-pointer transition-all">
                            <option value="Renuncia/Termino">Renuncia Voluntaria / Término Contrato</option>
                            <option value="Fuera Falta Grave">Salida por Falta Grave</option>
                            <option value="Licencia/Apoyo">Licencia Prolongada / Apoyo Interno</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <i class="fa-solid fa-calendar-day text-rose-500"></i> Fecha de Egreso Efectiva
                        </label>
                        <input type="date" id="exit-date" required class="w-full h-14 px-4 rounded-2xl border-2 border-slate-100 font-bold text-slate-700 bg-slate-50 focus:border-rose-500 focus:outline-none transition-all" value="${new Date().toISOString().split('T')[0]}">
                    </div>
                    <div>
                        <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <i class="fa-solid fa-comment-dots text-rose-500"></i> Justificación y Detalle
                        </label>
                        <textarea id="exit-reason" required placeholder="Escriba aquí los detalles del egreso..." class="w-full h-32 p-4 rounded-2xl border-2 border-slate-100 font-bold text-slate-700 bg-slate-50 focus:border-rose-500 focus:outline-none resize-none transition-all"></textarea>
                    </div>
                    <button type="submit" class="w-full py-4 bg-gradient-to-r from-rose-500 to-rose-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-rose-500/20 hover:-translate-y-1 transition-all active:scale-95 flex items-center justify-center gap-3">
                        <i class="fa-solid fa-paper-plane"></i> Enviar a Revisión de Admin
                    </button>
                </form>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    modal.querySelector('#exit-request-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const category = document.getElementById('exit-category').value;
        const date = document.getElementById('exit-date').value;
        const reason = document.getElementById('exit-reason').value;
        
        // Simulación de guardado (RequestStore no está en SQL aún, se mantiene local)
        if (typeof RequestStore !== 'undefined') {
            RequestStore.add({ rut, nombre, supervisor, fechaEgreso: date, categoriaPropuesta: category, motivo: reason });
        }
        
        modal.remove();
        const toast = document.createElement('div');
        toast.className = 'fixed bottom-10 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-8 py-4 rounded-2xl shadow-2xl z-[200] font-black uppercase text-xs tracking-widest flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5';
        toast.innerHTML = `<i class="fa-solid fa-circle-check text-lg"></i> Solicitud Enviada al Administrador`;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    });
}
