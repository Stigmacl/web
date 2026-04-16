/**
   Gestión Supervisor - Admin Controller (RESTAURACIÓN TOTAL DE DISEÑO Y FUNCIONALIDAD)
   Logic for handling global KPIs, real error mapping, and ChartJS integration.
*/

document.addEventListener('DOMContentLoaded', () => {
    try {
        if (typeof Chart !== 'undefined' && typeof ChartDataLabels !== 'undefined') {
            Chart.register(ChartDataLabels);
        }
    } catch (e) {
        console.error("Error registrando ChartDataLabels:", e);
    }
});

window.addEventListener('db_ready', () => {
    try {
        initAdmin();
    } catch (e) {
        console.error("Error crítico al iniciar Admin:", e);
        setTimeout(() => renderAdminView(), 500);
    }
});

let allExecutivesData = [];
let allErrorsData = [];
let charts = {};
window.currentCategoryFilter = null;
window.currentJefaturaFilter = null;
window.currentSupervisorFilter = 'ALL';

function initAdmin() {
    const executivesSource = (typeof globalExecutives !== 'undefined') ? globalExecutives : [];
    const errorsSource = (typeof globalErrorsCollection !== 'undefined') ? globalErrorsCollection : [];
    
    allErrorsData = JSON.parse(JSON.stringify(errorsSource)); 
    allExecutivesData = executivesSource.map(ex => (typeof ExecutiveStore !== 'undefined') ? ExecutiveStore.getEnrichedEx(ex) : ex);
    
    populateSupervisorFilter();
    renderAdminView();
}

function populateSupervisorFilter() {
    const supervisors = new Set();
    allExecutivesData.forEach(ex => {
        if (ex.supervisor && ex.supervisor.trim() !== '' && ex.isActivo !== false) {
            supervisors.add(ex.supervisor.trim().toUpperCase());
        }
    });
    const sorted = Array.from(supervisors).sort();
    const select = document.getElementById('admin-supervisor-filter');
    if (select) {
        select.innerHTML = '<option value="ALL">TODA LA EMPRESA (VISIÓN CONSOLIDADA)</option>';
        sorted.forEach(sup => {
            const opt = document.createElement('option');
            opt.value = sup;
            opt.innerText = sup;
            select.appendChild(opt);
        });
        select.value = window.currentSupervisorFilter;
        select.onchange = (e) => {
            window.currentSupervisorFilter = e.target.value;
            renderAdminView();
        };
    }
}

function getFilteredData() {
    let filtered = [...allErrorsData];
    if (window.currentJefaturaFilter && typeof globalJefaturaMap !== 'undefined') {
        const sups = (globalJefaturaMap[window.currentJefaturaFilter] || []).map(s => s.trim().toUpperCase());
        filtered = filtered.filter(err => sups.includes((err.supervisor || '').trim().toUpperCase()));
    }
    if (window.currentSupervisorFilter !== 'ALL') {
        filtered = filtered.filter(err => (err.supervisor || '').trim().toUpperCase() === window.currentSupervisorFilter);
    }
    if (window.currentCategoryFilter) {
        filtered = filtered.filter(err => err.categoria === window.currentCategoryFilter);
    }
    
    const dateFilter = document.getElementById('admin-date-filter')?.value;
    if (dateFilter) {
        const [fYear, fMonth] = dateFilter.split('-');
        filtered = filtered.filter(err => {
            const d = (err.fecha || "").toLowerCase();
            const monthNamesES = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
            const mIdx = parseInt(fMonth, 10) - 1;
            return (d.includes(monthNamesES[mIdx]) || d.includes("-" + fMonth) || d.includes("/" + fMonth)) && d.includes(fYear);
        });
    }
    return filtered;
}

function renderAdminView() {
    renderJefaturaCards();
    renderKPIs();
    renderCharts();
    renderTables();
}

