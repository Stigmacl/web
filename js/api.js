// js/api.js — helper fetch compartido por todas las páginas.
async function apiRequest(path, { method = 'GET', body } = {}) {
    const opts = {
        method,
        credentials: 'same-origin',
        headers: {},
    };
    if (body !== undefined) {
        opts.headers['Content-Type'] = 'application/json';
        opts.body = JSON.stringify(body);
    }
    const res = await fetch(path, opts);
    let data;
    try {
        data = await res.json();
    } catch (e) {
        data = { status: 'error', message: 'Respuesta inválida del servidor.' };
    }
    if (!res.ok) {
        const err = new Error(data.message || `Error ${res.status}`);
        err.status = res.status;
        err.data = data;
        throw err;
    }
    return data;
}

const Api = {
    estadoSesion: () => apiRequest('api/auth.php?action=status'),
    login: (password) => apiRequest('api/auth.php?action=login', { method: 'POST', body: { password } }),
    logout: () => apiRequest('api/auth.php?action=logout', { method: 'POST' }),

    listarPremios: () => apiRequest('api/premios.php'),
    crearPremio: (premio) => apiRequest('api/premios.php', { method: 'POST', body: premio }),
    actualizarPremio: (premio) => apiRequest('api/premios.php', { method: 'PUT', body: premio }),
    eliminarPremio: (id) => apiRequest(`api/premios.php?id=${encodeURIComponent(id)}`, { method: 'DELETE' }),

    obtenerEvento: () => apiRequest('api/evento.php'),
    guardarEvento: (evento) => apiRequest('api/evento.php', { method: 'POST', body: evento }),

    girar: () => apiRequest('api/spin.php', { method: 'POST' }),
    historial: () => apiRequest('api/historial.php'),
};
