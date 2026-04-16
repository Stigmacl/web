/* 
   Gestión Supervisor - Performance & Service Record (Premium Design Restored + SQL Requests)
*/

let currentSearchScope = 'mi-equipo';
let currentHojaDeVidaFilters = [];
let currentViewEx = null;

document.addEventListener('DOMContentLoaded', () => {
    if (typeof ErrorPersistenceStore !== 'undefined' && typeof globalErrorsCollection !== 'undefined') {
        ErrorPersistenceStore.sync(globalErrorsCollection);
    }

    setTimeout(() => {
        const params = new URLSearchParams(window.location.search);
        const rutParam = params.get('rut');
        if (rutParam && typeof globalExecutives !== 'undefined') {
            const found = globalExecutives.find(ex => normalizeRut(ex.rut) === normalizeRut(rutParam));
            if (found) {
                setSearchScope('todos');
                document.getElementById('consult-input').value = found.rut;
                searchHojaDeVida();
                loadExecutiveProfile(found);
            }
        }
        searchHojaDeVida();
    }, 150);
});

window.addEventListener('db_ready', () => {
    const supSelect = document.getElementById('filter-supervisor');
    if (supSelect) {
        supSelect.innerHTML = '<option value="">TODOS LOS SUPERVISORES</option>';
        const jefaturaSupsSet = new Set();
        if (typeof globalJefaturaMap !== 'undefined') {
            Object.values(globalJefaturaMap).forEach(sups => {
                if (Array.isArray(sups)) {
                    sups.forEach(s => jefaturaSupsSet.add(s.trim().toUpperCase()));
                }
            });
        }
        const activeSupsSet = new Set();
        globalExecutives.forEach(ex => {
            if (ex.isActivo !== false && ex.supervisor) {
                const supNorm = ex.supervisor.trim().toUpperCase();
                if (jefaturaSupsSet.has(supNorm)) activeSupsSet.add(supNorm);
            }
        });
        (window.allSupervisors || []).sort().forEach(sup => {
            if (activeSupsSet.has(sup.trim().toUpperCase())) {
                const opt = document.createElement('option');
                opt.value = sup;
                opt.innerText = sup;
                supSelect.appendChild(opt);
            }
        });
    }
    searchHojaDeVida();
});

function setSearchScope(scope) {
    currentSearchScope = scope;
    const tabMi = document.getElementById('tab-mi-equipo');
    const tabTodos = document.getElementById('tab-todos');
    const supSelect = document.getElementById('filter-supervisor');
    if (scope === 'mi-equipo') {
        tabMi.className = "px-4 py-1.5 rounded-lg text-xs font-bold transition-all bg-white text-be-darkblue shadow-sm";
        tabTodos.className = "px-4 py-1.5 rounded-lg text-xs font-bold transition-all text-gray-400 hover:text-gray-700";
        if (supSelect) supSelect.classList.add('hidden');
    } else {
        tabTodos.className = "px-4 py-1.5 rounded-lg text-xs font-bold transition-all bg-white text-be-darkblue shadow-sm";
        tabMi.className = "px-4 py-1.5 rounded-lg text-xs font-bold transition-all text-gray-400 hover:text-gray-700";
        if (supSelect) supSelect.classList.remove('hidden');
    }
    searchHojaDeVida();
}

function searchHojaDeVida() {
    const input = document.getElementById('consult-input').value.toLowerCase();
    const listContainer = document.getElementById('consult-list');
    const supFilter = document.getElementById('filter-supervisor') ? document.getElementById('filter-supervisor').value : '';
    if (!listContainer) return;

    let candidates = globalExecutives.filter(ex => ex.estadoDotacion === 'Activo' || ex.isActivo === true);

    if (currentSearchScope === 'mi-equipo') {
        if (window.loggedInJefaturaSups && window.loggedInJefaturaSups.length > 0) {
            candidates = candidates.filter(ex => window.loggedInJefaturaSups.includes(ex.supervisor));
        } else {
            candidates = candidates.filter(ex => ex.supervisor === window.loggedInSupervisorName);
        }
    } else if (supFilter) {
        candidates = candidates.filter(ex => ex.supervisor === supFilter);
    }

    if (input) {
        const normInp = normalizeRut(input);
        candidates = candidates.filter(ex => 
            normalizeName(ex.nombre).includes(normalizeName(input)) || 
            (normInp.length > 0 && normalizeRut(ex.rut).includes(normInp)) ||
            (ex.usuario && ex.usuario.toLowerCase().includes(input))
        );
    }

    listContainer.innerHTML = '';
    candidates.slice(0, 50).forEach(ex => {
        const initials = ex.nombre.split(' ').filter(n => n.length > 0).map(n => n[0]).slice(0, 2).join('').toUpperCase();
        const div = document.createElement('div');
        div.className = "p-4 border-b border-gray-100 hover:bg-white cursor-pointer transition-all group relative";
        div.onclick = () => loadExecutiveProfile(ex);
        div.innerHTML = `
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-gray-200 text-gray-500 group-hover:bg-be-blue group-hover:text-white flex items-center justify-center font-bold text-xs transition-all">${initials}</div>
                <div class="overflow-hidden flex-1">
                    <div class="flex items-center justify-between">
                        <h5 class="text-xs font-bold text-gray-800 truncate capitalize">${ex.nombre.toLowerCase()}</h5>
                    </div>
                    <p class="text-[10px] text-gray-400 font-bold">${ex.rut}</p>
                </div>
            </div>
            <i class="fa-solid fa-chevron-right absolute right-4 top-1/2 -translate-y-1/2 text-gray-200 opacity-0 group-hover:opacity-100 transition-all"></i>
        `;
        listContainer.appendChild(div);
    });
}

