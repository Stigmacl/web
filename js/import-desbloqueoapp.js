/**
 * js/import-desbloqueoapp.js
 * Maneja la importación de archivos de Desbloqueos de APP desde Excel
 * Se integra con import.html y upload_desbloqueoapp.php
 */

function initDesbloqueoAppImport() {
    const fileInput = document.getElementById('file-desbloqueoapp');
    if (!fileInput) {
        console.warn('[import-desbloqueoapp] Input #file-desbloqueoapp no encontrado');
        return;
    }

    fileInput.addEventListener('change', (e) => handleDesbloqueoAppUpload(e));
    updateDesbloqueoAppStatusCard();
}

function updateDesbloqueoAppStatusCard() {
    const imports = DataImportStore.getAll();
    
    if (imports.desbloqueoapp) {
        document.getElementById('info-desbloqueoapp').classList.remove('hidden');
        document.getElementById('count-desbloqueoapp').innerText = imports.desbloqueoapp.count;
        document.getElementById('drop-desbloqueoapp').classList.add('border-emerald-500', 'bg-emerald-50/20');
        document.getElementById('drop-desbloqueoapp').querySelector('i').className = "fa-solid fa-circle-check text-4xl text-emerald-500 mb-4";
    } else {
        document.getElementById('info-desbloqueoapp').classList.add('hidden');
        document.getElementById('drop-desbloqueoapp').classList.remove('border-emerald-500', 'bg-emerald-50/20');
        document.getElementById('drop-desbloqueoapp').querySelector('i').className = "fa-solid fa-mobile-screen text-4xl text-slate-300 mb-4";
    }
}

async function handleDesbloqueoAppUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    toggleLoading(true);

    try {
        if (typeof XLSX === 'undefined') {
            throw new Error('La librería XLSX no está disponible en el navegador.');
        }

        // Parsear el Excel
        const data = await parseExcelDesbloqueoApp(file);
        
        // Mapear las columnas del Excel al formato esperado
        const mappedData = data.map((row) => {
            const cleanRow = {};
            Object.keys(row).forEach(k => {
                const rawK = k.toString().toUpperCase()
                    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
                    .replace(/[^A-Z0-9]/g, "");

                if (rawK === 'RUTCLIENTE') cleanRow.rut_cliente = row[k];
                if (rawK === 'NOMBRE') cleanRow.nombre_cliente = row[k];
                if (rawK === 'TIPO') cleanRow.tipo = row[k];
                if (rawK === 'MOTIVO') cleanRow.motivo = row[k];
                if (rawK === 'EATRUT') cleanRow.eat_rut = row[k];
                if (rawK === 'EATUSERNAME') cleanRow.eat_username = row[k];
                if (rawK === 'FECHAREGISTROEAT') cleanRow.fecha_registro_eat = row[k];
                if (rawK === 'BLOQUEOAPPP') cleanRow.bloqueo_app = row[k];
                if (rawK === 'BLOQUERUTPAY') cleanRow.bloqueo_rutpay = row[k];
                if (rawK === 'AUTENTICADO') cleanRow.autenticado = row[k];
                if (rawK === 'TIPOAUTENTICADO') cleanRow.tipo_autenticado = row[k];
                if (rawK === 'MULTICANALIDAD') cleanRow.multicanalidad = row[k];
                if (rawK === 'COMENTARIOORIGEN') cleanRow.comentario_origen = row[k];
                if (rawK === 'REVISIONCALLBACK') cleanRow.revision_callback = row[k];
                if (rawK === 'FECHAREVISIONCALLBACK') cleanRow.fecha_revision_callback = row[k];
                if (rawK === 'USUARIOCALLBACK') cleanRow.usuario_callback = row[k];
                if (rawK === 'COMENTARIOCALLBACK') cleanRow.comentario_callback = row[k];
            });
            return cleanRow;
        });

        // Enviar al backend
        const response = await fetch('api/upload_desbloqueoapp.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                data: mappedData, 
                fileName: file.name 
            })
        });

        const result = await response.json();

        if (result.status === 'success') {
            alert(`¡Sincronización Exitosa! Se ingresaron ${result.inserted} desbloqueos de APP.`);
            
            // Guardar en DataImportStore
            if (typeof DataImportStore !== 'undefined') {
                // Usamos save que es el método correcto en stores.js
                DataImportStore.save('desbloqueoapp', {
                    count: result.inserted,
                    fileName: file.name,
                    timestamp: new Date().toISOString()
                });
            }
            
            updateDesbloqueoAppStatusCard();
        } else {
            alert(`Error: ${result.message}\nDetalles: ${result.details || ''}`);
        }

    } catch (err) {
        console.error('[import-desbloqueoapp] Error:', err);
        alert("Error al procesar el archivo de desbloqueos. Verifica que sea un Excel válido.");
    } finally {
        toggleLoading(false);
        event.target.value = '';
    }
}

function parseExcelDesbloqueoApp(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array', cellDates: true });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const json = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
                resolve(json);
            } catch (err) {
                reject(err);
            }
        };
        reader.onerror = () => reject(new Error('Error leyendo el archivo'));
        reader.readAsArrayBuffer(file);
    });
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    initDesbloqueoAppImport();
});
