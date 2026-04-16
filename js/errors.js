/* 
   Gestión Supervisor - Errors Module (Double Comparison Fix)
   Replicates the exact KPI calculation, color mapping, and truncated name formats.
*/

let filteredErrors = [];
let currentView = 'table';
let currentErrorPage = 1;
const errorItemsPerPage = 10;

const catColors = {
    'Agendamientos': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', icon: 'fa-calendar-xmark' },
    'Ley Fraude': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', icon: 'fa-shield-halved' },
    'Desbloqueos APP': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: 'fa-mobile-screen' },
    'ONP': { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200', icon: 'fa-file-invoice' }
};

function initHistoricoSelect() {
    const sel = document.getElementById('filter-historico-mes');
    const mainPicker = document.getElementById('main-month-picker');
    if (!sel && !mainPicker) return;
    
    // Configurar valor por defecto al mes actual (Formato YYYY-MM)
    const now = new Date();
    const yStr = now.getFullYear();
    const mStr = String(now.getMonth() + 1).padStart(2, '0');
    const val = `${yStr}-${mStr}`;
    
    if (sel) sel.value = val;
    if (mainPicker) mainPicker.value = val;
}

document.addEventListener('DOMContentLoaded', () => {
    // 1. Inicializar Filtro de Calendario con el Mes Actual
    const histMonth = document.getElementById('historico-month');
    if (histMonth && !histMonth.value) {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        histMonth.value = `${year}-${month}`;
    }

    initHistoricoSelect();
});

// Renderizar CUANDO la BD esté lista (db-init.js dispara este evento tras cargar MySQL)
window.addEventListener('db_ready', () => {
    if (typeof ErrorPersistenceStore !== 'undefined' && typeof globalErrorsCollection !== 'undefined') {
        ErrorPersistenceStore.sync(globalErrorsCollection);
    }
    if (typeof globalErrorsCollection !== 'undefined' && window.loggedInSupervisorName) {
        filteredErrors = getMyErrors();
        renderErroresUI();
    }
});

// Helper: Obtener errores según el tipo de usuario (Solo de dotación vigente con matching robusto)
function getMyErrors() {
    // Bug 3 Fix: Re-leer desde sessionStorage cada vez, por si el login asignó el valor
    // DESPUÉS de que db-init.js inicializó window.loggedInSupervisorName.
    window.loggedInSupervisorName = sessionStorage.getItem('loggedInSupervisorName') || window.loggedInSupervisorName || null;
    if (!window.loggedInSupervisorName) return [];

    // 1. Obtener llaves de ejecutivos vigentes para este supervisor (criterio tradicional)
    const myVigentesKeys = new Set(getMyExecutives()
        .filter(ex => ex.isActivo !== false)
        .map(ex => getSortedNameKey(ex.nombre)));
    
    // 2. Filtrar colección: Priorizamos coincidencia directa por nombre de supervisor
    //    Esto es crucial para el nuevo reporte de agendamientos que ya viene cruzado por RUT.
    return globalErrorsCollection.filter(e => {
        // Coincidencia Directa por Supervisor (Nuevo reporte) - Normalizamos para evitar fallos de mayúsculas
        const supError = (e.supervisor || e.nombre_supervisor || '').trim().toUpperCase();
if (supError && window.loggedInSupervisorName && 
            supError === window.loggedInSupervisorName.trim().toUpperCase()) {
            return true;
        }

        // Coincidencia por Ejecutivo (Fallback para otros reportes)
        const errKey = getSortedNameKey(e.ejecutivo);
        return myVigentesKeys.has(errKey);
    });
}

function getMyExecutives() {
    if (!window.loggedInSupervisorName) return [];
    if (window.loggedInJefaturaSups && window.loggedInJefaturaSups.length > 0) {
        return globalExecutives.filter(ex => window.loggedInJefaturaSups.includes(ex.supervisor));
    }
    return globalExecutives.filter(ex => ex.supervisor === window.loggedInSupervisorName);
}