function loadExecutiveProfile(rawEx) {
    if (!rawEx) return;
    const ex = ExecutiveStore.getEnrichedEx(rawEx);
    currentViewEx = rawEx;
    currentHojaDeVidaFilters = [];

    document.getElementById('profile-placeholder').classList.add('hidden');
    document.getElementById('profile-content').classList.remove('hidden');

    document.getElementById('prof-name').innerText = ex.nombre;
    document.getElementById('prof-rut').innerText = ex.rut || "SIN RUT"; 
    document.getElementById('prof-area').innerText = ex.area || "N/A";
    document.getElementById('prof-sup').innerText = ex.supervisor;
    document.getElementById('prof-avatar').innerText = ex.nombre.split(' ').filter(n => n.length > 0).map(n => n[0]).slice(0, 2).join('').toUpperCase();

    // Restore "Ver Perfil" button
    let btnVerPerfil = document.getElementById('prof-btn-ver');
    if (!btnVerPerfil) {
        btnVerPerfil = document.createElement('button');
        btnVerPerfil.id = 'prof-btn-ver';
        btnVerPerfil.className = "mt-4 px-4 py-2 bg-slate-100 border border-slate-200 text-be-blue text-[10px] font-black rounded-lg hover:bg-be-blue hover:text-white transition-all uppercase flex items-center gap-2 shadow-sm w-fit";
    }
    btnVerPerfil.innerHTML = `<i class="fa-solid fa-user-gear"></i> Ver Perfil Completo (${ex.usuario || '---'})`;
    btnVerPerfil.onclick = () => openProfileModal(ex);
    document.getElementById('prof-area').parentElement.parentElement.after(btnVerPerfil);

    // Add "Solicitar Baja" button if active
    let btnBaja = document.getElementById('prof-btn-baja');
    if (ex.estadoDotacion === 'Activo') {
        if (!btnBaja) {
            btnBaja = document.createElement('button');
            btnBaja.id = 'prof-btn-baja';
            btnBaja.className = "mt-2 px-4 py-2 bg-rose-50 border border-rose-100 text-rose-500 text-[10px] font-black rounded-lg hover:bg-rose-500 hover:text-white transition-all uppercase flex items-center gap-2 shadow-sm w-fit";
        }
        btnBaja.innerHTML = `<i class="fa-solid fa-user-minus"></i> Solicitar Baja de Dotación`;
        btnBaja.onclick = () => {
            if (typeof openRequestModal === 'function') {
                openRequestModal(ex.rut, ex.nombre);
            } else {
                alert("Módulo de solicitudes no cargado.");
            }
        };
        btnVerPerfil.after(btnBaja);
    } else if (btnBaja) {
        btnBaja.remove();
    }

    // Restore Timeline Filters (Chips)
    const excelErrorsForCount = globalErrorsCollection.filter(err => {
        const isMatch = MatchingUtils.isErrorMatch(ex, err.ejecutivo);
        if (!isMatch) return false;
        return err.agendamientoEstado !== 'EJECUTADO' && err.agendamientoEstado !== 'EJECUTADOCONLLAMADO';
    });

    const manualEvents = ManagementStore.getEventsByRut(ex.rut);
    const counts = { Feedback: 0, Logro: 0, Amonestacion: 0, Ausencia: 0, Compromiso: 0, Error: excelErrorsForCount.length };
    manualEvents.forEach(e => { if (counts[e.tipo] !== undefined) counts[e.tipo]++; });

    const chipDefs = [
        { type: 'Feedback', label: 'Feedbacks', color: 'blue' },
        { type: 'Logro', label: 'Logros', color: 'green' },
        { type: 'Amonestacion', label: 'Amonestaciones', color: 'red' },
        { type: 'Ausencia', label: 'Ausencias', color: 'gray' },
        { type: 'Compromiso', label: 'Compromisos', color: 'orange' },
        { type: 'Error', label: 'Errores', color: 'rose' }
    ];

    let filterBox = document.getElementById('prof-timeline-filters');
    if (!filterBox) {
        filterBox = document.createElement('div');
        filterBox.id = 'prof-timeline-filters';
        filterBox.className = 'flex flex-wrap gap-2 mb-6 mt-6';
        document.getElementById('prof-timeline').before(filterBox);
    }
    
    filterBox.innerHTML = chipDefs.map(c => `
        <div onclick="toggleTimelineFilter('${c.type}')" data-filter-type="${c.type}"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold border border-${c.color}-200 text-${c.color}-600 bg-${c.color}-50 hover:bg-${c.color}-100 transition-all cursor-pointer shadow-sm">
            ${c.label} <span class="inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-white/50 text-[9px]">${counts[c.type]}</span>
        </div>
    `).join('');

    renderTimeline(ex);
}