const JEFATURA_THEMES = [
    { primary: '#004b87', secondary: '#002D56', light: '#EFF6FF', text: '#1E40AF', gradient: 'from-[#004b87] via-[#0369a1] to-[#002D56]' },
    { primary: '#f37021', secondary: '#c2410c', light: '#FFF7ED', text: '#9A3412', gradient: 'from-[#f37021] via-[#ea580c] to-[#c2410c]' },
    { primary: '#8B5CF6', secondary: '#5B21B6', light: '#F5F3FF', text: '#5B21B6', gradient: 'from-[#8B5CF6] via-[#7C3AED] to-[#5B21B6]' },
    { primary: '#10B981', secondary: '#065F46', light: '#ECFDF5', text: '#065F46', gradient: 'from-[#10B981] via-[#059669] to-[#065F46]' },
    { primary: '#F43F5E', secondary: '#9F1239', light: '#FFF1F2', text: '#9F1239', gradient: 'from-[#F43F5E] via-[#E11D48] to-[#9F1239]' }
];

function renderJefaturaCards() {
    const container = document.getElementById('jefatura-cards-container');
    if (!container || typeof globalJefaturaMap === 'undefined') return;
    container.innerHTML = '';

    Object.keys(globalJefaturaMap).forEach((jef, index) => {
        const theme = JEFATURA_THEMES[index % JEFATURA_THEMES.length];
        const jefSups = globalJefaturaMap[jef] || [];
        const jefErrors = allErrorsData.filter(err => {
            const supNorm = (err.supervisor || '').trim().toUpperCase();
            return jefSups.some(s => s.trim().toUpperCase() === supNorm);
        });
        const jefPend = jefErrors.filter(e => (e.estado || '').toLowerCase() === 'pendiente' || !e.estado).length;
        const pct = jefErrors.length > 0 ? Math.round(((jefErrors.length - jefPend) / jefErrors.length) * 100) : 100;
        const isActive = window.currentJefaturaFilter === jef;

        const card = document.createElement('div');
        card.className = `relative group rounded-[2.5rem] overflow-hidden transition-all duration-500 cursor-pointer shadow-xl hover:-translate-y-2 ${isActive ? 'ring-4 ring-offset-4 ring-be-orange scale-[1.02]' : ''}`;
        card.style.background = isActive ? `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})` : 'white';
        card.onclick = () => window.setJefaturaFilter(jef);

        card.innerHTML = `
            <div class="p-6">
                <div class="flex items-center gap-4 mb-4">
                    <div class="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-[#004b87] font-bold">
                        <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(jef)}&background=f1f5f9&color=004b87&bold=true" class="w-full h-full rounded-2xl">
                    </div>
                    <div>
                        <h3 class="font-black uppercase tracking-tight ${isActive ? 'text-white' : 'text-slate-800'}">${jef}</h3>
                        <p class="text-[10px] font-bold uppercase opacity-60 ${isActive ? 'text-white' : 'text-slate-400'}">Jefatura de Equipo</p>
                    </div>
                </div>
                <div class="grid grid-cols-3 gap-2 mb-4">
                    <div class="text-center p-2 rounded-xl ${isActive ? 'bg-white/10' : 'bg-slate-50'}">
                        <div class="text-lg font-black ${isActive ? 'text-white' : 'text-[#004b87]'}">${jefSups.length}</div>
                        <div class="text-[8px] font-bold uppercase ${isActive ? 'text-white/60' : 'text-slate-400'}">Sups</div>
                    </div>
                    <div class="text-center p-2 rounded-xl ${isActive ? 'bg-white/10' : 'bg-rose-50'}">
                        <div class="text-lg font-black ${isActive ? 'text-white' : 'text-rose-500'}">${jefErrors.length}</div>
                        <div class="text-[8px] font-bold uppercase ${isActive ? 'text-white/60' : 'text-slate-400'}">Err</div>
                    </div>
                    <div class="text-center p-2 rounded-xl ${isActive ? 'bg-white/10' : 'bg-emerald-50'}">
                        <div class="text-lg font-black ${isActive ? 'text-white' : 'text-emerald-500'}">${pct}%</div>
                        <div class="text-[8px] font-bold uppercase ${isActive ? 'text-white/60' : 'text-slate-400'}">Gest</div>
                    </div>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

function renderKPIs() {
    const data = getFilteredData();
    let dotacionFiltrada = allExecutivesData.filter(ex => ex.isActivo !== false);
    if (window.currentSupervisorFilter !== 'ALL') {
        dotacionFiltrada = dotacionFiltrada.filter(ex => (ex.supervisor || '').trim().toUpperCase() === window.currentSupervisorFilter);
    } else if (window.currentJefaturaFilter && typeof globalJefaturaMap !== 'undefined') {
        const sups = (globalJefaturaMap[window.currentJefaturaFilter] || []).map(s => s.trim().toUpperCase());
        dotacionFiltrada = dotacionFiltrada.filter(ex => sups.includes((ex.supervisor || '').trim().toUpperCase()));
    }

    const totalErrores = data.length;
    const pendientes = data.filter(e => (e.estado || '').toLowerCase() === 'pendiente' || !e.estado).length;
    const gestionados = totalErrores - pendientes;
    const tasaGestion = totalErrores > 0 ? Math.round((gestionados / totalErrores) * 100) : 100;
    const ejecutivosConError = new Set(data.map(e => (e.ejecutivo || '').trim().toUpperCase()));
    const ejecutivosSinError = dotacionFiltrada.filter(ex => !ejecutivosConError.has((ex.nombre || '').trim().toUpperCase())).length;
    const pctCumplimiento = dotacionFiltrada.length > 0 ? Math.round((ejecutivosSinError / dotacionFiltrada.length) * 100) : 100;

    const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.innerText = val; };
    setVal('kpi-admin-total', dotacionFiltrada.length);
    setVal('kpi-admin-errores', totalErrores);
    setVal('kpi-admin-pendientes', pendientes);
    setVal('kpi-admin-gestionados', gestionados);
    setVal('kpi-admin-cumplimiento', pctCumplimiento + '%');
    setVal('kpi-admin-tasa', tasaGestion + '%');
}

function renderCharts() {
    const data = getFilteredData();
    
    // 1. Distribución por Categoría (Donut)
    const catMap = {};
    data.forEach(e => { const cat = e.categoria || 'Otros'; catMap[cat] = (catMap[cat] || 0) + 1; });
    updateChart('admin-chart-category', 'doughnut', {
        labels: Object.keys(catMap),
        datasets: [{ data: Object.values(catMap), backgroundColor: ['#004b87', '#F37021', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B'], borderWidth: 2, borderColor: '#ffffff' }]
    }, { cutout: '70%', plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 9, weight: 'bold' } } } } });

    // 2. Incidencia por Tipo de Agendamiento (Barra Vertical) - SOLICITUD USUARIO
    const tipoMap = {};
    data.forEach(e => { 
        const tipo = e.tipo || 'Sin Tipo'; 
        tipoMap[tipo] = (tipoMap[tipo] || 0) + 1; 
    });
    updateChart('admin-chart-incidencia', 'bar', {
        labels: Object.keys(tipoMap),
        datasets: [{ label: 'Casos', data: Object.values(tipoMap), backgroundColor: '#F37021', borderRadius: 8, barThickness: 25 }]
    }, { plugins: { datalabels: { display: true, anchor: 'end', align: 'top', font: { weight: 'bold' } } } });

    // 3. Análisis por Tipo de Agendamiento (Barra Horizontal) - SOLICITUD USUARIO
    const agendamientoTipoMap = {};
    data.filter(e => e.categoria === 'Agendamientos').forEach(e => {
        const t = e.tipo || 'Sin Tipo';
        agendamientoTipoMap[t] = (agendamientoTipoMap[t] || 0) + 1;
    });
    updateChart('admin-chart-agendamientos', 'bar', {
        labels: Object.keys(agendamientoTipoMap),
        datasets: [{ label: 'Total', data: Object.values(agendamientoTipoMap), backgroundColor: '#8B5CF6', borderRadius: 8 }]
    }, { indexAxis: 'y' });

    // 4. Top Supervisores
    const supMap = {};
    data.forEach(e => { const s = e.supervisor || 'SIN SUPERVISOR'; supMap[s] = (supMap[s] || 0) + 1; });
    const topSups = Object.entries(supMap).sort((a,b) => b[1] - a[1]).slice(0, 5);
    updateChart('admin-chart-top-sups', 'bar', {
        labels: topSups.map(x => x[0]),
        datasets: [{ label: 'Errores', data: topSups.map(x => x[1]), backgroundColor: '#004b87', borderRadius: 8 }]
    });

    // 5. Tendencia
    const trendMap = {};
    data.forEach(e => { const d = e.fecha || 'S/F'; trendMap[d] = (trendMap[d] || 0) + 1; });
    const sortedDates = Object.keys(trendMap).sort((a,b) => new Date(a) - new Date(b)).slice(-10);
    updateChart('admin-chart-tendencia', 'line', {
        labels: sortedDates,
        datasets: [{ label: 'Errores', data: sortedDates.map(d => trendMap[d]), borderColor: '#0ea5e9', backgroundColor: 'rgba(14, 165, 233, 0.1)', fill: true, tension: 0.4 }]
    });
}

function renderTables() {
    const container = document.getElementById('admin-list');
    if (!container) return;
    container.innerHTML = '';
    const data = getFilteredData();
    const countEl = document.getElementById('admin-list-count');
    if (countEl) countEl.innerText = `${data.length} Ejecutivos con Errores`;

    const execMap = {};
    data.forEach(err => {
        const name = err.ejecutivo || 'Desconocido';
        if (!execMap[name]) execMap[name] = { count: 0, supervisor: err.supervisor, lastError: err.categoria };
        execMap[name].count++;
    });

    Object.entries(execMap).slice(0, 15).forEach(([name, info]) => {
        const card = document.createElement('div');
        card.className = 'bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col';
        card.innerHTML = `
            <div class="flex justify-between items-start mb-3">
                <div class="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-be-blue font-black text-xs">${name.charAt(0)}</div>
                <span class="text-[10px] font-black px-2 py-1 rounded-lg bg-rose-50 text-rose-600 border border-rose-100">${info.count} Errores</span>
            </div>
            <h4 class="text-xs font-black text-slate-800 uppercase mb-1 truncate">${name}</h4>
            <p class="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-3">${info.supervisor || 'Sin Supervisor'}</p>
            <div class="mt-auto pt-3 border-t border-slate-50 flex justify-between items-center">
                <span class="text-[8px] font-black text-slate-300 uppercase">Último: ${info.lastError}</span>
                <i class="fa-solid fa-chevron-right text-slate-200 text-[10px]"></i>
            </div>
        `;
        container.appendChild(card);
    });
}

function updateChart(id, type, data, options = {}) {
    const ctx = document.getElementById(id);
    if (!ctx) return;
    if (charts[id]) charts[id].destroy();
    charts[id] = new Chart(ctx, { type: type, data: data, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: type === 'doughnut', position: 'bottom' }, datalabels: { display: false } }, ...options } });
}

window.setJefaturaFilter = function(jefaturaName) { window.currentJefaturaFilter = (window.currentJefaturaFilter === jefaturaName) ? null : jefaturaName; renderAdminView(); };
window.clearCategoryFilter = function() { window.currentCategoryFilter = null; renderAdminView(); };
window.exportAdminData = function() { alert("Exportando datos consolidados..."); };
