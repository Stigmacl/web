/**
 * db-init.js — Bootstrap de Datos desde MySQL
 * ENFOCADO SOLO EN ERRORES / AGENDAMIENTOS
 * Versión limpia y funcional
 */

window.globalExecutives = [];
window.globalErrorsCollection = [];
window.globalAgendamientos = [];
window.globalJefaturaMap = {};
window.allSupervisors = [];

// Supervisor logueado
window.loggedInSupervisorName =
    sessionStorage.getItem('loggedInSupervisorName') ||
    localStorage.getItem('currentSupervisor') ||
    null;

/* =========================
   Overlay de carga
========================= */
function _showLoadingOverlay(msg) {
    let el = document.getElementById('db-loading-overlay');
    if (!el) {
        el = document.createElement('div');
        el.id = 'db-loading-overlay';
        el.style.cssText = `
            position:fixed; inset:0; z-index:9999;
            background:rgba(0,45,86,0.75);
            backdrop-filter:blur(6px);
            display:flex; flex-direction:column;
            align-items:center; justify-content:center;
            color:#fff; font-family:Inter,sans-serif;
            gap:16px;
        `;
        el.innerHTML = `
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="white" stroke-width="3" stroke-linecap="round"
                    stroke-dasharray="31.4" stroke-dashoffset="10"/>
            </svg>
            <div id="db-loading-msg"></div>
        `;
        document.body.appendChild(el);
        el.querySelector('svg').style.animation = 'spin 1s linear infinite';

        const s = document.createElement('style');
        s.textContent = '@keyframes spin{to{transform:rotate(360deg)}}';
        document.head.appendChild(s);
    }
    document.getElementById('db-loading-msg').textContent = msg || 'Cargando datos…';
}

function _hideLoadingOverlay() {
    const el = document.getElementById('db-loading-overlay');
    if (el) el.remove();
}

/* =========================
   Convertir agendamientos a errores
========================= */
function _convertAgendamientosToErrors(data) {
    return data.map(ag => ({
        id: 'AG-' + (ag.id || ag.id_agendamiento),
        id_agendamiento: ag.id_agendamiento || ag.id,
        fecha: ag.fecha_agendamiento || ag.fecha,
        timestamp_creacion: ag.timestamp_creacion || '',
        ejecutivo: ag.nombre_ejecutivo || ag.ejecutivo || 'SIN EJECUTIVO',
        cliente: ag.nombre_contacto || ag.cliente || 'SIN CLIENTE',
        rut: ag.rut_cliente || ag.rut || '',
        error: ag.comentario_callback || ag.error || 'Agendamiento rechazado',
        observaciones_fusion: ag.observaciones || '',
        tipo: ag.tipo || ag.tramite || 'AGENDAMIENTO',
        categoria: 'Agendamientos',
        estado: 'pendiente',
        agendamientoEstado: ag.estado || ag.agendamientoEstado,
        supervisor: ag.supervisor_resuelto || ag.supervisor,
        _source: 'tbl_agendamientos'
    }));
}

/* =========================
   Cache (NO usar cache vacío)
========================= */
function _tryGetFromCache() {
    if (typeof CacheService === 'undefined') return null;

    const executives = CacheService.get(CACHE_CONFIG.EXECUTIVES_KEY);
    const errors = CacheService.get(CACHE_CONFIG.ERRORS_KEY);
    const agendamientos = CacheService.get(CACHE_CONFIG.AGENDAMIENTOS_KEY);

    if (
        executives &&
        Array.isArray(errors) && errors.length > 0
    ) {
        console.log('[db-init] ✅ Usando datos en caché local');
        return { executives, errors, agendamientos, fromCache: true };
    }

    return null;
}

/* =========================
   Inicialización principal
========================= */
async function initDatabaseData() {

    if (typeof ApiService === 'undefined') {
        console.warn('[db-init] ApiService no encontrado');
        window.dispatchEvent(new Event('db_ready'));
        return;
    }

    const supervisor = window.loggedInSupervisorName;
    const userRole = sessionStorage.getItem('userRole');
    const isAdmin = userRole === 'admin';

    console.log(`[db-init] 👤 Usuario: ${supervisor || 'NO DETECTADO'} | Rol: ${userRole}`);

    const cachedData = _tryGetFromCache();
    if (cachedData) {
        _useLoadedData(
            cachedData.executives,
            cachedData.errors,
            cachedData.agendamientos || [],
            'cache'
        );
        return;
    }

    _showLoadingOverlay('Conectando con la base de datos…');

    try {
        // Ejecutivos y errores base
        const [executives, errors] = await Promise.all([
            ApiService.getExecutives(),
            ApiService.getErrors()
        ]);

        // Agendamientos REALES desde BD
        let agendamientos = [];

        // Si es admin, traemos TODO. Si es supervisor, solo lo suyo.
        let url = '';
        if (isAdmin) {
            console.log('[db-init] 📡 Admin detectado: Cargando todos los agendamientos...');
            url = `api/get_agendamientos.php?action=pendientes`;
        } else if (supervisor) {
            console.log('[db-init] 📡 Supervisor detectado: Cargando agendamientos del equipo...');
            url = `api/get_agendamientos.php?action=pendientes&supervisor=${encodeURIComponent(supervisor)}`;
        }

        if (url) {
            const res = await fetch(url);
            if (res.ok) {
                agendamientos = await res.json();
            }
        }

        if (typeof CacheService !== 'undefined') {
            CacheService.set(CACHE_CONFIG.EXECUTIVES_KEY, executives);
            CacheService.set(CACHE_CONFIG.ERRORS_KEY, errors);
            CacheService.set(CACHE_CONFIG.AGENDAMIENTOS_KEY, agendamientos);
        }

        _useLoadedData(executives, errors, agendamientos, 'mysql');

    } catch (err) {
        console.error('[db-init] Error cargando datos:', err);
        _hideLoadingOverlay();
    }
}

/* =========================
   Unificación final
========================= */
function _useLoadedData(executives, errors, agendamientos, source) {

    window.globalExecutives = executives || [];
    window.globalErrorsCollection = errors || [];
    window.globalAgendamientos = agendamientos || [];

    if (agendamientos.length > 0) {
        const fromAg = _convertAgendamientosToErrors(agendamientos);
        const existingIds = new Set(window.globalErrorsCollection.map(e => e.id_agendamiento || e.id));
        const nuevos = fromAg.filter(e => !existingIds.has(e.id_agendamiento));
        window.globalErrorsCollection = [...window.globalErrorsCollection, ...nuevos];
    }

    console.log(
        `[db-init] ✅ ${window.globalExecutives.length} ejecutivos | ` +
        `${window.globalErrorsCollection.length} errores cargados desde ${source}`
    );

    if (typeof ErrorPersistenceStore !== 'undefined') {
        ErrorPersistenceStore.sync(window.globalErrorsCollection);
    }

    _hideLoadingOverlay();
    window.dispatchEvent(new Event('db_ready'));
}

/* =========================
   Forzar recarga
========================= */
function syncDatabaseData() {
    if (typeof CacheService !== 'undefined') {
        CacheService.clearAll();
        console.log('[db-init] 🔄 Caché limpiado');
    }
    window.location.reload();
}

window.syncDatabaseData = syncDatabaseData;

// Arranque
document.addEventListener('DOMContentLoaded', initDatabaseData);
