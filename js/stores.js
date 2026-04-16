/* 
   Gestión Supervisor - Core Data & Logic Store
   Centralizes data persistence and normalization utilities.
*/

// --- Utilidades de Normalización ---
function normalizeRut(rut) {
    if (!rut) return "";
    return rut.toString().toUpperCase().replace(/[^0-9K]/g, "");
}

function normalizeName(name) {
    if (!name) return "";
    return name.toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Quitar acentos
        .replace(/\s+/g, ' ') // Normalizar espacios múltiples
        .trim();
}

function getSortedNameKey(name) {
    return normalizeName(name).split(' ').sort().join(' ');
}

/**
 * Intenta convertir un identificador (RUT o similar) en un nombre de supervisor legible.
 */
function humanizeSupervisor(val) {
    if (!val) return "Supervisor";
    const sessionName = sessionStorage.getItem('loggedInSupervisorName');
    const sessionRut = normalizeRut(sessionStorage.getItem('userRut'));
    
    const cleanVal = normalizeRut(val);
    
    // Si el valor coincide con el RUT del usuario actual, devolvemos su nombre de sesión
    if (sessionRut && cleanVal === sessionRut && sessionName) {
        return sessionName;
    }
    
    // Si ya es un nombre (no tiene números), lo devolvemos tal cual
    if (!/\d/.test(val)) return val;
    
    // Si es un RUT pero no es el nuestro, quitamos el prefijo RUT por estética si existe
    return val.replace(/RUT\s*/i, '').trim() || "Supervisor";
}


// --- LocalStorage Logic ---
const ManagementStore = {
    saveEvent: (event) => {
        const events = JSON.parse(localStorage.getItem('kpi_management_events') || '[]');
        events.push({ ...event, id: 'MAN-' + Date.now(), timestamp: new Date().toISOString() });
        localStorage.setItem('kpi_management_events', JSON.stringify(events));
    },
    getEventsByRut: (rut) => {
        const localEvents = JSON.parse(localStorage.getItem('kpi_management_events') || '[]');
        const rutKey = normalizeRut(rut);
        return localEvents.filter(e => normalizeRut(e.rut) === rutKey);
    }
};

const ExecutiveStore = {
    getEdits: () => JSON.parse(localStorage.getItem('kpi_executive_edits') || '{}'),
    saveEdit: (rut, data) => {
        const edits = ExecutiveStore.getEdits();
        const key = normalizeRut(rut);
        edits[key] = { ...edits[key], ...data };
        localStorage.setItem('kpi_executive_edits', JSON.stringify(edits));
    },
    getEnrichedEx: (ex) => {
        const edits = ExecutiveStore.getEdits();
        const edit = edits[normalizeRut(ex.rut)] || {};
        return {
            ...ex,
            usuario: edit.usuario || ex.usuario || "Sin Usuario",
            fechaNacimiento: edit.fechaNacimiento || ex.fechaNacimiento || "",
            contratoDesde: edit.contratoDesde || ex.contratoDesde || ex.ingreso || "", // Soporte para campo 'ingreso'
            contratoHasta: edit.contratoHasta || ex.contratoHasta || ex.vencimiento || "", 
            tipoContrato: edit.tipoContrato || ex.tipoContrato || ex.tablaL || "Indefinido", // Soporte para 'tablaL'
            jornada: edit.jornada || ex.jornada || ex.horas || "45 Horas",
            modalidad: edit.modalidad || ex.modalidad || "PREZENCIAL",
            vpx: edit.vpx || ex.vpx || "",
            ...edit
        };
    }
};

const ErrorPersistenceStore = {
    save: (id, data) => {
        const key = 'supervisor_errors_persistence';
        const saved = JSON.parse(localStorage.getItem(key) || '{}');
        saved[id] = { ...saved[id], ...data, ts: new Date().toISOString() };
        localStorage.setItem(key, JSON.stringify(saved));
    },
    getSavedData: () => {
        return JSON.parse(localStorage.getItem('supervisor_errors_persistence') || '{}');
    },
    sync: (collection) => {
        if (!collection) return;
        const savedData = ErrorPersistenceStore.getSavedData();
        collection.forEach(err => {
            if (savedData[err.id]) {
                if (savedData[err.id].obs) err.observacionSupervisor = savedData[err.id].obs;
                if (savedData[err.id].st) err.estado = savedData[err.id].st;
                if (savedData[err.id].sup) err.supervisor = savedData[err.id].sup;
                
                // Soporte para formato objeto directo de errors.js
                if (savedData[err.id].observacionSupervisor) err.observacionSupervisor = savedData[err.id].observacionSupervisor;
                if (savedData[err.id].estado) err.estado = savedData[err.id].estado;
            }
        });
    }
};