function toggleTimeView(mode) {
    const timeFilter = document.getElementById('filter-tiempo');
    const btnActive = document.getElementById('btn-time-active');
    const groupHistory = document.getElementById('group-time-history');
    const calendarSubGroup = document.getElementById('calendar-sub-group');
    const filterEstado = document.getElementById('filter-estado');

    if (timeFilter) {
        timeFilter.value = mode;

        if (mode === 'activos') {
            if (btnActive) btnActive.className = "flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-black transition-all duration-300 bg-white text-be-blue shadow-lg shadow-be-blue/10";
            if (groupHistory) {
                groupHistory.className = "flex items-center rounded-xl transition-all duration-300 hover:bg-white/50 group shrink-0";
                const btnHist = groupHistory.querySelector('button');
                if (btnHist) btnHist.className = "flex items-center gap-2 px-3 py-2 text-[11px] font-black text-slate-400 group-hover:text-be-blue transition-colors";
            }
            if (calendarSubGroup) calendarSubGroup.classList.add('hidden');
            if (filterEstado) filterEstado.classList.add('hidden');
        } else {
            if (btnActive) btnActive.className = "flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-black transition-all duration-300 text-slate-400 hover:text-be-blue";
            if (groupHistory) {
                groupHistory.className = "flex items-center rounded-xl transition-all duration-300 bg-white text-be-blue shadow-lg shadow-be-blue/10 group shrink-0";
                const btnHist = groupHistory.querySelector('button');
                if (btnHist) btnHist.className = "flex items-center gap-2 px-3 py-2 text-[11px] font-black text-be-blue transition-colors";
            }
            if (calendarSubGroup) calendarSubGroup.classList.remove('hidden');
            if (filterEstado) filterEstado.classList.remove('hidden');
        }
        currentErrorPage = 1;
        renderErroresUI();
    }
}

function updateHistoryDate(val) {
    const hiddenMonth = document.getElementById('filter-historico-mes');
    if (hiddenMonth) {
        hiddenMonth.value = val;
        toggleTimeView('historico');
    }
}


