/**
 * db-init.js — Bootstrap de Datos desde MySQL (CORREGIDO PARA AGENDAMIENTOS)
 * Se mantiene toda tu lógica original. Solo se mejoró la carga de agendamientos.
 */

window.globalExecutives         = [];
window.globalErrorsCollection   = [];
window.globalAgendamientos      = [];  
window.globalJefaturaMap        = window.globalJefaturaMap || {};
window.allSupervisors           = window.allSupervisors || [];
window.loggedInSupervisorName   = sessionStorage.getItem('loggedInSupervisorName') || null;

/* === Tus funciones originales (sin cambios) === */
function _showLoadingOverlay(msg) {
    let el = document.getElementById('db-loading-overlay');
    if (!el) {
        el = document.createElement('div');
        el.id = 'db-loading-overlay';
        el.style.cssText = `position:fixed;inset:0;z-index:9999;background:rgba(0,45,86,0.75);backdrop-filter:blur(6px);display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;font-family:Inter,sans-serif;gap:16px;transition:opacity 0.4s;`;
        el.innerHTML = `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#F37021" stroke-width="2.5" stroke-linecap="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg><p id="db-loading-msg" style="font-size:13px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;"></p>`;
        document.body.appendChild(el);
        el.querySelector('svg').style.animation = 'spin 1s linear infinite';
        if (!document.getElementById('db-spin-style')) {
            const s = document.createElement('style');
            s.id = 'db-spin-style';
            s.textContent = '@keyframes spin{to{transform:rotate(360deg)}}';
            document.head.appendChild(s);
        }
    }
    document.getElementById('db-loading-msg').textContent = msg || 'Cargando datos…';
}

function _hideLoadingOverlay() {
    const el = document.getElementById('db-loading-overlay');
    if (el) {
        el.style.opacity = '0';
        setTimeout(() => el.remove(), 400);
    }
}

function _convertAgendamientosToErrors(data) {
    return data.map((ag, i) => {

        const estado = (ag.estado || '').toUpperCase();

        return {
            id: 'DB-AG-' + (ag.id || i),
            id_agendamiento: ag.id_agendamiento || ag.id || i,

            fecha: ag.fecha_agendamiento || ag.fecha || '',
            timestamp_creacion: ag.timestamp_creacion || '',

            ejecutivo:
                ag.nombre_ejecutivo ||
                ag.ejecutivo ||
                ag.usuario_crea ||
                'Sin Ejecutivo',

            cliente:
                ag.nombre_contacto ||
                ag.cliente ||
                ag.nombre_cliente ||
                'Sin Cliente',

            rut: ag.rut_cliente || ag.rut || '',

            error:
                ag.observaciones ||
                ag.comentario_callback ||
                'Agendamiento rechazado',

            tipo: ag.tipo || '',
            servicio: ag.servicio || '',

            categoria: 'Agendamientos',

            estado: 'pendiente',
            agendamientoEstado: estado,

            supervisor:
                ag.supervisor ||
                ag.nombre_supervisor ||
                '',

            observaciones: ag.observaciones || '',
            comentario_callback: ag.comentario_callback || '',

            _source: 'tbl_agendamientos'
        };
    });
}

function _tryGetFromCache() {
    if (typeof CacheService === 'undefined') return null;
    
    const executives = CacheService.get(CACHE_CONFIG.EXECUTIVES_KEY);
    const errors = CacheService.get(CACHE_CONFIG.ERRORS_KEY);
    const agendamientos = CacheService.get(CACHE_CONFIG.AGENDAMIENTOS_KEY);

    if (executives && errors !== null && agendamientos !== null) {
        console.log('[db-init] ✅ Usando datos en caché local');
        return { executives, errors, agendamientos, fromCache: true };
    }
    return null;
}