function toggleTimelineFilter(type) {
    if (currentHojaDeVidaFilters.includes(type)) {
        currentHojaDeVidaFilters = currentHojaDeVidaFilters.filter(t => t !== type);
    } else {
        currentHojaDeVidaFilters.push(type);
    }
    // Update visual state of chips
    document.querySelectorAll('#prof-timeline-filters [data-filter-type]').forEach(btn => {
        const t = btn.getAttribute('data-filter-type');
        const isActive = currentHojaDeVidaFilters.includes(t);
        btn.classList.toggle('bg-be-blue', isActive);
        btn.classList.toggle('text-white', isActive);
        btn.classList.toggle('border-be-blue', isActive);
    });
    if(currentViewEx) renderTimeline(currentViewEx);
}

function renderTimeline(ex) {
    const timeline = document.getElementById('prof-timeline');
    const manualEvents = ManagementStore.getEventsByRut(ex.rut);
    const excelErrors = globalErrorsCollection.filter(err => {
        if (!MatchingUtils.isErrorMatch(ex, err.ejecutivo)) return false;
        return err.agendamientoEstado !== 'EJECUTADO' && err.agendamientoEstado !== 'EJECUTADOCONLLAMADO';
    });

    let allEvents = [];
    manualEvents.forEach(e => allEvents.push({ type: 'manual', category: e.tipo, date: e.timestamp.split('T')[0], title: e.tipo, obs: e.comentario, sup: e.supervisor_registro, raw_date: new Date(e.timestamp) }));
    excelErrors.forEach(e => {
        const isClosed = e.estado === 'realizado';
        allEvents.push({ 
            type: 'excel', category: 'Error', id: e.id, date: e.fecha, title: 'Error de ' + e.categoria, 
            obs: (e.error || '') + (e.observacionSupervisor ? ` | Feedback: ${e.observacionSupervisor}` : ''), 
            sup: isClosed ? `Gestionado por ${e.supervisor}` : 'Pendiente de Gestión', 
            raw_date: new Date(e.fecha), isClosed: isClosed
        });
    });

    let displayEvents = currentHojaDeVidaFilters.length > 0 ? allEvents.filter(ev => currentHojaDeVidaFilters.includes(ev.category)) : allEvents;
    displayEvents.sort((a,b) => (b.raw_date || 0) - (a.raw_date || 0));
    
    timeline.innerHTML = '';
    if (displayEvents.length === 0) {
        timeline.innerHTML = `<div class="bg-gray-50 rounded-xl p-8 text-center border border-dashed border-gray-200 text-gray-400 text-sm">Sin registros para estos filtros.</div>`;
        return;
    }

    const typeStyles = {
        'Feedback': { icon: 'fa-comments', color: 'bg-blue-500', text: 'text-blue-700', bg: 'bg-blue-50' },
        'Logro': { icon: 'fa-trophy', color: 'bg-green-500', text: 'text-green-700', bg: 'bg-green-50' },
        'Amonestacion': { icon: 'fa-triangle-exclamation', color: 'bg-red-500', text: 'text-red-700', bg: 'bg-red-50' },
        'Ausencia': { icon: 'fa-calendar-xmark', color: 'bg-gray-500', text: 'text-gray-700', bg: 'bg-gray-50' },
        'Compromiso': { icon: 'fa-handshake', color: 'bg-orange-500', text: 'text-orange-700', bg: 'bg-orange-50' },
        'Error': { icon: 'fa-circle-exclamation', color: 'bg-rose-500', text: 'text-rose-700', bg: 'bg-rose-50' }
    };

    displayEvents.forEach(ev => {
        const style = typeStyles[ev.category] || { icon: 'fa-circle', color: 'bg-gray-400', text: 'text-gray-600', bg: 'bg-gray-50' };
        const item = document.createElement('div');
        item.className = "relative pl-10 pb-8 group last:pb-0";
        item.innerHTML = `
            <div class="absolute left-[11px] top-0 bottom-0 w-0.5 bg-gray-100 group-last:hidden"></div>
            <div class="absolute left-0 top-0 w-6 h-6 rounded-full ${style.color} border-4 border-white shadow-sm flex items-center justify-center z-10">
                <i class="fa-solid ${style.icon} text-[8px] text-white"></i>
            </div>
            <div class="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all">
                <div class="flex items-center justify-between mb-3">
                    <span class="px-2 py-1 rounded-lg ${style.bg} ${style.text} text-[9px] font-black uppercase tracking-widest">${ev.category}</span>
                    <span class="text-[10px] font-bold text-gray-400 uppercase tracking-tighter"><i class="fa-regular fa-calendar mr-1"></i> ${ev.date}</span>
                </div>
                <h6 class="text-xs font-black text-gray-800 mb-2 uppercase tracking-tight">${ev.title}</h6>
                <p class="text-[11px] text-gray-600 leading-relaxed mb-4 italic">"${ev.obs}"</p>
                <div class="flex items-center justify-between pt-3 border-t border-gray-50">
                    <div class="flex items-center gap-2">
                        <div class="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-[8px] font-bold text-gray-400">${ev.sup.charAt(0)}</div>
                        <span class="text-[9px] font-bold text-gray-400 uppercase">${ev.sup}</span>
                    </div>
                </div>
            </div>
        `;
        timeline.appendChild(item);
    });
}