function renderErroresUI() {
    const tableBody = document.getElementById('table-body');
    const cardsView = document.getElementById('view-cards');
    if (!tableBody || !cardsView) return;

    const query = document.getElementById('search-input') ? document.getElementById('search-input').value.toLowerCase() : "";
    const catFilter = document.getElementById('filter-categoria') ? document.getElementById('filter-categoria').value : "";
    const timeFilter = document.getElementById('filter-tiempo') ? document.getElementById('filter-tiempo').value : "activos";

    const historicoMesSel = document.getElementById('filter-historico-mes');
    const historicoVal = historicoMesSel ? historicoMesSel.value : "";

    // Cambio dinámico del encabezado de la tabla
    const headerTipo = document.getElementById('table-header-tipo');
    if (headerTipo) {
        if (catFilter === 'ONP') headerTipo.innerText = 'Fecha';
        else if (catFilter === 'Ley Fraude') headerTipo.innerText = 'Tipificación';
        else headerTipo.innerText = 'Tipo / Fecha';
    }

    // Filtrar la data para LA VISTA
    let displayData = getMyErrors();
    if (query) {
        displayData = displayData.filter(i =>
            i.cliente.toLowerCase().includes(query) ||
            i.rut.toLowerCase().includes(query) ||
            i.ejecutivo.toLowerCase().includes(query)
        );
    }
    if (catFilter) {
        displayData = displayData.filter(i => i.categoria === catFilter);
    }

    // Filtrar por Tiempo (Vista Activa vs Archivo Histórico)
    const now = new Date();
    const currentYear  = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 1-12

    /**
     * parseFechaToYearMonth — Bug 1 Fix
     * Convierte el campo fecha al par {year, month} sin importar el formato:
     *   ISO:   "2026-04-15"  → {year:2026, month:4}
     *   Texto: "15 abr 2026" → {year:2026, month:4}
     * Retorna null si no puede parsear.
     */
    function parseFechaToYearMonth(fechaStr) {
        if (!fechaStr) return null;
        const s = fechaStr.trim();

        // Formato ISO: YYYY-MM-DD o YYYY-MM
        const isoMatch = s.match(/^(\d{4})-(\d{2})/);
        if (isoMatch) {
            return { year: parseInt(isoMatch[1], 10), month: parseInt(isoMatch[2], 10) };
        }

        // Formato texto: "DD mes YYYY" o "mes YYYY"
        const monthNames = [
            ['jan','ene'],['feb'],['mar'],['apr','abr'],['may','mai'],['jun'],
            ['jul'],['aug','ago'],['sep'],['oct'],['nov'],['dec','dic']
        ];
        const low = s.toLowerCase();
        for (let i = 0; i < monthNames.length; i++) {
            if (monthNames[i].some(m => low.includes(m))) {
                const yearMatch = s.match(/\d{4}/);
                if (yearMatch) {
                    return { year: parseInt(yearMatch[0], 10), month: i + 1 };
                }
            }
        }
        return null;
    }

    // 1. BASE DE DATOS PARA KPIs (Toda la actividad del periodo seleccionado)
    const kpiBaseData = displayData.filter(i => {
        const parsed = parseFechaToYearMonth(i.fecha);
        if (!parsed) return false;

        if (timeFilter === 'activos') {
            return parsed.year === currentYear && parsed.month === currentMonth;
        } else {
            if (!historicoVal) return false;
            const hParts = historicoVal.split("-");
            const hYear  = parseInt(hParts[0], 10);
            const hMonth = parseInt(hParts[1], 10);
            return parsed.year === hYear && parsed.month === hMonth;
        }
    });


// 2. CALCULAR KPIs (Sobre la base total de casos RECHAZADOS del periodo)
const affectedCases = kpiBaseData.filter(i =>
    i.agendamientoEstado === 'RECHAZADO'
);

const kpiTotal = affectedCases.length;
const kpiPends = affectedCases.filter(e => e.estado === 'pendiente').length;
const kpiDone  = affectedCases.filter(e => e.estado === 'realizado').length;
const execsAfectados = new Set(affectedCases.map(e => e.ejecutivo)).size;


    // 3. FILTRAR PARA LA VISTA (Enfoque operativo solicitado)
    const estadoFilter = document.getElementById('filter-estado')?.value || "";

    displayData = kpiBaseData.filter(i => {
        const isAffected = i.agendamientoEstado === 'RECHAZADO'
        
        if (timeFilter === 'activos') {
            return isAffected && i.estado === 'pendiente';
        } else {
            if (estadoFilter === 'pendiente') {
                return isAffected && i.estado === 'pendiente';
            } else if (estadoFilter === 'realizado') {
                return i.estado === 'realizado';
            } else if (estadoFilter === 'ejecutado') {
                return i.agendamientoEstado === 'EJECUTADO' || i.agendamientoEstado === 'EJECUTADOCONLLAMADO';
            }
            return true; 
        }
    });

    // 4. APLICAR ORDEN DE PRIORIDAD
    displayData.sort((a, b) => {
        const getRank = (item) => {
            const isAffected = item.agendamientoEstado === 'RECHAZADO' || item.categoria !== 'Agendamientos';
            if (isAffected && item.estado === 'pendiente') return 1;
            if (isAffected && item.estado === 'realizado') return 2;
            return 3;
        };
        return getRank(a) - getRank(b);
    });

    document.getElementById('kpi-total-casos').innerText = kpiTotal;
    document.getElementById('kpi-pendientes').innerText = kpiPends;
    document.getElementById('kpi-realizados').innerText = kpiDone;
    document.getElementById('kpi-ejecutivos-implicados').innerText = execsAfectados;

    tableBody.innerHTML = '';
    cardsView.innerHTML = '';
    const paginationContainer = document.getElementById('pagination-container');
    if (paginationContainer) paginationContainer.innerHTML = '';

    if (displayData.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="7" class="px-6 py-12 text-center text-gray-400 font-medium"><i class="fa-regular fa-folder-open text-3xl mb-2 block mx-auto text-gray-200"></i> No se encontraron errores con este filtro.</td></tr>`;
        if (paginationContainer) paginationContainer.classList.add('hidden');
        return;
    }

    // Paginación
    const totalItems = displayData.length;
    const totalPages = Math.ceil(totalItems / errorItemsPerPage);
    if (currentErrorPage > totalPages && totalPages > 0) currentErrorPage = totalPages;

    const startIndex = (currentErrorPage - 1) * errorItemsPerPage;
    const paginatedData = displayData.slice(startIndex, startIndex + errorItemsPerPage);

    paginatedData.forEach(item => {
        const isPending = item.estado === 'pendiente';
        const isPositive = ['EJECUTADO', 'EJECUTADOCONLLAMADO'].includes(item.agendamientoEstado);
        
        const cat = catColors[item.categoria] || catColors['Agendamientos'];
        const nameParts = item.ejecutivo.split(' ');
        const shortName = `${nameParts[0]} ${nameParts[1] || ''}`;

        // TABLE RENDER (Exact styles)
        const tr = document.createElement('tr');
        tr.className = "hover:bg-blue-50/30 transition-colors bg-white border-b border-gray-50 group";
        
        let statusBadge = "";
        if (isPositive) {
            statusBadge = `<span class="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded bg-opacity-80 text-[10px] font-bold border border-emerald-200 uppercase"><i class="fa-solid fa-check-double text-[10px]"></i> ${item.agendamientoEstado}</span>`;
        } else if (isPending) {
            statusBadge = `<span class="inline-flex items-center gap-1.5 bg-red-50 text-red-700 px-2 py-0.5 rounded bg-opacity-80 text-[10px] font-bold border border-red-200 uppercase"><i class="fa-solid fa-circle text-[6px] animate-pulse"></i> Pendiente</span>`;
        } else {
            statusBadge = `<span class="inline-flex items-center gap-1.5 bg-green-50 text-green-700 px-2 py-0.5 rounded bg-opacity-80 text-[10px] font-bold border border-green-200 uppercase"><i class="fa-solid fa-check text-[10px]"></i> Realizado</span>`;
        }

        tr.className = "hover:bg-slate-50 transition-all cursor-default group border-b border-slate-100 last:border-0";
        tr.innerHTML = `
            <td class="px-5 py-4"><span class="inline-flex items-center gap-1.5 ${cat.bg} ${cat.text} px-3 py-1 rounded-lg text-[9px] font-black border ${cat.border} uppercase tracking-[0.1em] text-center w-full justify-center shadow-sm group-hover:scale-105 transition-transform"><i class="fa-solid ${cat.icon} text-[8px]"></i> ${item.categoria}</span></td>
            <td class="px-5 py-4">
                <div class="font-black text-slate-800 text-[13px] uppercase tracking-tighter">${item.rut}</div>
                <div class="text-[10px] text-slate-400 font-bold truncate max-w-[150px] uppercase" title="${item.cliente}">${item.cliente || 'Sin Nombre'}</div>
            </td>
            <td class="px-5 py-4">
                <div class="font-black text-be-blue text-[12px] truncate uppercase tracking-tight group-hover:translate-x-1 transition-transform flex flex-col gap-1">
                    <span><i class="fa-solid fa-headset text-slate-300 mr-2"></i>${shortName}</span>
                    ${(() => {
                        const ex = globalExecutives.find(e => MatchingUtils.isErrorMatch(e, item.ejecutivo));
                        if (ex && ex.estadoDotacion !== 'Activo') {
                            const badgeColor = ex.estadoDotacion === 'Fuera Falta Grave' ? 'bg-rose-100 text-rose-800' : 
                                            ex.estadoDotacion === 'Renuncia/Termino' ? 'bg-slate-100 text-slate-800' : 'bg-amber-100 text-amber-800';
                            return `<span class="text-[8px] font-black px-1.5 py-0.5 rounded ${badgeColor} uppercase tracking-tighter w-fit border border-black/5 opacity-80 animate-pulse">NO OPERATIVO: ${ex.estadoDotacion}</span>`;
                        }
                        return '';
                    })()}
                </div>
            </td>
            <td class="px-5 py-4">
                <div class="text-[10px] text-slate-600 font-black uppercase tracking-tight flex items-center gap-1 whitespace-nowrap"><i class="fa-regular fa-calendar text-be-orange"></i> ${item.fecha}</div>
            </td>
            <td class="px-5 py-4">
                <div class="text-rose-700 font-black text-[12px] leading-tight line-clamp-2 uppercase group-hover:text-rose-600 transition-colors">${item.error}</div>
            </td>
            <td class="px-5 py-4 text-center">${statusBadge}</td>
            <td class="px-5 py-4 text-center">
                <button onclick="openModal('${item.id}')" class="text-[10px] font-black ${isPending ? 'bg-be-blue text-white hover:bg-be-darkblue shadow-lg shadow-be-blue/20' : 'bg-white border border-slate-200 text-slate-400 hover:bg-slate-50'} px-3 py-2 rounded-xl transition-all w-full flex justify-center items-center gap-2 uppercase">
                    <i class="fa-solid ${isPending ? 'fa-gavel' : 'fa-eye'} ${isPending ? 'text-be-orange' : 'text-slate-300'}"></i> ${isPending ? 'Gestionar' : 'Ficha'}
                </button>
            </td>
        `;
        tableBody.appendChild(tr);

        // KANBAN RENDER (Premium Upgrade)
        const card = document.createElement('div');
        card.className = `bg-white rounded-[2.5rem] border-2 border-slate-100 shadow-[0_15px_60px_rgba(0,0,0,0.02)] hover:shadow-[0_40px_80px_rgba(0,45,86,0.12)] hover:-translate-y-4 hover:rotate-1 transition-all duration-500 flex flex-col p-2 group overflow-hidden`;
        card.innerHTML = `
            <div class="p-8 flex-1 flex flex-col bg-white rounded-[2rem]">
                <div class="flex justify-between items-center mb-6">
                    <div class="flex items-center gap-2">
                        <span class="text-[10px] font-black text-slate-300 tracking-[0.2em]">${item.id}</span>
                        <span class="inline-flex items-center gap-1.5 ${cat.bg} ${cat.text} px-2.5 py-1 rounded-lg text-[8px] font-black border ${cat.border} uppercase"><i class="fa-solid ${cat.icon} text-[7px]"></i> ${item.categoria}</span>
                    </div>
                    ${statusBadge}
                </div>
                <div class="mb-5">
                    <h4 class="font-black text-slate-900 text-[16px] leading-tight group-hover:text-be-blue transition-colors uppercase tracking-tight">${item.cliente || 'SIN NOMBRE'}</h4>
                    <p class="text-[11px] text-slate-400 mt-2 font-black flex items-center gap-2 uppercase"><i class="fa-solid fa-address-card w-4 text-be-orange/40"></i> ${item.rut}</p>
                </div>
                <div class="bg-rose-50/40 rounded-2xl border-2 border-rose-100/30 p-5 mb-5 group-hover:bg-rose-50 transition-colors">
                    <p class="text-rose-800 font-bold text-[12px] leading-snug line-clamp-3 uppercase"><i class="fa-solid fa-circle-exclamation mr-2 text-rose-400"></i>${item.error}</p>
                </div>
                <div class="text-[10px] flex items-center justify-between mb-6 mt-auto pt-5 border-t border-slate-50">
                    <div class="font-black text-be-blue truncate pr-2 uppercase"><i class="fa-solid fa-headset text-be-orange/30 mr-2 text-xs"></i> ${shortName}</div>
                    <div class="text-[9px] text-slate-500 font-bold uppercase flex items-center gap-1 whitespace-nowrap"><i class="fa-regular fa-calendar text-be-orange"></i> ${item.fecha}</div>
                </div>
                <button onclick="openModal('${item.id}')" class="text-[11px] font-black ${isPending ? 'bg-be-blue text-white hover:bg-be-darkblue shadow-xl shadow-be-blue/20' : 'bg-white border-2 border-slate-100 text-slate-400 hover:bg-slate-50'} py-4 rounded-[1.2rem] transition-all w-full flex justify-center items-center gap-3 uppercase tracking-wider">
                    <i class="fa-solid ${isPending ? 'fa-gavel text-be-orange' : 'fa-eye text-slate-300'} text-sm"></i> ${isPending ? 'Gestionar Caso' : 'Ver Ficha Técnico'}
                </button>
            </div>
        `;
        cardsView.appendChild(card);
    });

    // Renderizar Controles de Paginación
    if (paginationContainer && totalPages > 1) {
        paginationContainer.classList.remove('hidden');
        
        let paginationHTML = '';
        
        // Botón Anterior
        paginationHTML += `<button onclick="changeErrorPage(${currentErrorPage - 1})" class="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-500 font-bold text-xs hover:bg-slate-50 disabled:opacity-50 transition-colors bg-white shadow-sm" ${currentErrorPage === 1 ? 'disabled' : ''}><i class="fa-solid fa-chevron-left mr-1"></i> Ant</button>`;
        
        // Páginas
        for (let i = 1; i <= totalPages; i++) {
            // Mostrar solo algunas páginas si hay muchas
            if (i === 1 || i === totalPages || (i >= currentErrorPage - 2 && i <= currentErrorPage + 2)) {
                if (i === currentErrorPage) {
                    paginationHTML += `<button class="px-3 py-1.5 rounded-lg bg-be-blue text-white font-black text-xs shadow-md shadow-be-blue/20">${i}</button>`;
                } else {
                    paginationHTML += `<button onclick="changeErrorPage(${i})" class="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-colors bg-white shadow-sm">${i}</button>`;
                }
            } else if (i === currentErrorPage - 3 || i === currentErrorPage + 3) {
                paginationHTML += `<span class="px-2 text-slate-400 text-xs">...</span>`;
            }
        }
        
        // Botón Siguiente
        paginationHTML += `<button onclick="changeErrorPage(${currentErrorPage + 1})" class="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-500 font-bold text-xs hover:bg-slate-50 disabled:opacity-50 transition-colors bg-white shadow-sm" ${currentErrorPage === totalPages ? 'disabled' : ''}>Sig <i class="fa-solid fa-chevron-right ml-1"></i></button>`;
        
        paginationContainer.innerHTML = paginationHTML;
    } else if (paginationContainer) {
        paginationContainer.classList.add('hidden');
    }
}

function changeErrorPage(newPage) {
    currentErrorPage = newPage;
    renderErroresUI();
}

function filterData() {
    currentErrorPage = 1;
    renderErroresUI();
}

function setView(type) {
    currentView = type;
    const table = document.getElementById('view-table');
    const cards = document.getElementById('view-cards');
    const btnTable = document.getElementById('btn-view-table');
    const btnCards = document.getElementById('btn-view-cards');

    if (type === 'table') {
        table.classList.remove('hidden-view');
        cards.classList.add('hidden-view');
        btnTable.className = "px-3 py-1.5 rounded text-sm font-bold bg-white text-be-blue shadow-sm w-28 flex items-center justify-center gap-2";
        btnCards.className = "px-3 py-1.5 rounded text-sm font-bold text-gray-500 hover:text-gray-700 hover:bg-gray-200/50 w-28 flex items-center justify-center gap-2 transition-all";
    } else {
        table.classList.add('hidden-view');
        cards.classList.remove('hidden-view');
        btnCards.className = "px-3 py-1.5 rounded text-sm font-bold bg-white text-be-blue shadow-sm w-28 flex items-center justify-center gap-2";
        btnTable.className = "px-3 py-1.5 rounded text-sm font-bold text-gray-500 hover:text-gray-700 hover:bg-gray-200/50 w-28 flex items-center justify-center gap-2 transition-all";
    }
}

// --- Modales ---
function openModal(id) {
    const err = globalErrorsCollection.find(e => e.id === id);
    if (!err) return;

    window.currentModalErrorId = id;
    
    // Rellenar Campos del Modal
    document.getElementById('modal-id').innerText = id;
    document.getElementById('modal-cliente').innerText = err.cliente || 'NO REGISTRA';
    document.getElementById('modal-rut').innerText = err.rut || 'NO REGISTRA';
    document.getElementById('modal-fecha').innerText = err.fecha;
    document.getElementById('modal-tipo').innerText = err.tipo;
    document.getElementById('modal-ejecutivo').innerText = err.ejecutivo;
    document.getElementById('modal-error').innerText = err.error;
    
    const cat = (err.categoria || '').toUpperCase();

    // Observación de Fusión (Lo que ingresó el ejecutivo)
    const fusionObs = document.getElementById('modal-obs-fusion');
    if (fusionObs) {
        const fallbackText = (cat.includes('FRAUDE') || cat.includes('DESBLOQUEO'))
            ? "ESTE REPORTE NO INCLUYE OBSERVACIONES POR PARTE DEL EJECUTIVO."
            : "EL EJECUTIVO NO INGRESÓ OBSERVACIONES ADICIONALES EN FUSIÓN.";
        
        // SOLICITUD USUARIO: observaciones_fusion viene de ag.observaciones en db-init.js
        fusionObs.innerText = err.observaciones_fusion || err.obsFusion || err.observacion || fallbackText;
    }
    
    // Modificaciones Dinámicas de Etiquetas y Visibilidad en Grid de Datos del Cliente
    const containerCliente = document.getElementById('modal-cliente')?.parentElement;
    const lblCliente = document.getElementById('modal-cliente')?.previousElementSibling;
    if (containerCliente && lblCliente) {
        containerCliente.classList.toggle('hidden', cat.includes('ONP'));
        lblCliente.innerText = cat.includes('FRAUDE') ? "N° Requerimiento / Reclamo" : "Nombre Contacto";
    }

    const containerTipo = document.getElementById('modal-tipo')?.parentElement;
    const lblTipo = document.getElementById('modal-tipo')?.previousElementSibling;
    if (containerTipo && lblTipo) {
        if (cat.includes('ONP')) {
            containerTipo.classList.add('hidden');
        } else {
            containerTipo.classList.remove('hidden');
            lblTipo.innerText = cat.includes('FRAUDE') ? "Tipificación" : "Tipo de Agendamiento";
        }
    }

    // Asegurar que el bloque esté visible y no oculto
    const obsFusionContainer = document.getElementById('modal-obs-fusion')?.parentElement;
    if (obsFusionContainer) {
        obsFusionContainer.classList.remove('hidden');
    }

    // Campos Dinámicos por Categoría
    const extraBox = document.getElementById('modal-extra-fields');
    if (extraBox) {
        extraBox.innerHTML = '';
        
        if (cat.includes('ONP')) {
            extraBox.innerHTML = `
                <div>
                    <span class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Cheques No Bloqueados</span>
                    <span class="text-xs font-black text-rose-700 bg-rose-50 border border-rose-100 px-3 py-1.5 rounded-lg inline-block uppercase tracking-tight">${err.chequesNoBloqueados || 'N/A'}</span>
                </div>
            `;
        } else if (cat.includes('DESBLOQUEO')) {
            let dApp = err.desbloqueoApp || '---';
            let dRutPay = err.desbloqueoRutPay || '---';
            let dAutenticado = err.autenticado || '---';
            let dTAutenticado = err.tipoAutenticado || '---';

            extraBox.innerHTML = `
                <div class="grid grid-cols-3 gap-4">
                    <div class="bg-blue-50/50 p-2 rounded-lg border border-blue-100/50">
                        <span class="block text-[8px] font-bold text-slate-400 uppercase">Desbloqueo APP</span>
                        <span class="text-[10px] font-black text-be-blue uppercase">${dApp}</span>
                    </div>
                    <div class="bg-blue-50/50 p-2 rounded-lg border border-blue-100/50">
                        <span class="block text-[8px] font-bold text-slate-400 uppercase">RutPay</span>
                        <span class="text-[10px] font-black text-be-blue uppercase">${dRutPay}</span>
                    </div>
                    <div class="bg-blue-50/50 p-2 rounded-lg border border-blue-100/50">
                        <span class="block text-[8px] font-bold text-slate-400 uppercase">Autenticado</span>
                        <span class="text-[10px] font-black text-slate-700 uppercase">${dAutenticado} (${dTAutenticado})</span>
                    </div>
                </div>
            `;
        }

    }


    // Resolución del Supervisor (MODO PERMISIVO PARA IGNACIO Y SUPERVISORES)
    const userRole = localStorage.getItem('user_role') || "supervisor";
    const userRut = localStorage.getItem('user_rut') || "";
    
    // Si eres supervisor o jefa, TIENES que poder escribir (prioridad operativa)
    const isOwner = (userRole === 'supervisor' || userRole === 'jefatura' || userRole === 'admin');
    
    // Solo bloqueamos si el caso ya está cerrado (EJECUTADO por sistema o REALIZADO por supervisor)
    const isLocked = (err.agendamientoEstado === 'EJECUTADO' || 
                      err.agendamientoEstado === 'EJECUTADOCONLLAMADO' || 
                      err.estado === 'realizado' || 
                      err.estado === 'exitoso');
    
    // LOG DE SEGURIDAD PARA DEBUG
    console.log("Debug Gestión:", { 
        supervisorEnError: err.supervisor, 
        usuarioLogueado: window.loggedInSupervisorName,
        rutLogueado: userRut,
        rol: userRole,
        isOwner: isOwner,
        isLocked: isLocked
    });
    
    const saveBtn = document.getElementById('btn-save-text')?.parentElement;
    const feedbackInput = document.getElementById('supervisor-obs');
    
    if (feedbackInput) {
        // Cargar el texto guardado
        feedbackInput.value = err.observacionSupervisor || '';
        
        // Bloquear si no es dueño O si ya está cerrado
        feedbackInput.disabled = !isOwner || isLocked;
        feedbackInput.classList.toggle('bg-slate-100', !isOwner || isLocked);
        feedbackInput.classList.toggle('opacity-70', !isOwner || isLocked);
    }
    
    if (saveBtn) {
        // Ocultar botón de guardar si no es dueño o si ya está cerrado
        if (isOwner && !isLocked) {
            saveBtn.classList.remove('hidden');
        } else {
            saveBtn.classList.add('hidden');
        }
    }
    
    // Texto informativo
    // 1. Resetear el estado visual del mensaje de ayuda (Evitar ghosting)
    const helpText = document.getElementById('m-err-help-text');
    if (helpText) {
        helpText.innerHTML = "INGRESA EL FEEDBACK / CORRECCIÓN PACTADA.";
        helpText.className = "text-[10px] font-bold text-slate-400 mb-4 uppercase";
    }

    if (helpText) {
        if (isLocked) {
            const isAutoClosed = (err.agendamientoEstado === 'EJECUTADO' || 
                                 err.agendamientoEstado === 'EJECUTADOCONLLAMADO' || 
                                 err.estado === 'exitoso');
            
            if (isAutoClosed) {
                helpText.innerHTML = `<i class="fa-solid fa-circle-check text-emerald-500"></i> CASO GESTIONADO Y CERRADO EN LINEA`;
                helpText.className = "text-[10px] font-black text-emerald-600 mb-4 uppercase flex items-center gap-2";
            } else {
                // Caso gestionado manualmente por supervisor
                let supDisplayName = humanizeSupervisor(err.supervisor);
                helpText.innerHTML = `<i class="fa-solid fa-lock text-emerald-500"></i> CASO GESTIONADO Y CERRADO POR: ${supDisplayName}`;
                helpText.className = "text-[10px] font-black text-emerald-600 mb-4 uppercase flex items-center gap-2";
            }
        } else {
            helpText.innerText = isOwner ? "INGRESA EL FEEDBACK / CORRECCIÓN PACTADA." : `CONSULTANDO GESTIÓN DE: ${err.supervisor}`;
            if (!isOwner) helpText.classList.add('text-rose-500');
        }
    }

    document.getElementById('observation-modal').classList.remove('hidden');
}



function closeModal() {
    document.getElementById('observation-modal').classList.add('hidden');
}

async function saveObservation() {
    const obsInput = document.getElementById('supervisor-obs');
    const obs = obsInput ? obsInput.value : '';
    
    const err = globalErrorsCollection.find(e => e.id === window.currentModalErrorId);
    if (!err) return;

    const autor = window.loggedInSupervisorName || 'SUPERVISOR';
    const nuevoEstado = obs.trim() ? 'realizado' : 'pendiente';

    // 1. Actualizar en memoria inmediatamente (respuesta visual rápida)
    err.observacionSupervisor = obs;
    err.estado = nuevoEstado;
    if (obs.trim()) err.supervisor = autor;

    // 2. Feedback visual: botón "Guardando…"
    const btnText = document.getElementById('btn-save-text');
    if (btnText) btnText.innerText = 'Guardando…';

    // 3. Persistir en BD (ApiService) — con fallback a localStorage
    let savedOk = false;
    if (typeof ApiService !== 'undefined') {
        const result = await ApiService.saveGestion({
            id_reporte: err.id,
            autor:      autor,
            nota:       obs,
            estado:     nuevoEstado
        });
        savedOk = result && result.status === 'success';
    }

    // 4. Fallback localStorage (offline / BD caída)
    if (!savedOk && typeof ErrorPersistenceStore !== 'undefined') {
        ErrorPersistenceStore.save(err.id, {
            obs: obs,
            st:  nuevoEstado,
            sup: autor
        });
    }

    // 5. Re-renderizar y cerrar modal
    setTimeout(() => {
        renderErroresUI();
        closeModal();
        if (btnText) btnText.innerText = 'Guardar Gestión Resuelta';
    }, 300);
}