// --- Utilidades de Emparejamiento Inteligente ---
const MatchingUtils = {
    isErrorMatch: (ex, errVal) => {
        if (!errVal) return false;
        const cleanErr = errVal.trim().toUpperCase();
        
        // 1. Nombre Ordenado (ONP / Genérico)
        const exNameKey = getSortedNameKey(ex.nombre);
        const errNameKey = getSortedNameKey(errVal);
        if (exNameKey === errNameKey) return true;

        // 1.1 Nombre Parcial / Fuzzy (Caso Enzo Bonati)
        // Si coinciden al menos 3 palabras significativas (>2 letras), lo tomamos como match
        const wordsEx = exNameKey.split(' ').filter(w => w.length > 2);
        const wordsErr = errNameKey.split(' ').filter(w => w.length > 2);
        const intersection = wordsEx.filter(w => wordsErr.includes(w));
        if (intersection.length >= 3) return true;
        
        // 2. Usuario (Ley de Fraude / Desbloqueos APP / Genérico)
        if (ex.usuario && ex.usuario.trim().toUpperCase() === cleanErr) return true;
        
        // 3. RUT Completo
        const normExRut = normalizeRut(ex.rut);
        const normErrVal = normalizeRut(errVal);
        if (normExRut && normErrVal && normExRut === normErrVal) return true;
        
        // 4. RUT sin DV (Agendamientos)
        if (normExRut && normExRut.length > 1) {
            const rutNoDV = normExRut.slice(0, -1);
            const digitsOnlyErr = cleanErr.replace(/[^0-9]/g, '');
            if (digitsOnlyErr.length >= 7 && rutNoDV === digitsOnlyErr) return true;
        }
        
        return false;
    }
};


// --- Helper para Fechas Excel ---
function parseExcelDate(dateStr) {
    if (!dateStr) return new Date();
    const months = {
        'ene': 0, 'feb': 1, 'mar': 2, 'abr': 3, 'may': 4, 'jun': 5,
        'jul': 6, 'ago': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dic': 11
    };
    const parts = dateStr.toLowerCase().split(' ');
    if (parts.length === 3) {
        const day = parseInt(parts[0]);
        const month = months[parts[1].substring(0, 3)] || 0;
        const year = parseInt(parts[2]);
        return new Date(year, month, day);
    }
    return new Date(dateStr);
}

// --- STORE: GESTIÓN DE IMPORTACIONES EXCEL (CONTINGENCIA) ---
const DataImportStore = {
    save: (type, data) => {
        const imports = JSON.parse(localStorage.getItem('manual_imports') || '{}');
        const count = Array.isArray(data) ? data.length : (data.count || 0);
        imports[type] = {
            data: data,
            timestamp: new Date().toISOString(),
            count: count
        };
        localStorage.setItem('manual_imports', JSON.stringify(imports));
        window.dispatchEvent(new CustomEvent('data_imported', { detail: { type, count: count } }));
    },
    get: (type) => {
        const imports = JSON.parse(localStorage.getItem('manual_imports') || '{}');
        return imports[type] ? imports[type].data : null;
    },
    getAll: () => JSON.parse(localStorage.getItem('manual_imports') || '{}'),
    clear: (type) => {
        const imports = JSON.parse(localStorage.getItem('manual_imports') || '{}');
        delete imports[type];
        localStorage.setItem('manual_imports', JSON.stringify(imports));
    }
};


