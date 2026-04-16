/* 
   Data Import Logic - contingency Excel Parsing
*/

document.addEventListener('DOMContentLoaded', () => {
    initImportPage();
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

function normalizeDotacionStatus(rawStatus, fallbackStatus = 'Activo') {
    const status = (rawStatus || fallbackStatus || '').toString().trim().toUpperCase();

    if (!status || status.includes('ACTUAL') || status.includes('ACTIVO') || status.includes('VIGENTE')) {
        return 'Activo';
    }
    if (status.includes('FALTA')) {
        return 'Fuera Falta Grave';
    }
    if (status.includes('RENUNC') || status.includes('TER') || status.includes('DESVINC')) {
        return 'Renuncia/Termino';
    }
    if (status.includes('APOYO') || status.includes('LICEN') || status.includes('SINDICAL')) {
        return 'Apoyo/Licencia';
    }
    if (status.includes('INACT')) {
        return 'Inactivo';
    }

    return fallbackStatus || 'Activo';
}

function mapDotacionRow(row) {
    const rut = getNormalizedValue(row, ['RUT', 'RUTSUPERVISOR', 'RUTSUP']);
    const nombre = getNormalizedValue(row, ['NOMBRE', 'NOMBRECOMPLETO', 'SUPERVISOR', 'NOMBRESUPERVISOR']);

    if (!rut && !nombre) {
        return null;
    }

    const usuario = getNormalizedValue(row, ['USUARIO', 'USUARIOLOGIN', 'USUARIOSUPERVISOR', 'USUARIOSUP']);
    const supervisor = getNormalizedValue(row, ['SUPERVISOR', 'NOMBRESUPERVISOR']);
    const jefatura = getNormalizedValue(row, ['JEFATURA']);

    return {
        rut: rut ? rut.toString().trim() : '',
        nombre: nombre ? nombre.toString().toUpperCase().trim() : '',
        usuario: usuario ? usuario.toString().toUpperCase().trim() : '',
        supervisor: supervisor ? supervisor.toString().toUpperCase().trim() : '',
        estado: normalizeDotacionStatus(row.__estado__ || getNormalizedValue(row, ['ESTADO'])),
        contratoDesde: getNormalizedValue(row, ['CONTRATODESDE']),
        contratoHasta: getNormalizedValue(row, ['CONTRATOHASTA']),
        tipoContrato: getNormalizedValue(row, ['TIPOCONTRATO', 'CONTRATO']),
        jornada: getNormalizedValue(row, ['JORNADA']),
        modalidad: getNormalizedValue(row, ['MODALIDAD', 'MODALIDADNOVIEMBRE']),
        call: getNormalizedValue(row, ['CALL']),
        servicio: getNormalizedValue(row, ['SERVICIOACTUAL', 'SERVICIOACTU', 'SERVICIO']),
        jefatura: jefatura ? jefatura.toString().toUpperCase().trim() : '',
        hojaOrigen: row.__sheet__ || '',
        apellidoPaterno: getNormalizedValue(row, ['APELLIDOPATERNO']),
        apellidoMaterno: getNormalizedValue(row, ['APELLIDOMATERNO']),
        nombre1: getNormalizedValue(row, ['NOMBRE1']),
        nombre2: getNormalizedValue(row, ['NOMBRE2']),
        usuarioSupervisor: getNormalizedValue(row, ['USUARIOSUPERVISOR', 'USUARIOSUP']),
        usuarioAdministrador: getNormalizedValue(row, ['USUARIOADMINISTRADOR', 'USUARIOADM']),
        estadoExcel: getNormalizedValue(row, ['ESTADO']),
        eatAObservar: getNormalizedValue(row, ['EATAOBSERVAR']),
        rutSupervisor: getNormalizedValue(row, ['RUTSUPERVISOR', 'RUTSUP']),
        rutAdministrador: getNormalizedValue(row, ['RUTADMINISTRADOR', 'RUTADM']),
        rutJefatura: getNormalizedValue(row, ['RUTJEFATURA']),
        plataforma: getNormalizedValue(row, ['PLATAFORMA']),
        fechaHoja: getNormalizedValue(row, ['FECHA']),
        contrato: getNormalizedValue(row, ['CONTRATO']),
        anidamiento: getNormalizedValue(row, ['ANIDAMIENTO'])
    };
}

function initImportPage() {
    updateStatusCards();

    // Event Listeners for File Inputs
    document.getElementById('file-dotacion').addEventListener('change', (e) => handleFileUpload(e, 'dotacion'));
    document.getElementById('file-errores').addEventListener('change', (e) => handleFileUpload(e, 'errores'));
}

function updateStatusCards() {
    const imports = DataImportStore.getAll();
    
    // Dotacion info
    if (imports.dotacion) {
        document.getElementById('info-dotacion').classList.remove('hidden');
        document.getElementById('count-dotacion').innerText = imports.dotacion.count;
        document.getElementById('drop-dotacion').classList.add('border-emerald-500', 'bg-emerald-50/20');
        document.getElementById('drop-dotacion').querySelector('i').className = "fa-solid fa-circle-check text-4xl text-emerald-500 mb-4";
    } else {
        document.getElementById('info-dotacion').classList.add('hidden');
        document.getElementById('drop-dotacion').classList.remove('border-emerald-500', 'bg-emerald-50/20');
        document.getElementById('drop-dotacion').querySelector('i').className = "fa-solid fa-cloud-arrow-up text-4xl text-slate-300 mb-4";
    }

    // Errores info
    if (imports.errores) {
        document.getElementById('info-errores').classList.remove('hidden');
        document.getElementById('count-errores').innerText = imports.errores.count;
        document.getElementById('drop-errores').classList.add('border-emerald-500', 'bg-emerald-50/20');
        document.getElementById('drop-errores').querySelector('i').className = "fa-solid fa-circle-check text-4xl text-emerald-500 mb-4";
    } else {
        document.getElementById('info-errores').classList.add('hidden');
        document.getElementById('drop-errores').classList.remove('border-emerald-500', 'bg-emerald-50/20');
        document.getElementById('drop-errores').querySelector('i').className = "fa-solid fa-file-excel text-4xl text-slate-300 mb-4";
    }
}

async function handleFileUpload(event, type) {
    const file = event.target.files[0];
    if (!file) return;

    toggleLoading(true);

    try {
        if (typeof XLSX === 'undefined') {
            throw new Error('La libreria XLSX no esta disponible en el navegador.');
        }
        
        const data = type === 'dotacion'
            ? await parseExcelDotacion(file)
            : await parseExcel(file);
        
        let finalData = [];

        if (type === 'dotacion') {
            finalData = data.map(mapDotacionRow).filter(row => row !== null);
        } else {
            const mappedData = data.map((row) => {
                const cleanRow = {};
                Object.keys(row).forEach(k => {
                    const rawK = k.toString().toUpperCase()
                        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
                        .replace(/[^A-Z0-9]/g, "");

                    if (rawK === 'FECHA') cleanRow.fecha = row[k];
                    if (rawK === 'NOT' || rawK === 'OT') cleanRow.ot = row[k];
                    if (rawK === 'RUTCDV' || rawK === 'RUT' || rawK === 'RUTCLIENTE') cleanRow.rutCliente = row[k];
                    if (rawK === 'NOMBREEJECUTIVO' || rawK === 'EJECUTIVO' || rawK === 'NOMEJECUTIVO') cleanRow.ejecutivo = row[k];
                    if (rawK === 'SUPERVISOR') cleanRow.supervisor = row[k];
                    if (rawK === 'OBSERVACION' || rawK === 'OBSERVACIONFUSION') cleanRow.observacion = row[k];
                    if (rawK === 'TIPIFICACION') cleanRow.tipificacion = row[k];
                    if (rawK === 'EATRUT' || rawK === 'RUTEJ') cleanRow.rutEjecutivo = row[k];
                    if (rawK === 'ESTADOAGEND' || rawK === 'ESTADOAGEN') cleanRow.agendamientoEstado = row[k];
                    if (rawK === 'NOMBRECLIENT' || rawK === 'NOMBRECLIENTE' || rawK === 'CLIENTE') cleanRow.cliente = row[k];
                });
                return cleanRow;
            });

            let originCategory = 'Otras Alertas';
            const fName = file.name.toLowerCase();
            if (fName.includes('fraude')) originCategory = 'Ley Fraude';
            else if (fName.includes('agendamiento')) originCategory = 'Agendamientos';
            else if (fName.includes('bloqueo') || fName.includes('desbloqueo')) originCategory = 'Desbloqueos APP';
            else if (fName.includes('onp')) originCategory = 'ONP';

            const months = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];

            finalData = mappedData.map((row, idx) => {
                const cleanRow = { ...row };

                if (cleanRow.fecha) {
                    let pDate = cleanRow.fecha;
                    if (typeof pDate === 'number' && pDate > 10000) {
                        pDate = new Date(Math.round((pDate - 25569) * 86400 * 1000));
                        pDate.setMinutes(pDate.getMinutes() + pDate.getTimezoneOffset());
                    }
                    if (pDate instanceof Date && !isNaN(pDate)) {
                        cleanRow.fecha = `${pDate.getDate()} ${months[pDate.getMonth()]} ${pDate.getFullYear()}`;
                    } else {
                        const dStr = pDate.toString().trim().split(' ')[0];
                        const parts = dStr.split(/[-/]/);
                        if (parts.length === 3) {
                            const d = parseInt(parts[0]);
                            const m = parseInt(parts[1]);
                            let y = parts[2].toString();
                            if (y.length === 2) y = "20" + y;
                            if (!isNaN(m) && m >= 1 && m <= 12) {
                                cleanRow.fecha = `${d} ${months[m-1]} ${y}`;
                            }
                        }
                    }
                } else {
                    const now = new Date();
                    cleanRow.fecha = `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
                }

                const otId = cleanRow.ot ? cleanRow.ot.toString() : `idx-${idx}`;
                cleanRow.id = `man-${otId}-${Date.now()}`;
                cleanRow.categoria = originCategory;
                cleanRow.estado = 'pendiente';
                cleanRow.agendamientoEstado = cleanRow.agendamientoEstado || 'N/A';

                if (cleanRow.supervisor) cleanRow.supervisor = cleanRow.supervisor.toUpperCase().trim();
                if (cleanRow.ejecutivo) cleanRow.ejecutivo = cleanRow.ejecutivo.toUpperCase().trim();

                return cleanRow;
            });
        }

        const response = await fetch('api/upload_excel_data.php', {
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
        alert("Error al procesar el archivo. Revisa que sea un Excel válido.");
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
            } catch (err) { reject(err); }
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
}

function parseExcelDotacion(file) {
    const SHEET_ESTADO_MAP = {
        'FUSION':                    'Activo',
        'FUERA FALTA GRAVE':         'Fuera Falta Grave',
        'RENUNCIAS - TER.CONTRATO':  'Renuncia/Termino',
        'APOYOS - LICENCIAS':        'Apoyo/Licencia',
        'APOYOS - LICENCIAS ':       'Apoyo/Licencia',
    };
    const SHEET_START = 'FUSION';
    const SHEET_JEFATURA = 'JEFATURA';

    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array', cellDates: true });
                const normalizedSheetNames = workbook.SheetNames.map(name => name.trim().toUpperCase());
                const startIndex = normalizedSheetNames.indexOf(SHEET_START);
                const endIndex = normalizedSheetNames.indexOf(SHEET_JEFATURA);

                if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
                    throw new Error('No se encontro el bloque de hojas desde FUSION hasta JEFATURA.');
                }

                let allRows = [];

                workbook.SheetNames.slice(startIndex, endIndex + 1).forEach(sheetName => {
                    const nameClean = sheetName.trim().toUpperCase();
                    const ws = workbook.Sheets[sheetName];
                    const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });

                    if (nameClean === SHEET_JEFATURA) {
                        rows.forEach(row => {
                            const hasSomeValue = Object.values(row).some(value => value !== null && value !== '');
                            if (!hasSomeValue) return;

                            row.__sheet__ = SHEET_JEFATURA;
                            row.__estado__ = 'Activo';
                            allRows.push(row);
                        });
                        return;
                    }

                    const estadoHoja = SHEET_ESTADO_MAP[sheetName]
                        || SHEET_ESTADO_MAP[sheetName.trim()]
                        || (nameClean.includes('FALTA')   ? 'Fuera Falta Grave'
                          : nameClean.includes('RENUNCI') || nameClean.includes('TER') ? 'Renuncia/Termino'
                          : nameClean.includes('APOYO')   || nameClean.includes('LICEN') ? 'Apoyo/Licencia'
                          : 'Activo');

                    rows.forEach(row => {
                        const hasSomeValue = Object.values(row).some(value => value !== null && value !== '');
                        if (!hasSomeValue) return;

                        row.__sheet__ = sheetName;
                        row.__estado__ = normalizeDotacionStatus(row.ESTADO || estadoHoja, estadoHoja);
                        allRows.push(row);
                    });
                });

                resolve(allRows);
            } catch (err) { reject(err); }
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
}

function toggleLoading(show) {
    document.getElementById('loading-overlay').classList.toggle('hidden', !show);
}

window.clearImport = function(type) {
    if (confirm(`¿Seguro que deseas eliminar los datos manuales de ${type}? El sistema volverá a usar los datos de contingencia predeterminados.`)) {
        DataImportStore.clear(type);
        updateStatusCards();
    }
};