/* === FUNCIÓN PRINCIPAL CORREGIDA === */
async function initDatabaseData() {
    if (typeof ApiService === 'undefined') {
        console.warn('[db-init] ApiService no encontrado.');
        window.dispatchEvent(new CustomEvent('db_ready', { detail: { source: 'empty' } }));
        return;
    }

    const supervisor = window.loggedInSupervisorName || 
                       sessionStorage.getItem('loggedInSupervisorName') ||
                       localStorage.getItem('currentSupervisor');

    console.log(`[db-init] 👤 Supervisor detectado: ${supervisor || 'NO DETECTADO'}`);

    const cachedData = _tryGetFromCache();
    if (cachedData) {
        _showLoadingOverlay('Cargando desde caché local…');
        setTimeout(() => _useLoadedData(cachedData.executives, cachedData.errors, cachedData.agendamientos, 'cache'), 100);
        return;
    }

    _showLoadingOverlay('Conectando con la base de datos…');

    try {
        // Cargar ejecutivos y errores como antes
        const [executives, errors] = await Promise.all([
            ApiService.getExecutives(),
            ApiService.getErrors()
        ]);

        // === CARGA REAL DE AGENDAMIENTOS (nuevo) ===
        let agendamientos = [];
        if (supervisor) {
            console.log('[db-init] 📡 Consultando agendamientos reales para supervisor...');
            const res = await fetch(`api/manage_requests_v2.php?action=get_all_errors&all=1&supervisor=${encodeURIComponent(supervisor)}&estado=PENDIENTE`);
            if (res.ok) {
                agendamientos = await res.json();
            }
        }

        console.log(`[db-init] 📅 ${agendamientos.length} agendamientos cargados desde BD`);

        // Guardar en caché
        if (typeof CacheService !== 'undefined') {
            CacheService.set(CACHE_CONFIG.EXECUTIVES_KEY, executives);
            CacheService.set(CACHE_CONFIG.ERRORS_KEY, errors);
            CacheService.set(CACHE_CONFIG.AGENDAMIENTOS_KEY, agendamientos);
        }

        _useLoadedData(executives, errors, agendamientos, 'mysql');

    } catch (err) {
        console.error('[db-init] Error cargando datos:', err);
        _hideLoadingOverlay();
        window.dispatchEvent(new CustomEvent('db_ready', { detail: { source: 'error', error: err.message } }));
    }
}

function _useLoadedData(executives, errors, agendamientos, source) {
    window.globalExecutives       = executives  || [];
    window.globalErrorsCollection = errors      || [];
    window.globalAgendamientos    = agendamientos || [];

    if (agendamientos && agendamientos.length > 0) {
        const erroresFromAgendamientos = _convertAgendamientosToErrors(agendamientos);
        const existingIds = new Set(window.globalErrorsCollection.map(e => e.id_agendamiento || e.id));
        const newFromDB = erroresFromAgendamientos.filter(e => !existingIds.has(e.id_agendamiento));

        window.globalErrorsCollection = [...window.globalErrorsCollection, ...newFromDB];
        console.log(`[db-init] 📅 ${agendamientos.length} agendamientos integrados`);
    }

    console.log(`[db-init] ✅ ${window.globalExecutives.length} ejecutivos | ${window.globalErrorsCollection.length} errores cargados desde ${source}`);

    if (typeof ErrorPersistenceStore !== 'undefined') {
        ErrorPersistenceStore.sync(window.globalErrorsCollection);
    }

    _hideLoadingOverlay();

    window.dispatchEvent(new CustomEvent('db_ready', {
        detail: {
            source: source,
            executivesCount: window.globalExecutives.length,
            errorsCount: window.globalErrorsCollection.length,
            agendamientosCount: window.globalAgendamientos.length
        }
    }));
}

function syncDatabaseData() {
    if (typeof CacheService !== 'undefined') {
        CacheService.clearAll();
        console.log('[db-init] Caché limpiado, recargando...');
    }
    window.location.reload();
}

window.syncDatabaseData = syncDatabaseData;
document.addEventListener('DOMContentLoaded', initDatabaseData);