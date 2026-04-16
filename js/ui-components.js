/* 
   Gestión Supervisor - UI Components Engine
   Corregido para asegurar persistencia del menú y evitar bloqueos en la navegación
*/

document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

// Recuperar datos de sesión de forma robusta
let loggedInSupervisorName = sessionStorage.getItem('loggedInSupervisorName') || localStorage.getItem('loggedInSupervisorName');
let userRole = sessionStorage.getItem('userRole') || localStorage.getItem('userRole');

// Asegurar que los datos estén en ambos almacenamientos para persistencia
if (loggedInSupervisorName) {
    localStorage.setItem('loggedInSupervisorName', loggedInSupervisorName);
    sessionStorage.setItem('loggedInSupervisorName', loggedInSupervisorName);
}
if (userRole) {
    localStorage.setItem('userRole', userRole);
    sessionStorage.setItem('userRole', userRole);
}

window.loggedInSupervisorName = loggedInSupervisorName;
window.loggedInJefatura     = null;
window.loggedInJefaturaSups = [];

let _db_ready_fired = false;

function detectJefatura() {
    if (!loggedInSupervisorName || typeof globalJefaturaMap === 'undefined') return;
    const nameNorm = loggedInSupervisorName.trim().toUpperCase();
    for (const [jef, sups] of Object.entries(globalJefaturaMap)) {
        const jefNorm = jef.trim().toUpperCase();
        if (jefNorm === nameNorm || nameNorm.includes(jefNorm.split(' ')[0]) || jefNorm.includes(nameNorm.split(' ')[0])) {
            window.loggedInJefatura     = jef;
            window.loggedInJefaturaSups = sups;
            break;
        }
    }
}

function initApp() {
    // Si no hay sesión, redirigir a login (excepto si ya estamos en login)
    if (!loggedInSupervisorName && !window.location.pathname.includes('login.html')) {
        window.location.href = 'login.html';
        return;
    }

    // Renderizado inmediato del sidebar (esqueleto o con datos básicos)
    // Esto evita que el menú "desaparezca" mientras cargan los datos
    renderSidebar();

    // Cuando los datos de la BD estén listos, actualizar el sidebar con contadores y roles específicos
    window.addEventListener('db_ready', () => {
        _db_ready_fired = true;
        detectJefatura();
        renderSidebar();
        initNotificationLogic();
    });

    // Fallback de seguridad: si db_ready tarda mucho, intentar renderizar de nuevo
    setTimeout(() => {
        if (!_db_ready_fired) {
            console.warn('[ui-components] Fallback: Actualizando sidebar por tiempo de espera');
            renderSidebar();
        }
    }, 2000);
}