// --- DATA INTEGRATOR: Mezcla Datos Estáticos con Importaciones Manuales ---
const DataIntegrator = {
    getExecutives: () => {
        const manual = DataImportStore.get('dotacion');
        let base = manual ? manual : (typeof globalExecutives !== 'undefined' ? globalExecutives : []);

        // AUTO-DESCUBRIMIENTO DE EJECUTIVOS (Para Ejecutivos nuevos en los Excels de Errores)
        const errors = DataImportStore.get('errores') || [];
        if (errors.length > 0) {
            const baseKeys = new Set(base.map(e => e.nombre ? e.nombre.trim().toUpperCase() : ''));
            const extraExecs = [];

            errors.forEach(err => {
                if (err.ejecutivo && err.supervisor) {
                    const execName = err.ejecutivo.trim().toUpperCase();
                    if (execName && !baseKeys.has(execName)) {
                        baseKeys.add(execName);
                        extraExecs.push({
                            id: 'ghost-' + Date.now() + Math.random(),
                            nombre: err.ejecutivo,
                            rut: err.rut || err.rutCdv || '',
                            supervisor: err.supervisor,
                            estadoDotacion: 'Activo', // Generarlo como Vigente
                            isActivo: true,
                            fechaIngreso: err.fecha || new Date().toISOString(),
                            _isGhost: true
                        });
                    }
                }
            });
            if (extraExecs.length > 0) base = [...base, ...extraExecs];
        }

        return base;
    },
    getErrors: () => {
        const manual = DataImportStore.get('errores') || [];
        const base = (typeof globalErrorsCollection !== 'undefined') ? globalErrorsCollection : [];

        // Fusión: Priorizamos los manuales pero mantenemos la base (Eliminando duplicados por ID)
        const combined = [...manual];
        const manualIds = new Set(manual.map(m => m.id));

        base.forEach(b => {
            if (!manualIds.has(b.id)) combined.push(b);
        });

        return combined;
    },
    // Cargar agendamientos desde la BD (tbl_agendamientos) y convertirlos al formato de errores
    loadAgendamientosFromDB: async (supervisor = null) => {
        try {
            const params = {};
            if (supervisor) params.supervisor = supervisor;

            const agendamientos = await ApiService.getAgendamientos(params);

            // Convertir agendamientos al formato de globalErrorsCollection
            const erroresFromAgendamientos = agendamientos.map(ag => ({
                id: 'DB-AG-' + ag.id,
                id_agendamiento: ag.id_agendamiento,
                fecha: ag.fecha_agendamiento,
                ejecutivo: ag.nombre_ejecutivo || ag.usuario_crea || '',
                rutCdv: ag.rut_cliente,
                rut_cliente: ag.rut_cliente,
                nombre_cliente: ag.nombre_contacto,
                servicio: ag.servicio,
                tipo: ag.tipo,
                categoria: 'Agendamientos',
                estado: ag.estado === 'RECHAZADO' ? 'pendiente' : 'realizado',
                agendamientoEstado: ag.estado,
                observaciones: ag.observaciones,
                comentario_callback: ag.comentario_callback,
                supervisor: ag.supervisor_resuelto || '',
                timestamp_creacion: ag.timestamp_creacion,
                _source: 'tbl_agendamientos'
            }));

            return erroresFromAgendamientos;
        } catch (err) {
            console.error('[DataIntegrator] loadAgendamientosFromDB:', err);
            return [];
        }
    }
};

// --- CROSS-TAB SYNC (Para actualización INMEDIATA entre pestañas) ---
window.addEventListener('storage', (e) => {
    // Si la importación manual cambia en OTRA pestaña (ej. el admin cargó un Excel en import.html)
    if (e.key === 'manual_imports') {
        // Recargas la base de datos local en RAM para esta pestaña
        if (typeof DataIntegrator !== 'undefined' && typeof window.globalErrorsCollection !== 'undefined') {
            window.globalErrorsCollection = DataIntegrator.getErrors();
        }
        
        // Refrescar vistas pertinentes en tiempo real
        if (typeof renderErroresUI === 'function') {
            // Actualización para el Supervisor (index.html)
            if (typeof getMyErrors === 'function') {
                window.filteredErrors = getMyErrors();
            }
            renderErroresUI();
        }
        
        if (typeof initAdmin === 'function') {
            // Actualización para el Admin (admin.html)
            initAdmin();
        }
    }
});

