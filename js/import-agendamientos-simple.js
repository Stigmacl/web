/**
 * import-agendamientos-simple.js
 * Importación de agendamientos usando el mismo patrón que la dotación
 * - Procesa Excel con SheetJS en el navegador
 * - Envía JSON al backend
 * - Backend inserta en tbl_agendamientos
 */

document.addEventListener('DOMContentLoaded', () => {
    // Agregar listener para agendamientos
    const fileInput = document.getElementById('file-agendamientos');
    if (fileInput) {
        fileInput.addEventListener('change', (e) => handleFileUpload(e, 'agendamientos'));
    }
});

function normalizeExcelKey(value) {
    return value.toString().toUpperCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^A-Z0-9]/g, '');
}

function getNormalizedValue(row, keys) {
    for (const key of Object.keys(row)) {
        if (keys.includes(normalizeExcelKey(key))) {
            return row[key];
        }
    }
    return '';
}

function mapAgendamientoRow(row) {
    const idAgend = getNormalizedValue(row, ['IDAGENDAMIENTO', 'ID']);
    const rutCliente = getNormalizedValue(row, ['RUTCLIENTE', 'RUT']);

    if (!idAgend || !rutCliente) {
        return null;
    }

    return {
        id_agendamiento: idAgend ? idAgend.toString().trim() : '',
        fecha_creacion: getNormalizedValue(row, ['FECHACREACION', 'FECHACRACION']),
        hora_creacion: getNormalizedValue(row, ['HORACREACION']),
        fecha_agendamiento: getNormalizedValue(row, ['FECHAAGENDAMIENTO']),
        rut_cliente: rutCliente ? rutCliente.toString().trim() : '',
        dv_cliente: getNormalizedValue(row, ['DVCLIENTE', 'DV']),
        nombre_contacto: getNormalizedValue(row, ['NOMBRECONTACTO', 'NOMBRE']),
        email: getNormalizedValue(row, ['EMAIL']),
        telefono_contacto: getNormalizedValue(row, ['TELEFONOCONTACTO', 'TELEFONO']),
        telefono_movil: getNormalizedValue(row, ['TELEFONMOVIL', 'CELULAR']),
        servicio: getNormalizedValue(row, ['SERVICIO']),
        tipo: getNormalizedValue(row, ['TIPO']),
        desbloqueo_tarjetas: getNormalizedValue(row, ['DESBLOQUEOTATJETASPRODUCTO', 'DESBLOQUEO']),
        reseteo_tarjetas: getNormalizedValue(row, ['RESETEOTATJETASPRODUCTO', 'RESETEO']),
        observaciones: getNormalizedValue(row, ['OBSERVACIONES']),
        estado: getNormalizedValue(row, ['ESTADO']),
        id_usuario: getNormalizedValue(row, ['IDUSUARIO']),
        supervisor: getNormalizedValue(row, ['SUPERVISOR']),
        usuario_crea: getNormalizedValue(row, ['USUARIOCREA']),
        usuario_callback: getNormalizedValue(row, ['USUARIOCALLBACK']),
        comentario_callback: getNormalizedValue(row, ['COMENTARIOCALLBACK']),
        fecha_cierre_callback: getNormalizedValue(row, ['FECHACIERRECALLBACK']),
        tipo_pac: getNormalizedValue(row, ['TIPOPAC']),
        tarjeta_credito_pac: getNormalizedValue(row, ['TARJETACREDITOPAC']),
        cuenta_cargo_pac: getNormalizedValue(row, ['CUENTACARGOPAC']),
        tipo_bloqueo_tc: getNormalizedValue(row, ['TIPOBLOQUEOTC']),
        tipo_canal_tc: getNormalizedValue(row, ['TIPOCANALTC']),
        tipo_reseteo_atm: getNormalizedValue(row, ['TIPOREASEATM']),
        modalidad_reseteo_atm: getNormalizedValue(row, ['MODALIDADREASEATM']),
        numero_tarjeta_bloqueo: getNormalizedValue(row, ['NUMEROTARJETABLOQUEO']),
        numero_operacion: getNormalizedValue(row, ['NUMEROOPERACION']),
        numero_cuenta: getNormalizedValue(row, ['NUMEROCUENTA']),
        rut_titular_seguro: getNormalizedValue(row, ['RUTTITULARSEGURO']),
        numero_atencion_denuncio: getNormalizedValue(row, ['NUMEROATENCIONDENUNCIO']),
        tipo_problema_seguro: getNormalizedValue(row, ['TIPOPROBLEMASEGURO']),
        fecha_envio_documentacion: getNormalizedValue(row, ['FECHAENVIODOCUMENTACION']),
        medio_envio_documentacion: getNormalizedValue(row, ['MEDIOENVIODOCUMENTACION']),
        documentos_enviados: getNormalizedValue(row, ['DOCUMENTOSENVIADOS'])
    };
}

async function handleFileUpload(event, type) {
    const file = event.target.files[0];
    if (!file) return;

    toggleLoading(true);

    try {
        if (typeof XLSX === 'undefined') {
            throw new Error('La librería XLSX no está disponible en el navegador.');
        }

        // Parsear Excel
        const data = await parseExcel(file);
        let finalData = [];

        if (type === 'agendamientos') {
            // Mapear filas de agendamientos
            finalData = data.map(mapAgendamientoRow).filter(row => row !== null);

            // Validar que haya datos
            if (finalData.length === 0) {
                throw new Error('No se encontraron agendamientos válidos en el archivo.');
            }

            // Normalizar estados
            finalData = finalData.map(row => {
                const estado = (row.estado || '').toString().toUpperCase().trim();
                if (!['RECHAZADO', 'EJECUTADO', 'EJECUTADOCONLLAMADO'].includes(estado)) {
                    row.estado = 'RECHAZADO'; // Default
                }
                return row;
            });
        }

        // Enviar al backend
        const endpoint = type === 'agendamientos' ? 'api/upload_excel_data_agendamientos_v2.php' : 'api/upload_excel_data.php';
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: type, data: finalData, fileName: file.name })
        });

        const result = await response.json();

        if (result.status === 'success') {
            alert(`¡Sincronización Exitosa BD! Se ingresaron/actualizaron ${result.inserted} registros de ${type}.`);
        } else {
            alert(`Error en BD: ${result.message}\nDetalles: ${result.details || ''}`);
        }

        updateStatusCards();
    } catch (err) {
        console.error(err);
        alert("Error al procesar el archivo. Revisa que sea un Excel válido.\n\nError: " + err.message);
    } finally {
        toggleLoading(false);
        event.target.value = ''; // Reset input
    }
}

function parseExcel(file) {
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
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
}

function toggleLoading(show) {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.classList.toggle('hidden', !show);
    }
}

function updateStatusCards() {
    // Actualizar badge de agendamientos si existe
    const infoAgend = document.getElementById('info-agendamientos');
    if (infoAgend) {
        infoAgend.classList.remove('hidden');
        const dropAgend = document.getElementById('drop-agendamientos');
        if (dropAgend) {
            dropAgend.classList.add('border-emerald-500', 'bg-emerald-50/20');
            const icon = dropAgend.querySelector('i');
            if (icon) {
                icon.className = "fa-solid fa-circle-check text-4xl text-emerald-500 mb-4";
            }
        }
    }
}