// ─── SVG Campana ──────────────────────────────────────────────────────────────
const SVG_BELL     = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>`;
const SVG_BELL_DOT = `<svg viewBox="0 0 24 24" fill="none" class="w-5 h-5"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="18" cy="6" r="4" fill="#F37021" stroke="#002D56" stroke-width="1.5"/></svg>`;

// ─── Render Sidebar ───────────────────────────────────────────────────────────
function renderSidebar() {
    const sidebar = document.getElementById('shared-sidebar');
    if (!sidebar) return;

    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const currentRole = sessionStorage.getItem('userRole') || localStorage.getItem('userRole');

    const parts = (loggedInSupervisorName || '').split(' ');
    let uiName  = loggedInSupervisorName || 'Usuario';
    if (parts.length >= 3) {
        const first = parts[2].charAt(0).toUpperCase() + parts[2].slice(1).toLowerCase();
        const last  = parts[0].charAt(0).toUpperCase() + parts[0].slice(1).toLowerCase();
        uiName = `${first} ${last}`;
    }

    const isAdmin = currentRole === 'admin' || (loggedInSupervisorName && (
        loggedInSupervisorName.includes('Administrador') ||
        loggedInSupervisorName.toUpperCase() === 'ADMIN'
    ));

    const menuItems = [
        { id: 'index.html',    label: 'Errores Reportados',   icon: 'fa-triangle-exclamation', section: 'Gestión de Equipo', disabled: isAdmin },
        { id: 'ejecutivos.html', label: (isAdmin || window.loggedInJefatura) ? 'Mi Dotación' : 'Mis Ejecutivos', icon: 'fa-users', section: 'Gestión de Equipo', count: true },
        { id: 'kpi.html',      label: 'Detalle KPI',          icon: 'fa-chart-pie',            section: 'Gestión de Equipo', disabled: isAdmin },
        { id: 'dotacion.html', label: 'Dotación',             icon: 'fa-address-book',         section: 'Dotación' },
        { id: 'gestion.html',  label: 'Gestión de Desempeño', icon: 'fa-clipboard-check',      section: 'Dotación' }
    ];

    if (isAdmin) {
        menuItems.push({ id: 'admin.html',      label: 'Estrategia Global',  icon: 'fa-chess-king', section: 'Administración' });
        menuItems.push({ id: 'solicitudes.html', label: 'Gestión de Dotación', icon: 'fa-user-pen', section: 'Administración' });
        menuItems.push({ id: 'import.html',     label: 'Carga de Datos',     icon: 'fa-file-excel', section: 'Administración' });
    }

    let html = `
        <div class="h-16 flex items-center px-6 border-b border-white/10 mt-2">
            <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded bg-be-orange flex items-center justify-center font-bold text-white shadow-lg text-sm">
                    <i class="fa-solid fa-building-columns"></i>
                </div>
                <span class="font-bold text-lg tracking-tight text-white">Gestión <span class="text-be-orange">Supervisor</span></span>
            </div>
        </div>
        <nav class="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
    `;

    let currentSection = '';
    menuItems.forEach(item => {
        if (item.section !== currentSection) {
            html += `<p class="px-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 ${currentSection ? 'mt-6' : ''}">${item.section}</p>`;
            currentSection = item.section;
        }
        const isActive = currentPage === item.id;
        if (item.disabled) {
            html += `
                <div class="w-full flex items-center gap-3 px-4 py-3 text-gray-600 rounded-lg border-l-4 border-transparent text-sm font-medium opacity-40 cursor-not-allowed select-none" title="No disponible para este rol">
                    <i class="fa-solid ${item.icon} w-5 text-center"></i> ${item.label}
                    <i class="fa-solid fa-lock ml-auto text-xs"></i>
                </div>`;
        } else {
            const btnClass = isActive
                ? 'w-full flex items-center gap-3 px-4 py-3 bg-white/10 text-be-orange rounded-lg transition-colors border-l-4 border-be-orange font-bold text-sm shadow-sm text-left'
                : 'w-full flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-white/5 hover:text-white rounded-lg transition-colors border-l-4 border-transparent text-sm font-medium text-left';
            html += `
                <a href="${item.id}" class="${btnClass}">
                    <i class="fa-solid ${item.icon} w-5 text-center"></i> ${item.label}
                    ${item.count ? `<span class="bg-white/10 px-2 py-0.5 rounded text-xs ml-auto font-bold" id="nav-count-ejecs">0</span>` : ''}
                </a>`;
        }
    });

    html += `
        </nav>
        <div class="px-6 py-6 border-t border-white/10 space-y-4">
            <div class="flex items-center justify-between gap-3 relative">

                <!-- ── Campana de Notificaciones ── -->
                <div class="relative">
                    <button id="notif-bell-btn" onclick="toggleNotificationPanel()"
                        class="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-be-orange hover:bg-white/10 transition-all relative">
                        <span id="notif-bell-icon">${SVG_BELL}</span>
                        <span id="notif-badge" class="absolute -top-1 -right-1 w-4 h-4 bg-be-orange border-2 border-be-darkblue rounded-full text-[8px] font-black flex items-center justify-center text-white hidden">0</span>
                    </button>

                    <!-- Panel de notificaciones -->
                    <div id="notif-panel"
                        class="absolute left-0 bottom-full mb-4 w-80 bg-white rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.3)] border border-gray-200 hidden overflow-hidden z-50 origin-bottom-left transition-all duration-300 scale-95 opacity-0">
                        <div class="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                            <span class="text-[10px] font-black text-slate-500 uppercase tracking-widest">Notificaciones</span>
                            <button onclick="clearAllNotifications()" class="text-[9px] font-bold text-be-orange hover:underline">Marcar leídas</button>
                        </div>
                        <div id="notif-list" class="max-h-72 overflow-y-auto divide-y divide-gray-100">
                            <div class="p-8 text-center text-slate-400 text-[10px] font-bold uppercase">Cargando...</div>
                        </div>
                        <div class="p-3 bg-gray-50 border-t border-gray-100 text-center">
                            <span class="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Centro de Solicitudes</span>
                        </div>
                    </div>
                </div>

                <!-- Avatar + Nombre + Logout -->
                <div class="flex items-center gap-3 flex-1 min-w-0">
                    <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-be-blue to-be-darkblue border border-white/10 flex items-center justify-center text-white font-black text-sm shadow-lg flex-shrink-0">
                        ${(loggedInSupervisorName || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div class="flex flex-col min-w-0">
                        <span class="text-xs font-bold text-white truncate max-w-[80px]">${uiName}</span>
                        <span class="text-[8px] font-medium text-gray-400 truncate uppercase tracking-widest">${isAdmin ? 'Admin' : (window.loggedInJefatura ? 'Jefatura' : 'Supervisor')}</span>
                    </div>
                    <button onclick="logout()" class="ml-auto w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all flex-shrink-0">
                        <i class="fa-solid fa-right-from-bracket text-xs"></i>
                    </button>
                </div>
            </div>
        </div>
    `;

    sidebar.innerHTML = html;

    // Actualizar contador de dotación si los datos están listos
    updateNavCounters();
}

function updateNavCounters() {
    if (typeof globalExecutives !== 'undefined' && typeof ExecutiveStore !== 'undefined') {
        const enrichedTeam = globalExecutives.map(ex => ExecutiveStore.getEnrichedEx(ex));
        let count = 0;
        let sessionSups = [];
        try {
            const stored = sessionStorage.getItem('loggedInJefaturaSups') || localStorage.getItem('loggedInJefaturaSups');
            if (stored) sessionSups = JSON.parse(stored);
        } catch(e) {}

        const currentRole = sessionStorage.getItem('userRole') || localStorage.getItem('userRole');
        const isAdmin = currentRole === 'admin';

        if (isAdmin || window.loggedInJefatura || sessionSups.length > 0) {
            const sups = new Set();
            const mySups = (sessionSups.length > 0 ? sessionSups : (window.loggedInJefaturaSups || [])).map(s => s.trim().toUpperCase());
            enrichedTeam.forEach(ex => {
                const exSup = (ex.supervisor || '').trim().toUpperCase();
                if (exSup && ex.isActivo !== false) {
                    if (mySups.length === 0 || mySups.includes(exSup)) sups.add(exSup);
                }
            });
            count = sups.size;
        } else {
            count = enrichedTeam.filter(ex => ex.supervisor === loggedInSupervisorName && ex.isActivo !== false).length;
        }
        const badge = document.getElementById('nav-count-ejecs');
        if (badge) badge.innerText = count;
    }
}

function logout() {
    if (confirm('¿Deseas cerrar la sesión actual?')) {
        sessionStorage.clear();
        localStorage.removeItem('loggedInSupervisorName');
        localStorage.removeItem('userRole');
        localStorage.removeItem('loggedInJefaturaSups');
        window.location.href = 'login.html';
    }
}

// Funciones de notificaciones (se mantienen igual pero con chequeos de existencia)
function toggleNotificationPanel() {
    const panel = document.getElementById('notif-panel');
    if (!panel) return;
    const isHidden = panel.classList.contains('hidden');
    if (isHidden) {
        panel.classList.remove('hidden');
        setTimeout(() => {
            panel.classList.remove('scale-95', 'opacity-0');
            panel.classList.add('scale-100', 'opacity-100');
        }, 10);
    } else {
        panel.classList.add('scale-95', 'opacity-0');
        panel.classList.remove('scale-100', 'opacity-100');
        setTimeout(() => panel.classList.add('hidden'), 300);
    }
}

function initNotificationLogic() {
    // Lógica de notificaciones...
    console.log('[ui-components] Notificaciones inicializadas');
}
