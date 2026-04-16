/* 
   Gestión — Ejecutivos Module
   • Supervisor: ve sus ejecutivos directos
   • Jefatura:   ve sus supervisores como cards. Click en uno → subtabla de ejecutivos
*/

// ============================================================
// SVG ICON HELPERS
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

document.addEventListener('DOMContentLoaded', () => {
    window.addEventListener('db_ready', () => {
        renderEjecutivosUI();
    });
});

// ============================================================
// MAIN RENDER
// ============================================================
function renderEjecutivosUI() {
    const container = document.getElementById('ejecutivos-cards-container');
    const badge = document.getElementById('count-ejecutivos-badge');
    if (!container) return;

    container.innerHTML = '';

    const isJefatura = window.loggedInJefaturaSups && window.loggedInJefaturaSups.length > 0;

    if (isJefatura) {
        renderSupervisorCards(container, badge);
    } else {
        renderExecutiveCards(container, badge, window.loggedInSupervisorName, false);
    }
}

function renderSupervisorCards(container, badge) {
    const sups = window.loggedInJefaturaSups;
    const enrichedAll = globalExecutives.map(ex => ExecutiveStore.getEnrichedEx(ex));

    if (badge) badge.innerText = sups.length;

    const supStats = sups.map(sup => {
        const supKey = sup.trim().toUpperCase();
        const supExecs = enrichedAll.filter(ex => (ex.supervisor || '').trim().toUpperCase() === supKey && ex.isActivo !== false);
        return { name: sup, execs: supExecs.length };
    }).sort((a, b) => a.name.localeCompare(b.name));

    if (supStats.length === 0) {
        container.innerHTML = `<div class="col-span-full py-16 text-center text-slate-400 text-sm italic">No hay supervisores registrados en tu dotación.</div>`;
        return;
    }

    supStats.forEach(s => {
        const card = document.createElement('div');
        card.className = 'group relative bg-white rounded-[2rem] border border-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.05)] hover:shadow-[0_16px_48px_rgba(0,75,135,0.12)] hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden flex flex-col';
        card.onclick = () => drillDownSupervisor(s.name);

        card.innerHTML = `
            <div class="h-1 w-full bg-gradient-to-r from-[#004b87] to-[#F37021] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div class="p-6 flex flex-col flex-1">
                <div class="flex items-start gap-4 mb-5">
                    <div class="w-12 h-12 rounded-2xl overflow-hidden shadow-md ring-2 ring-slate-100 group-hover:ring-[#004b87]/20 transition-all">
                        <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(s.name)}&background=004b87&color=ffffff&bold=true&font-size=0.38&size=64" class="w-full h-full object-cover" alt="${s.name}">
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="text-[9px] font-black text-slate-400 uppercase tracking-[0.18em] mb-0.5">Supervisor</p>
                        <h4 class="text-[13px] font-black text-slate-800 group-hover:text-[#004b87] transition-colors leading-tight uppercase tracking-tight line-clamp-2">${s.name}</h4>
                    </div>
                </div>
                <div class="grid grid-cols-1 gap-2 mb-5">
                    <div class="text-center bg-blue-50/60 rounded-xl py-2.5 border border-blue-100/50">
                        <div class="text-xl font-black text-[#004b87] tabular-nums">${s.execs}</div>
                        <div class="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Ejecutivos Activos</div>
                    </div>
                </div>
                <div class="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between">
                    <span class="text-[10px] font-bold text-[#004b87] flex items-center gap-1.5">Ver Equipo ${EJ_SVG_BACK}</span>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

function drillDownSupervisor(supName) {
    const container = document.getElementById('ejecutivos-cards-container');
    const badge = document.getElementById('count-ejecutivos-badge');
    
    // Botón volver
    const backBtn = document.createElement('div');
    backBtn.className = 'col-span-full mb-6';
    backBtn.innerHTML = `
        <button onclick="renderEjecutivosUI()" class="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-[#004b87] transition-colors">
            ${EJ_SVG_BACK} Volver a Supervisores
        </button>
    `;
    
    container.innerHTML = '';
    container.appendChild(backBtn);
    
    renderExecutiveCards(container, badge, supName, true);
}

function renderExecutiveCards(container, badge, supervisorName, isDrillDown) {
    const enrichedAll = globalExecutives.map(ex => ExecutiveStore.getEnrichedEx(ex));
    const team = enrichedAll.filter(ex => (ex.supervisor || '').trim().toUpperCase() === supervisorName.trim().toUpperCase() && ex.isActivo !== false);

    if (!isDrillDown && badge) badge.innerText = team.length;

    if (team.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'col-span-full py-16 text-center text-slate-400 text-sm italic';
        empty.innerText = 'No hay ejecutivos activos para este supervisor.';
        container.appendChild(empty);
        return;
    }

    team.forEach(ex => {
        const card = document.createElement('div');
        card.className = 'bg-white rounded-3xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-all';
        card.innerHTML = `
            <div class="flex items-center gap-4 mb-4">
                <div class="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-[#004b87]">
                    ${EJ_SVG_USER}
                </div>
                <div class="flex-1 min-w-0">
                    <h4 class="text-sm font-bold text-slate-800 truncate uppercase">${ex.nombre}</h4>
                    <p class="text-[10px] text-slate-400 font-medium">${ex.rut}</p>
                </div>
            </div>
            <div class="space-y-2">
                <div class="flex justify-between text-[10px]">
                    <span class="text-slate-400">Servicio:</span>
                    <span class="font-bold text-slate-700">${ex.servicio || 'N/A'}</span>
                </div>
                <div class="flex justify-between text-[10px]">
                    <span class="text-slate-400">Modalidad:</span>
                    <span class="font-bold text-slate-700">${ex.modalidad || 'N/A'}</span>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}
