/**
 * Gestión Supervisor - API Bridge (XAMPP/MySQL → Futuro Azure)
 * Centraliza todas las llamadas al backend PHP. Cuando migre a Azure,
 * solo cambia BASE_URL y los nombres de endpoints.
 */

// --- Apunta al backend actual (XAMPP local) ---
// En Azure: cambiar por 'https://tu-app.azurewebsites.net/api'
const BASE_URL = 'api';

const ApiService = {

    // -------------------------------------------------------
    // DOTACIÓN / EJECUTIVOS
    // -------------------------------------------------------
    async getExecutives() {
        try {
            const resp = await fetch(`${BASE_URL}/get_executives.php`);
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            const json = await resp.json();
            if (json.status === 'success') {
                window.allSupervisors = Array.isArray(json.supervisors) ? json.supervisors : [];
                window.globalJefaturaMap = json.jefaturas || {};
                return json.data || [];
            }
            return [];
        } catch (err) {
            console.error('[ApiService] getExecutives:', err);
            window.allSupervisors = window.allSupervisors || [];
            window.globalJefaturaMap = window.globalJefaturaMap || {};
            return [];
        }
    },

    // -------------------------------------------------------
    // ERRORES DE INGESTA
    // -------------------------------------------------------
    async getErrors() {
        try {
            // Cambiado a get_errors_unified.php para incluir Desbloqueos APP
            const resp = await fetch(`${BASE_URL}/get_errors_unified.php`);
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            const json = await resp.json();
            return json.status === 'success' ? json.data : [];
        } catch (err) {
            console.error('[ApiService] getErrors:', err);
            return [];
        }
    },

    // -------------------------------------------------------
    // AGENDAMIENTOS (Desde tbl_agendamientos)
    // -------------------------------------------------------
    async getAgendamientos(params = {}) {
        try {
            const queryParams = new URLSearchParams();
            if (params.action) queryParams.append('action', params.action);
            if (params.supervisor) queryParams.append('supervisor', params.supervisor);
            if (params.rut) queryParams.append('rut', params.rut);
            if (params.fecha_desde) queryParams.append('fecha_desde', params.fecha_desde);
            if (params.fecha_hasta) queryParams.append('fecha_hasta', params.fecha_hasta);

            const url = `${BASE_URL}/get_agendamientos.php${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
            const resp = await fetch(url);
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            const json = await resp.json();
            return Array.isArray(json) ? json : (json.data || []);
        } catch (err) {
            console.error('[ApiService] getAgendamientos:', err);
            return [];
        }
    },

    // -------------------------------------------------------
    // USUARIOS LOGIN
    // -------------------------------------------------------
    async getLoginUsers() {
        try {
            const resp = await fetch(`${BASE_URL}/get_login_users.php`);
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            return await resp.json();
        } catch (err) {
            console.error('[ApiService] getLoginUsers:', err);
            return { status: 'error', supervisors: [], admins: [] };
        }
    },

    // -------------------------------------------------------
    // GUARDAR GESTIÓN DEL SUPERVISOR
    // -------------------------------------------------------
    async saveGestion({ id_reporte, autor, nota, estado }) {
        try {
            const resp = await fetch(`${BASE_URL}/save_gestion.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id_reporte, autor, nota, estado })
            });
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            return await resp.json();
        } catch (err) {
            console.error('[ApiService] saveGestion:', err);
            return { status: 'error', message: err.message };
        }
    },

    // -------------------------------------------------------
    // SUBIR DATOS DE EXCEL (Dotación o Errores)
    // -------------------------------------------------------
    async uploadExcelData(type, data) {
        try {
            const resp = await fetch(`${BASE_URL}/upload_excel_data.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type, data })
            });
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            return await resp.json();
        } catch (err) {
            console.error('[ApiService] uploadExcelData:', err);
            return { status: 'error', message: err.message };
        }
    }
};

/**
 * SISTEMA DE CACHÉ CON LOCALSTORAGE
 * Almacena datos en caché cliente para evitar llamadas repetidas a la BD
 * TTL por defecto: 30 minutos
 */
const CACHE_CONFIG = {
    EXECUTIVES_KEY: 'app_cache_executives',
    ERRORS_KEY: 'app_cache_errors',
    AGENDAMIENTOS_KEY: 'app_cache_agendamientos',
    TTL_MINUTES: 30,  // Tiempo de vida del caché en minutos
    TIMESTAMP_SUFFIX: '_timestamp'
};

const CacheService = {
    /**
     * Guarda datos en localStorage con timestamp
     */
    set(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            localStorage.setItem(key + CACHE_CONFIG.TIMESTAMP_SUFFIX, Date.now().toString());
        } catch (err) {
            console.warn('[CacheService] Error guardando en caché:', err);
        }
    },

    /**
     * Obtiene datos del caché si existen y no han expirado
     * @returns {Object|null} Datos en caché o null si no existen / expirados
     */
    get(key) {
        try {
            const data = localStorage.getItem(key);
            const timestamp = localStorage.getItem(key + CACHE_CONFIG.TIMESTAMP_SUFFIX);

            if (!data || !timestamp) return null;

            // Verificar si el caché ha expirado
            const ageMinutes = (Date.now() - parseInt(timestamp)) / 1000 / 60;
            const isExpired = ageMinutes > CACHE_CONFIG.TTL_MINUTES;

            if (isExpired) {
                console.log(`[CacheService] Caché para "${key}" expirado (${ageMinutes.toFixed(0)} minutos)`);
                this.remove(key);
                return null;
            }

            return JSON.parse(data);
        } catch (err) {
            console.warn('[CacheService] Error leyendo caché:', err);
            return null;
        }
    },

    /**
     * Elimina datos del caché
     */
    remove(key) {
        try {
            localStorage.removeItem(key);
            localStorage.removeItem(key + CACHE_CONFIG.TIMESTAMP_SUFFIX);
        } catch (err) {
            console.warn('[CacheService] Error limpiando caché:', err);
        }
    },

    /**
     * Limpia TODO el caché de la aplicación
     */
    clearAll() {
        try {
            this.remove(CACHE_CONFIG.EXECUTIVES_KEY);
            this.remove(CACHE_CONFIG.ERRORS_KEY);
            this.remove(CACHE_CONFIG.AGENDAMIENTOS_KEY);
            console.log('[CacheService] Caché completamente limpiado');
        } catch (err) {
            console.warn('[CacheService] Error limpiando caché completo:', err);
        }
    }
};

window.ApiService = ApiService;
window.CacheService = CacheService;
