/**
   Gestión Supervisor - KPI & Analytics Module (RESTAURACIÓN TOTAL DE DISEÑO Y FUNCIONALIDAD SQL)
   Handles chart generation and statistical summaries.
*/

let currentCategoryFilter = null;

// Función auxiliar crítica para el filtrado de nombres (Sincronizada con el resto del sistema)
function getSortedNameKey(name) {
    if (!name) return "";
    return name.trim().toUpperCase();
}

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
    if (typeof ErrorPersistenceStore !== 'undefined' && typeof globalErrorsCollection !== 'undefined') {
        ErrorPersistenceStore.sync(globalErrorsCollection);
    }
    renderKPIDetailUI();
});

function renderKPIDetailUI() {
    const monthFilter = document.getElementById('kpi-month-filter');
    if (monthFilter && !monthFilter.value) {
        const now = new Date();
        monthFilter.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2,'0')}`;
    }
    
    // Sincronizar nombre del supervisor desde la sesión (CRUCIAL PARA SQL)
    const loggedInSup = sessionStorage.getItem('loggedInSupervisorName') || window.loggedInSupervisorName;
    const userRole = sessionStorage.getItem('userRole') || localStorage.getItem('user_role');
    const jefSups = JSON.parse(sessionStorage.getItem('loggedInJefaturaSups') || '[]');
    
    if (!loggedInSup && userRole !== 'admin') {
        console.warn("No se detectó supervisor logueado para KPIs");
        return;
    }

    // Obtener equipo del supervisor o jefatura
    let myTeam = [];
    if (userRole === 'admin') {
        myTeam = globalExecutives;
    } else if (jefSups.length > 0) {
        myTeam = globalExecutives.filter(ex => jefSups.includes(ex.supervisor));
    } else {
        myTeam = globalExecutives.filter(ex => ex.supervisor === loggedInSup);
    }
    
    const myTeamNameKeys = new Set(myTeam.map(ex => getSortedNameKey(ex.nombre)));
    
    // Filtrar registros del equipo por mes y supervisor (Lógica SQL robusta)
    const filteredFullData = globalErrorsCollection.filter(err => {
        // Criterio 1: Supervisor directo (agendamientos cruzados por RUT vía BD)
        if (err.supervisor && loggedInSup &&
            err.supervisor.trim().toUpperCase() === loggedInSup.trim().toUpperCase()) {
            return true;
        }
        // Criterio 2: Nombre de ejecutivo coincide con alguien del equipo (errores tradicionales)
        const errKey = getSortedNameKey(err.ejecutivo);
        return myTeamNameKeys.has(errKey);
    }).filter(e => {
        if (!monthFilter || !monthFilter.value) return true;
        const [targetYear, targetMonth] = monthFilter.value.split('-');
        const d = (e.fecha || "").toLowerCase();
        const monthNamesES = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
        const monthNamesEN = ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"];
        const mIdx = parseInt(targetMonth, 10) - 1;
        
        const matchNombre = (d.includes(monthNamesES[mIdx]) || d.includes(monthNamesEN[mIdx])) && d.includes(targetYear);
        if (matchNombre) return true;

        const matchNumerico = (d.includes("/" + targetMonth) || d.includes("-" + targetMonth) || d.includes("/" + parseInt(targetMonth))) && d.includes(targetYear);
        return matchNumerico;
    });

    const displayData = currentCategoryFilter ? filteredFullData.filter(i => i.categoria === currentCategoryFilter) : filteredFullData;

    // Métricas
    const totalExitos = displayData.filter(i => i.agendamientoEstado === 'EJECUTADO' || i.agendamientoEstado === 'EJECUTADOCONLLAMADO').length;
    const teamErrors = displayData.filter(i => i.agendamientoEstado === 'RECHAZADO' || (i.categoria !== 'Agendamientos' && i.agendamientoEstado !== 'EJECUTADO'));
    const totalErrores = teamErrors.length;

    const universoTotal = totalExitos + totalErrores;
    const efecTasa = universoTotal > 0 ? Math.round((totalExitos / universoTotal) * 100) : 100;

    const resueltos = teamErrors.filter(e => e.estado === 'realizado').length;
    const pendientes = totalErrores - resueltos;
    const tasaGestion = totalErrores > 0 ? Math.round((resueltos / totalErrores) * 100) : 0;

    // Actualizar UI
    const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.innerText = val; };
    setVal('kpi2-dotacion', new Set(teamErrors.map(e => getSortedNameKey(e.ejecutivo))).size);
    setVal('kpi2-cumplimiento', efecTasa + '%');
    setVal('kpi2-rechazos', totalErrores);
    setVal('kpi2-tasa-gestion', tasaGestion + '%');
    
    const centerValEl = document.getElementById('chart-cumplimiento-val');
    if (centerValEl) centerValEl.innerText = efecTasa + '%';

    renderKPICharts(teamErrors, totalExitos, totalErrores, resueltos, pendientes, filteredFullData);
    renderLinealAndAgendamientos(teamErrors);
    renderTopRechazos(teamErrors);
    renderKPITable(teamErrors);
}

function renderKPICharts(errors, totalExitos, totalErrores, resueltos, pendientes, allPossibleData) {
    const categoryCounts = {};
    const source = allPossibleData || errors;
    
    source.forEach(e => {
        const isError = e.agendamientoEstado === 'RECHAZADO' || (e.categoria !== 'Agendamientos' && e.agendamientoEstado !== 'EJECUTADO');
        if (isError) {
            const cat = e.categoria || 'Agendamientos';
            categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
        }
    });
    
    const catLabels = Object.keys(categoryCounts);
    const catData = Object.values(categoryCounts);
    const catColors = ['#004B87', '#F37021', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B'];

    // 1. Donut Distribución
    updateChart('chart-cumplimiento', 'doughnut', {
        labels: catLabels,
        datasets: [{ data: catData, backgroundColor: catColors, borderWidth: 2, borderColor: '#ffffff' }]
    }, { cutout: '70%', plugins: { legend: { display: false } } });

    const legendEl = document.getElementById('chart-cumplimiento-leyenda');
    if (legendEl) {
        legendEl.innerHTML = catLabels.map((label, idx) => `
            <div class="flex items-center gap-2">
                <div class="w-3 h-3 rounded-full shadow-sm" style="background-color: ${catColors[idx % catColors.length]}"></div>
                <span class="text-[9px] font-black text-slate-600 uppercase truncate" style="max-width: 120px;">${label}</span>
            </div>
        `).join('');
    }

    // 2. Incidencia por Tipo de Agendamiento (Barra Vertical) - SOLICITUD USUARIO
    const tipoMap = {};
    errors.forEach(e => { 
        const tipo = e.tipo || 'Sin Tipo'; 
        tipoMap[tipo] = (tipoMap[tipo] || 0) + 1; 
    });
    updateChart('chart-errores-tipo', 'bar', {
        labels: Object.keys(tipoMap),
        datasets: [{ label: 'Casos', data: Object.values(tipoMap), backgroundColor: '#004B87', borderRadius: 8, barThickness: 20 }]
    }, { plugins: { datalabels: { display: true, anchor: 'end', align: 'top', color: '#004B87', font: { size: 10, weight: 'black' } } } });

    // 3. Estado de Gestión (Pie)
    updateChart('chart-estado-gestion', 'pie', {
        labels: ['Resueltos', 'Pendientes'],
        datasets: [{ data: [resueltos, pendientes], backgroundColor: ['#22c55e', '#ef4444'], borderWidth: 2, borderColor: '#ffffff' }]
    }, { plugins: { legend: { position: 'bottom', labels: { font: { size: 10, weight: 'bold' }, boxWidth: 10 } }, datalabels: { display: false } } });
}

function renderLinealAndAgendamientos(errors) {
    const trendMap = {};
    errors.forEach(e => { const d = e.fecha || 'S/F'; trendMap[d] = (trendMap[d] || 0) + 1; });
    const sortedDates = Object.keys(trendMap).sort((a,b) => new Date(a) - new Date(b)).slice(-15);
    updateChart('chart-errores-linea', 'line', {
        labels: sortedDates,
        datasets: [{ label: 'Errores', data: sortedDates.map(d => trendMap[d]), borderColor: '#004B87', backgroundColor: 'rgba(0, 75, 135, 0.1)', fill: true, tension: 0.4 }]
    });

    // Análisis por Tipo de Agendamiento (Barra Horizontal) - SOLICITUD USUARIO
    const agendamientoTipoMap = {};
    errors.filter(e => e.categoria === 'Agendamientos').forEach(e => {
        const t = e.tipo || 'Sin Tipo';
        agendamientoTipoMap[t] = (agendamientoTipoMap[t] || 0) + 1;
    });
    updateChart('chart-agendamientos-tipo', 'bar', {
        labels: Object.keys(agendamientoTipoMap),
        datasets: [{ label: 'Casos', data: Object.values(agendamientoTipoMap), backgroundColor: '#F37021', borderRadius: 8 }]
    }, { indexAxis: 'y' });
}

function renderTopRechazos(errors) {
    const container = document.getElementById('top-rechazos-list');
    if (!container) return;
    container.innerHTML = '';

    const execMap = {};
    errors.forEach(e => {
        const name = e.ejecutivo || 'Desconocido';
        execMap[name] = (execMap[name] || 0) + 1;
    });

    const top = Object.entries(execMap).sort((a,b) => b[1] - a[1]).slice(0, 5);
    top.forEach(([name, count], idx) => {
        const item = document.createElement('div');
        item.className = 'flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100';
        item.innerHTML = `
            <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-be-blue font-black text-xs shadow-sm">${idx+1}</div>
                <span class="text-xs font-black text-slate-700 uppercase">${name}</span>
            </div>
            <span class="text-[10px] font-black px-3 py-1 bg-rose-50 text-rose-600 rounded-full border border-rose-100">${count} Errores</span>
        `;
        container.appendChild(item);
    });
}

function renderKPITable(errors) {
    const container = document.getElementById('table-kpi-ejecutivos');
    if (!container) return;
    container.innerHTML = '';

    const execMap = {};
    errors.forEach(e => {
        const name = e.ejecutivo || 'Desconocido';
        if (!execMap[name]) execMap[name] = { total: 0, pend: 0, res: 0 };
        execMap[name].total++;
        if (e.estado === 'realizado') execMap[name].res++;
        else execMap[name].pend++;
    });

    Object.entries(execMap).forEach(([name, stats]) => {
        const pct = Math.round((stats.res / stats.total) * 100);
        const row = document.createElement('tr');
        row.className = 'hover:bg-slate-50 transition-colors';
        row.innerHTML = `
            <td class="px-6 py-4 font-black text-slate-700 uppercase text-xs">${name}</td>
            <td class="px-4 py-4 text-center font-black text-slate-800">${stats.total}</td>
            <td class="px-4 py-4 text-center font-black text-rose-500">${stats.pend}</td>
            <td class="px-4 py-4 text-center font-black text-emerald-500">${stats.res}</td>
            <td class="px-4 py-4">
                <div class="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div class="bg-be-blue h-full" style="width: ${pct}%"></div>
                </div>
                <div class="text-[9px] font-black text-slate-400 mt-1 text-right">${pct}%</div>
            </td>
            <td class="px-4 py-4 text-center">
                <span class="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${pct === 100 ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}">
                    ${pct === 100 ? 'Óptimo' : 'En Proceso'}
                </span>
            </td>
        `;
        container.appendChild(row);
    });
}

function updateChart(id, type, data, options = {}) {
    const ctx = document.getElementById(id);
    if (!ctx) return;
    if (window['chart_'+id] instanceof Chart) window['chart_'+id].destroy();
    window['chart_'+id] = new Chart(ctx, { type: type, data: data, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: type === 'doughnut' || type === 'pie', position: 'bottom' }, datalabels: { display: false } }, ...options } });
}
