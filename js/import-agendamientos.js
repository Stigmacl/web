/**
 * import-agendamientos.js
 * Maneja la importación de agendamientos desde Excel
 * - Drag & drop
 * - Lectura local con SheetJS
 * - Envío a backend PHP
 * - Integración automática en BD
 */

document.addEventListener('DOMContentLoaded', () => {
    setupAgendamientosDropZone();
    setupAgendamientosFileInput();
});

function setupAgendamientosDropZone() {
    const dropZone = document.getElementById('drop-agendamientos');
    if (!dropZone) return;

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
            dropZone.classList.add('border-emerald-500', 'bg-emerald-50/50');
        });
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
            dropZone.classList.remove('border-emerald-500', 'bg-emerald-50/50');
        });
    });

    dropZone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleAgendamientosFiles(files);
    });
}

function setupAgendamientosFileInput() {
    const fileInput = document.getElementById('file-agendamientos');
    if (!fileInput) return;
    fileInput.addEventListener('change', (e) => {
        handleAgendamientosFiles(e.target.files);
    });
}

async function handleAgendamientosFiles(files) {
    if (!files || files.length === 0) return;

    const file = files[0];
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
        alert('Por favor selecciona un archivo Excel (.xlsx o .xls)');
        return;
    }

    showLoadingOverlay();

    try {
        // Leer archivo con SheetJS
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(worksheet);

        if (!data || data.length === 0) {
            hideLoadingOverlay();
            showResultModal('error', 'Archivo vacío', 'El archivo no contiene datos para procesar.');
            return;
        }

        // Enviar al backend
        const formData = new FormData();
        formData.append('file', file);

        const endpoint = window.AGENDAMIENTOS_API || 'api/import_agendamientos_v2.php';
        const response = await fetch(endpoint, {
            method: 'POST',
            body: formData
        });

        const result = await response.json();
        hideLoadingOverlay();

        if (result.success) {
            // Mostrar resultado exitoso
            showResultModal('success', 'Importación Exitosa', `
                <p class="text-slate-600"><strong>Registros procesados:</strong> ${result.registros_procesados}</p>
                <p class="text-slate-600"><strong>Registros insertados:</strong> ${result.registros_insertados}</p>
                ${result.total_errores > 0 ? `<p class="text-rose-600"><strong>Errores:</strong> ${result.total_errores}</p>` : ''}
            `);

            // Actualizar contador
            document.getElementById('count-agendamientos').innerText = result.registros_insertados;
            document.getElementById('info-agendamientos').classList.remove('hidden');

            // Recargar datos en memoria
            if (typeof window.db_ready !== 'undefined') {
                window.dispatchEvent(new Event('db_ready'));
            }
        } else {
            showResultModal('error', 'Error en Importación', result.error || 'Ocurrió un error desconocido');
        }
    } catch (error) {
        hideLoadingOverlay();
        showResultModal('error', 'Error al Procesar', error.message);
    }
}

function showLoadingOverlay() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) overlay.classList.remove('hidden');
}

function hideLoadingOverlay() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) overlay.classList.add('hidden');
}

function showResultModal(type, title, content) {
    const modal = document.getElementById('result-modal');
    const resultContent = document.getElementById('result-content');

    if (!modal || !resultContent) return;

    const icon = type === 'success' 
        ? '<i class="fa-solid fa-circle-check text-emerald-500 text-3xl"></i>'
        : '<i class="fa-solid fa-circle-xmark text-rose-500 text-3xl"></i>';

    resultContent.innerHTML = `
        <div class="flex items-center gap-3 mb-4">
            ${icon}
            <h4 class="font-bold text-slate-800">${title}</h4>
        </div>
        <div class="text-slate-600 space-y-2">
            ${content}
        </div>
    `;

    modal.classList.remove('hidden');
}

function closeResultModal() {
    const modal = document.getElementById('result-modal');
    if (modal) modal.classList.add('hidden');
}

function clearImport(type) {
    if (type === 'agendamientos') {
        document.getElementById('file-agendamientos').value = '';
        document.getElementById('count-agendamientos').innerText = '0';
        document.getElementById('info-agendamientos').classList.add('hidden');
    }
}
