
let currentDotPage = 1;
const itemsPerDotPage = 25;
let dotFilteredExecs = [];
let dotCurrentFilter = 'TODOS';
let dotSearchQuery = '';

// Icons
const DOT_SVG_USER = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;

document.addEventListener('DOMContentLoaded', () => {
    // Inicializar Sidebar
    if (typeof renderSidebar === 'function') {
        setTimeout(renderSidebar, 100);
    }

    // Inicializar Datos
    setTimeout(() => {
        if (typeof globalExecutives !== 'undefined') {
            applyFilters();
            initSearch();
        }
    }, 250);
});

window.addEventListener('db_ready', () => {
    if (typeof globalExecutives !== 'undefined') {
        applyFilters();
        initSearch();
    }
});

function initSearch() {
    const searchInput = document.getElementById('dot-search');
    if (!searchInput) return;
    searchInput.addEventListener('input', (e) => {
        dotSearchQuery = e.target.value.toLowerCase();
        currentDotPage = 1;
        applyFilters();
    });
}

function filterByStatus(status) {
    dotCurrentFilter = status;
    currentDotPage = 1;

    // Actualizar UI tabs
    document.querySelectorAll('.dot-tab').forEach(tab => {
        tab.classList.remove('active');
        tab.classList.add('bg-white', 'text-slate-500', 'border-slate-200');
    });
    
    const activeTabId = status === 'TODOS' ? 'tab-TODOS' : 
                      status === 'Activo' ? 'tab-ACTIVO' :
                      status === 'Fuera Falta Grave' ? 'tab-FUERA' :
                      status === 'Renuncia/Termino' ? 'tab-RENUNCIA' : 'tab-LICENCIA';
    
    const activeTab = document.getElementById(activeTabId);
    if (activeTab) {
        activeTab.classList.remove('bg-white', 'text-slate-500', 'border-slate-200');
        activeTab.classList.add('active');
    }

    applyFilters();
}

function applyFilters() {
    let result = [...globalExecutives];
    const user = (window.loggedInSupervisorName || '').toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toUpperCase();
    const userRole = sessionStorage.getItem('userRole');
    
    // 1. Filtrar por Rol (Supervisor o Jefatura)
    if (userRole === 'admin') {
        // Si es admin, ver solo los supervisores a su cargo
        let jefSups = [];
        const storedSups = sessionStorage.getItem('loggedInJefaturaSups');
        if (storedSups) {
            try { jefSups = JSON.parse(storedSups).map(s => s.toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toUpperCase()); } catch(e) {}
        }
        
        if (jefSups.length > 0) {
            result = result.filter(ex => {
                const exSup = (ex.supervisor || '').toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toUpperCase();
                return jefSups.includes(exSup);
            });
        }
    } else {
        // Si es supervisor, ver solo su equipo
        result = result.filter(ex => {
            const exSup = (ex.supervisor || '').toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toUpperCase();
            return exSup === user;
        });
    }

    // 2. Status Filter
    if (dotCurrentFilter !== 'TODOS') {
        result = result.filter(ex => ex.estadoDotacion === dotCurrentFilter);
    }

    // 3. Search Filter
    if (dotSearchQuery) {
        result = result.filter(ex => 
            (ex.nombre && ex.nombre.toLowerCase().includes(dotSearchQuery)) || 
            (ex.rut && ex.rut.toLowerCase().includes(dotSearchQuery)) ||
            (ex.supervisor && ex.supervisor.toLowerCase().includes(dotSearchQuery)) ||
            (ex.usuario && ex.usuario.toLowerCase().includes(dotSearchQuery))
        );
    }

    dotFilteredExecs = result;
    renderDotacionTable();
}