// Re-use openRequestModal from ejecutivos.js if needed
// This function is usually globally available if ejecutivos.js is loaded, 
// but for gestion.html we might need to define it or ensure it's accessible.
// Since gestion.html might not load ejecutivos.js, we'll define a helper here.

window.openRequestModal = function(rut, nombre) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4';
    modal.innerHTML = `
        <div class="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden border border-white/20 animate-fadeInUp">
            <div class="bg-gradient-to-r from-rose-500 to-rose-700 p-8 text-white relative">
                <h3 class="text-xl font-black uppercase tracking-tight">Solicitud de Baja</h3>
                <p class="text-rose-100 text-[10px] font-bold uppercase tracking-widest mt-1">Ejecutivo: ${nombre}</p>
                <button onclick="this.closest('.fixed').remove()" class="absolute top-6 right-6 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>
            <div class="p-8">
                <form id="request-baja-form" class="space-y-6">
                    <input type="hidden" id="req-rut" value="${rut}">
                    <input type="hidden" id="req-nombre" value="${nombre}">
                    <div>
                        <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Fecha Efectiva de Egreso</label>
                        <input type="date" id="req-fecha" required class="w-full p-4 rounded-xl border-2 border-slate-100 font-bold text-slate-700 bg-slate-50 focus:border-rose-500 focus:outline-none">
                    </div>
                    <div>
                        <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Categoría Propuesta</label>
                        <select id="req-categoria" required class="w-full p-4 rounded-xl border-2 border-slate-100 font-bold text-slate-700 bg-slate-50 focus:border-rose-500 focus:outline-none">
                            <option value="Renuncia/Termino">Renuncia / Término</option>
                            <option value="Fuera Falta Grave">Fuera Falta Grave</option>
                            <option value="Licencia/Apoyo">Licencia / Apoyo Interno</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Justificación / Motivo</label>
                        <textarea id="req-motivo" required placeholder="Explique brevemente el motivo de la solicitud..." class="w-full h-32 p-4 rounded-xl border-2 border-slate-100 font-bold text-slate-700 bg-slate-50 focus:border-rose-500 focus:outline-none resize-none"></textarea>
                    </div>
                    <button type="submit" class="w-full py-4 bg-rose-500 text-white rounded-xl font-black uppercase tracking-widest shadow-xl shadow-rose-500/20 hover:bg-rose-600 transition-all">
                        Enviar Solicitud a Administración
                    </button>
                </form>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('request-baja-form').onsubmit = async (e) => {
        e.preventDefault();
        const data = {
            rut: document.getElementById('req-rut').value,
            nombre: document.getElementById('req-nombre').value,
            supervisor: sessionStorage.getItem('loggedInSupervisorName'),
            fechaEgreso: document.getElementById('req-fecha').value,
            categoriaPropuesta: document.getElementById('req-categoria').value,
            motivo: document.getElementById('req-motivo').value
        };

        try {
            const response = await fetch('api/manage_requests.php?action=create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const res = await response.json();
            if (res.success) {
                alert("Solicitud enviada correctamente.");
                modal.remove();
            }
        } catch (err) {
            alert("Error al enviar la solicitud.");
        }
    };
};