// --- Exit Requests & Notifications ---
const RequestStore = {
    getAll: () => JSON.parse(localStorage.getItem('kpi_exit_requests') || '[]'),
    
    add: (req) => {
        const reqs = RequestStore.getAll();
        const newReq = { 
            id: 'REQ-' + Date.now(), 
            timestamp: new Date().toISOString(),
            status: 'PENDIENTE',
            vistoAdmin: false,
            vistoSupervisor: false,
            ...req 
        };
        reqs.push(newReq);
        localStorage.setItem('kpi_exit_requests', JSON.stringify(reqs));
        
        NotificationStore.add({
            type: 'NEW_REQUEST',
            title: 'Nueva Solicitud de Eliminación',
            message: `${req.supervisor} solicita la eliminación de su dotación de ${req.nombre}`,
            target: 'ADMIN',
            refId: newReq.id
        });
        return newReq;
    },

    update: (id, data) => {
        const reqs = RequestStore.getAll();
        const idx = reqs.findIndex(r => r.id === id);
        if (idx === -1) return;
        
        const oldStatus = reqs[idx].status;
        reqs[idx] = { ...reqs[idx], ...data };
        localStorage.setItem('kpi_exit_requests', JSON.stringify(reqs));
        
        // Notificar al supervisor si hubo cambio de estado final
        if (data.status && data.status !== oldStatus && (data.status === 'APROBADA' || data.status === 'RECHAZADA' || data.status === 'REINCORPORADA')) {
            NotificationStore.add({
                type: 'REQUEST_STATUS',
                title: data.status === 'REINCORPORADA' ? 'Ejecutivo Reincorporado' : `Solicitud ${data.status}`,
                message: data.status === 'REINCORPORADA' 
                    ? `El ejecutivo ${reqs[idx].nombre} ha sido reincorporado a tu dotación.`
                    : `La solicitud para ${reqs[idx].nombre} ha sido ${data.status.toLowerCase()}`,
                target: reqs[idx].supervisor,
                refId: id
            });

            // Impacto en ExecutiveStore
            if (data.status === 'APROBADA') {
                ExecutiveStore.saveEdit(reqs[idx].rut, {
                    isActivo: false,
                    estadoDotacion: data.categoriaFinal || reqs[idx].categoriaPropuesta || 'Inactivo',
                    fechaDesvinculacion: reqs[idx].fechaEgreso || new Date().toISOString().split('T')[0]
                });
            } else if (data.status === 'REINCORPORADA') {
                ExecutiveStore.saveEdit(reqs[idx].rut, {
                    isActivo: true,
                    estadoDotacion: 'Activo',
                    fechaDesvinculacion: null,
                    motivoReincorporacion: data.motivoReincorporacion // Log extra
                });
            }
        }
    },

    getPendingBySupervisor: (username) => {
        return RequestStore.getAll().filter(r => r.supervisor === username && r.status === 'PENDIENTE');
    }
};

const NotificationStore = {
    getAll: () => JSON.parse(localStorage.getItem('kpi_notifications') || '[]'),
    
    add: (notif) => {
        const list = NotificationStore.getAll();
        list.push({ 
            ...notif, 
            id: 'NOT-' + Date.now(), 
            seen: false, 
            timestamp: new Date().toISOString() 
        });
        localStorage.setItem('kpi_notifications', JSON.stringify(list));
        window.dispatchEvent(new Event('notifications_updated'));
    },

    getByUser: (username) => {
        const isAdmin = username && (username.includes("Administrador") || username.toUpperCase() === "ADMIN");
        const list = NotificationStore.getAll();
        return list.filter(n => {
            if (isAdmin) return n.target === 'ADMIN';
            return n.target === username;
        }).sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));
    },

    getUnseenCount: (username) => {
        return NotificationStore.getByUser(username).filter(n => !n.seen).length;
    },

    markAllAsSeen: (username) => {
        const isAdmin = username && (username.includes("Administrador") || username.toUpperCase() === "ADMIN");
        const list = NotificationStore.getAll();
        list.forEach(n => {
            if (isAdmin && n.target === 'ADMIN') n.seen = true;
            if (!isAdmin && n.target === username) n.seen = true;
        });
        localStorage.setItem('kpi_notifications', JSON.stringify(list));
        window.dispatchEvent(new Event('notifications_updated'));
    }
};

// --- GLOBAL EXPORTS ---
window.DataImportStore = DataImportStore;
window.RequestStore = RequestStore;
window.NotificationStore = NotificationStore;
window.ExecutiveStore = ExecutiveStore;
window.DataIntegrator = DataIntegrator;