function renderDotacionTable() {
    const tableBody = document.getElementById('dotacion-table-body');
    const badge = document.getElementById('dot-count-badge');
    const info = document.getElementById('dot-pagination-info');
    const subtitle = document.getElementById('dotacion-subtitle');
    
    if (!tableBody) return;

    if (badge) badge.innerText = `${dotFilteredExecs.length.toLocaleString()} Registros`;
    if (subtitle) subtitle.innerText = `Visualizando dotación global y estados operacionales`;

    const totalPages = Math.ceil(dotFilteredExecs.length / itemsPerDotPage);
    if (currentDotPage > totalPages && totalPages > 0) currentDotPage = totalPages;

    const startIdx = (currentDotPage - 1) * itemsPerDotPage;
    const endIdx = startIdx + itemsPerDotPage;
    const pageItems = dotFilteredExecs.slice(startIdx, endIdx);

    if (info) info.innerText = `Mostrando ${startIdx + 1} a ${Math.min(endIdx, dotFilteredExecs.length)} de ${dotFilteredExecs.length.toLocaleString()} ejecutivos`;

    tableBody.innerHTML = '';

    if (pageItems.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="6" class="px-6 py-20 text-center text-slate-400 italic text-sm">No se encontraron ejecutivos con los filtros aplicados.</td></tr>`;
        return;
    }

    pageItems.forEach(ex => {
        const tr = document.createElement('tr');
        tr.className = "hover:bg-slate-50/80 transition-colors group";
        
        let statusClass = "bg-emerald-50 text-emerald-700 border-emerald-100";
        let statusIcon = "fa-circle-check";
        
        if (ex.estadoDotacion === 'Fuera Falta Grave') {
            statusClass = "bg-rose-50 text-rose-700 border-rose-100";
            statusIcon = "fa-circle-xmark";
        } else if (ex.estadoDotacion === 'Renuncia/Termino') {
            statusClass = "bg-slate-100 text-slate-600 border-slate-200";
            statusIcon = "fa-user-slash";
        } else if (ex.estadoDotacion === 'Licencia/Apoyo') {
            statusClass = "bg-amber-50 text-amber-700 border-amber-100";
            statusIcon = "fa-clock-rotate-left";
        }

        tr.innerHTML = `
            <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-slate-100/50 flex items-center justify-center text-slate-400 group-hover:bg-[#004b87]/10 group-hover:text-[#004b87] transition-all">
                        ${DOT_SVG_USER.replace('viewBox', 'class="w-5 h-5" viewBox')}
                    </div>
                    <div>
                        <div class="text-[12px] font-black text-[#002D56] leading-tight uppercase line-clamp-1">${ex.nombre}</div>
                        <div class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">${ex.usuario || 'Sin Usuario'}</div>
                    </div>
                </div>
            </td>
            <td class="px-6 py-4">
                <span class="text-[11px] font-mono font-bold text-slate-500 bg-slate-50 px-2 py-1 rounded border border-slate-100">${ex.rut}</span>
            </td>
            <td class="px-6 py-4">
                <div class="text-[11px] font-bold text-slate-700 uppercase line-clamp-1">${ex.supervisor}</div>
                <div class="text-[9px] font-medium text-slate-400 uppercase tracking-tighter line-clamp-1 italic">${ex.jefatura}</div>
            </td>
            <td class="px-6 py-4">
                <div class="text-[10px] font-black text-slate-600 uppercase tracking-wide line-clamp-2 max-w-[250px]">${ex.detalleEstado || ex.estadoDotacion}</div>
                ${ex.isActivo === false ? `<div class="text-[9px] font-bold text-rose-400 uppercase tracking-widest mt-1"><i class="fa-solid fa-triangle-exclamation mr-1"></i> No Operativo</div>` : ''}
            </td>
            <td class="px-6 py-4">
                <div class="text-[11px] font-bold text-slate-500 uppercase">${ex.fechaTermino || '---'}</div>
            </td>
            <td class="px-6 py-4 text-center">
                <a href="gestion.html?rut=${ex.rut}" 
                   class="inline-flex items-center justify-center w-9 h-9 bg-white border border-slate-200 text-slate-400 rounded-xl hover:text-be-orange hover:border-be-orange hover:bg-be-orange/5 transition-all outline-none"
                   title="Ver Hoja de Vida">
                    <i class="fa-solid fa-clipboard-user"></i>
                </a>
            </td>
        `;
        tableBody.appendChild(tr);
    });
}

function prevPage() {
    if (currentDotPage > 1) {
        currentDotPage--;
        renderDotacionTable();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function nextPage() {
    const totalPages = Math.ceil(dotFilteredExecs.length / itemsPerDotPage);
    if (currentDotPage < totalPages) {
        currentDotPage++;
        renderDotacionTable();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}
