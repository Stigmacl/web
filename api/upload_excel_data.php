<?php
// api/upload_excel_data.php
require_once 'config.php';

// Aceptar JSON en POST
header('Content-Type: application/json');

$rawData = file_get_contents("php://input");
$payload = json_decode($rawData, true);

if (!$payload || !isset($payload['type']) || !isset($payload['data'])) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Carga de datos inválida"]);
    exit;
}

$db = Database::conectar();
$type = $payload['type'];
$data = $payload['data'];
$registrosProcesados = 0;

function normalizarEstadoDotacion($estadoRaw) {
    $estado = strtoupper(trim((string)($estadoRaw ?? '')));

    if ($estado === '' || str_contains($estado, 'ACTUAL') || str_contains($estado, 'ACTIVO') || str_contains($estado, 'VIGENTE')) {
        return 'Activo';
    }
    if (str_contains($estado, 'FALTA')) {
        return 'Fuera Falta Grave';
    }
    if (str_contains($estado, 'RENUNC') || str_contains($estado, 'TER') || str_contains($estado, 'DESVINC')) {
        return 'Renuncia/Termino';
    }
    if (str_contains($estado, 'APOYO') || str_contains($estado, 'LICEN') || str_contains($estado, 'SINDICAL')) {
        return 'Apoyo/Licencia';
    }
    if (str_contains($estado, 'INACT')) {
        return 'Inactivo';
    }

    return 'Inactivo';
}

function normalizarNombreHoja($hojaRaw) {
    $hoja = strtoupper(trim((string)($hojaRaw ?? '')));
    $hoja = preg_replace('/\s+/', ' ', $hoja);
    return $hoja;
}

function obtenerTablaDotacionPorHoja($hojaRaw) {
    $hoja = normalizarNombreHoja($hojaRaw);

    return match ($hoja) {
        'FUSION' => 'tbl_dotacion_fusion',
        'FUERA FALTA GRAVE' => 'tbl_dotacion_fuera_falta_grave',
        'RENUNCIAS - TER.CONTRATO' => 'tbl_dotacion_renuncias_termino',
        'APOYOS - LICENCIAS' => 'tbl_dotacion_apoyos_licencias',
        'JEFATURA' => 'tbl_dotacion_jefatura',
        default => null,
    };
}

try {
    // Iniciar transacción pesada
    $db->beginTransaction();

    if ($type === 'dotacion') {
        // 1. TABLA MADRE: tbl_dotacion
        $stmtDotacion = $db->prepare("
            INSERT INTO tbl_dotacion (
                rut, nombre_completo, usuario_login, supervisor_asignado, estado_dotacion,
                contrato_desde, contrato_hasta, tipo_contrato, jornada, modalidad,
                call_center, servicio, jefatura, hoja_origen
            )
            VALUES (
                :rut, :nom, :usr, :sup, :est,
                :contrato_desde, :contrato_hasta, :tipo_contrato, :jornada, :modalidad,
                :call_center, :servicio, :jefatura, :hoja_origen
            )
            ON DUPLICATE KEY UPDATE
                nombre_completo = VALUES(nombre_completo),
                usuario_login = VALUES(usuario_login),
                supervisor_asignado = VALUES(supervisor_asignado),
                estado_dotacion = VALUES(estado_dotacion),
                contrato_desde = VALUES(contrato_desde),
                contrato_hasta = VALUES(contrato_hasta),
                tipo_contrato = VALUES(tipo_contrato),
                jornada = VALUES(jornada),
                modalidad = VALUES(modalidad),
                call_center = VALUES(call_center),
                servicio = VALUES(servicio),
                jefatura = VALUES(jefatura),
                hoja_origen = VALUES(hoja_origen)
        ");

        // 2. TABLA FUSION
        $stmtFusion = $db->prepare("
            INSERT INTO tbl_dotacion_fusion (
                rut, usuario, nombre, apellido_paterno, apellido_materno, nombre_1, nombre_2,
                servicio, servicio_actual, contrato_desde, contrato_hasta, tipo_contrato, jornada,
                usuario_supervisor, usuario_administrador, estado_excel, modalidad, call_center,
                eat_a_observar, rut_supervisor, supervisor, rut_jefatura, jefatura, plataforma
            ) VALUES (
                :rut, :usuario, :nombre, :apellido_paterno, :apellido_materno, :nombre_1, :nombre_2,
                :servicio, :servicio_actual, :contrato_desde, :contrato_hasta, :tipo_contrato, :jornada,
                :usuario_supervisor, :usuario_administrador, :estado_excel, :modalidad, :call_center,
                :eat_a_observar, :rut_supervisor, :supervisor, :rut_jefatura, :jefatura, :plataforma
            )
            ON DUPLICATE KEY UPDATE
                usuario = VALUES(usuario), nombre = VALUES(nombre), apellido_paterno = VALUES(apellido_paterno),
                apellido_materno = VALUES(apellido_materno), nombre_1 = VALUES(nombre_1), nombre_2 = VALUES(nombre_2),
                servicio = VALUES(servicio), servicio_actual = VALUES(servicio_actual),
                contrato_desde = VALUES(contrato_desde), contrato_hasta = VALUES(contrato_hasta),
                tipo_contrato = VALUES(tipo_contrato), jornada = VALUES(jornada),
                usuario_supervisor = VALUES(usuario_supervisor), usuario_administrador = VALUES(usuario_administrador),
                estado_excel = VALUES(estado_excel), modalidad = VALUES(modalidad), call_center = VALUES(call_center),
                eat_a_observar = VALUES(eat_a_observar), rut_supervisor = VALUES(rut_supervisor),
                supervisor = VALUES(supervisor), rut_jefatura = VALUES(rut_jefatura),
                jefatura = VALUES(jefatura), plataforma = VALUES(plataforma)
        ");

        // 3. TABLA FUERA FALTA GRAVE
        $stmtFueraFalta = $db->prepare("
            INSERT INTO tbl_dotacion_fuera_falta_grave (
                rut, usuario, nombre, apellido_paterno, apellido_materno, nombre_1, nombre_2,
                servicio, servicio_actual, contrato_desde, contrato_hasta, tipo_contrato, jornada,
                usuario_supervisor, usuario_administrador, estado_excel, modalidad, call_center,
                eat_a_observar, rut_supervisor, supervisor, rut_administrador, jefatura
            ) VALUES (
                :rut, :usuario, :nombre, :apellido_paterno, :apellido_materno, :nombre_1, :nombre_2,
                :servicio, :servicio_actual, :contrato_desde, :contrato_hasta, :tipo_contrato, :jornada,
                :usuario_supervisor, :usuario_administrador, :estado_excel, :modalidad, :call_center,
                :eat_a_observar, :rut_supervisor, :supervisor, :rut_administrador, :jefatura
            )
            ON DUPLICATE KEY UPDATE
                usuario = VALUES(usuario), nombre = VALUES(nombre), apellido_paterno = VALUES(apellido_paterno),
                apellido_materno = VALUES(apellido_materno), nombre_1 = VALUES(nombre_1), nombre_2 = VALUES(nombre_2),
                servicio = VALUES(servicio), servicio_actual = VALUES(servicio_actual),
                contrato_desde = VALUES(contrato_desde), contrato_hasta = VALUES(contrato_hasta),
                tipo_contrato = VALUES(tipo_contrato), jornada = VALUES(jornada),
                usuario_supervisor = VALUES(usuario_supervisor), usuario_administrador = VALUES(usuario_administrador),
                estado_excel = VALUES(estado_excel), modalidad = VALUES(modalidad), call_center = VALUES(call_center),
                eat_a_observar = VALUES(eat_a_observar), rut_supervisor = VALUES(rut_supervisor),
                supervisor = VALUES(supervisor), rut_administrador = VALUES(rut_administrador),
                jefatura = VALUES(jefatura)
        ");

        // 4. TABLA RENUNCIAS
        $stmtRenuncias = $db->prepare("
            INSERT INTO tbl_dotacion_renuncias_termino (
                rut, usuario, nombre, apellido_paterno, apellido_materno, nombre_1, nombre_2,
                servicio, servicio_actual, contrato_desde, contrato_hasta, tipo_contrato, jornada,
                usuario_supervisor, usuario_administrador, estado_excel, modalidad, call_center,
                eat_a_observar, rut_supervisor, supervisor, rut_administrador, jefatura
            ) VALUES (
                :rut, :usuario, :nombre, :apellido_paterno, :apellido_materno, :nombre_1, :nombre_2,
                :servicio, :servicio_actual, :contrato_desde, :contrato_hasta, :tipo_contrato, :jornada,
                :usuario_supervisor, :usuario_administrador, :estado_excel, :modalidad, :call_center,
                :eat_a_observar, :rut_supervisor, :supervisor, :rut_administrador, :jefatura
            )
            ON DUPLICATE KEY UPDATE
                usuario = VALUES(usuario), nombre = VALUES(nombre), apellido_paterno = VALUES(apellido_paterno),
                apellido_materno = VALUES(apellido_materno), nombre_1 = VALUES(nombre_1), nombre_2 = VALUES(nombre_2),
                servicio = VALUES(servicio), servicio_actual = VALUES(servicio_actual),
                contrato_desde = VALUES(contrato_desde), contrato_hasta = VALUES(contrato_hasta),
                tipo_contrato = VALUES(tipo_contrato), jornada = VALUES(jornada),
                usuario_supervisor = VALUES(usuario_supervisor), usuario_administrador = VALUES(usuario_administrador),
                estado_excel = VALUES(estado_excel), modalidad = VALUES(modalidad), call_center = VALUES(call_center),
                eat_a_observar = VALUES(eat_a_observar), rut_supervisor = VALUES(rut_supervisor),
                supervisor = VALUES(supervisor), rut_administrador = VALUES(rut_administrador),
                jefatura = VALUES(jefatura)
        ");

        // 5. TABLA APOYOS
        $stmtApoyos = $db->prepare("
            INSERT INTO tbl_dotacion_apoyos_licencias (
                rut, usuario, nombre, apellido_paterno, apellido_materno, nombre_1, nombre_2,
                servicio, servicio_actual, contrato_desde, contrato_hasta, tipo_contrato, jornada,
                usuario_supervisor, usuario_administrador, estado_excel, modalidad, call_center,
                eat_a_observar, rut_supervisor, supervisor, rut_administrador, jefatura, plataforma, fecha_hoja
            ) VALUES (
                :rut, :usuario, :nombre, :apellido_paterno, :apellido_materno, :nombre_1, :nombre_2,
                :servicio, :servicio_actual, :contrato_desde, :contrato_hasta, :tipo_contrato, :jornada,
                :usuario_supervisor, :usuario_administrador, :estado_excel, :modalidad, :call_center,
                :eat_a_observar, :rut_supervisor, :supervisor, :rut_administrador, :jefatura, :plataforma, :fecha_hoja
            )
            ON DUPLICATE KEY UPDATE
                usuario = VALUES(usuario), nombre = VALUES(nombre), apellido_paterno = VALUES(apellido_paterno),
                apellido_materno = VALUES(apellido_materno), nombre_1 = VALUES(nombre_1), nombre_2 = VALUES(nombre_2),
                servicio = VALUES(servicio), servicio_actual = VALUES(servicio_actual),
                contrato_desde = VALUES(contrato_desde), contrato_hasta = VALUES(contrato_hasta),
                tipo_contrato = VALUES(tipo_contrato), jornada = VALUES(jornada),
                usuario_supervisor = VALUES(usuario_supervisor), usuario_administrador = VALUES(usuario_administrador),
                estado_excel = VALUES(estado_excel), modalidad = VALUES(modalidad), call_center = VALUES(call_center),
                eat_a_observar = VALUES(eat_a_observar), rut_supervisor = VALUES(rut_supervisor),
                supervisor = VALUES(supervisor), rut_administrador = VALUES(rut_administrador),
                jefatura = VALUES(jefatura), plataforma = VALUES(plataforma), fecha_hoja = VALUES(fecha_hoja)
        ");

        // 6. TABLA JEFATURA
        $stmtJefatura = $db->prepare("
            INSERT INTO tbl_dotacion_jefatura (
                supervisor, usuario_supervisor, usuario_administrador, rut_supervisor,
                rut_administrador, jefatura, estado, contrato, anidamiento
            ) VALUES (
                :supervisor, :usuario_supervisor, :usuario_administrador, :rut_supervisor,
                :rut_administrador, :jefatura, :estado, :contrato, :anidamiento
            )
            ON DUPLICATE KEY UPDATE
                supervisor = VALUES(supervisor),
                usuario_supervisor = VALUES(usuario_supervisor),
                usuario_administrador = VALUES(usuario_administrador),
                rut_administrador = VALUES(rut_administrador),
                jefatura = VALUES(jefatura),
                estado = VALUES(estado),
                contrato = VALUES(contrato),
                anidamiento = VALUES(anidamiento)
        ");

        $stmtLog = $db->prepare("
            INSERT INTO tbl_dotacion_import_log (
                archivo_nombre, hoja_nombre, tabla_destino, registros_procesados,
                registros_insertados, registros_actualizados, observacion
            ) VALUES (
                :archivo_nombre, :hoja_nombre, :tabla_destino, :registros_procesados,
                :registros_insertados, :registros_actualizados, :observacion
            )
        ");

        foreach ($data as $row) {
            if (empty($row['rut']) && empty($row['nombre']) && empty($row['supervisor'])) continue;

            $rutLimpio = strtoupper(trim((string)($row['rut'] ?? '')));
            $estadoDB = normalizarEstadoDotacion($row['estado'] ?? 'ACTUAL');
            $hojaOrigen = normalizarNombreHoja($row['hojaOrigen'] ?? '');
            $tablaDestino = obtenerTablaDotacionPorHoja($hojaOrigen);
            
            // 1. Inserción en tbl_dotacion (Si hay RUT y Nombre)
            if (!empty($rutLimpio) && !empty($row['nombre'])) {
                $stmtDotacion->execute([
                    ':rut' => $rutLimpio,
                    ':nom' => strtoupper(trim((string)$row['nombre'])),
                    ':usr' => strtoupper(trim((string)($row['usuario'] ?? ''))),
                    ':sup' => strtoupper(trim((string)($row['supervisor'] ?? ''))),
                    ':est' => $estadoDB,
                    ':contrato_desde' => !empty($row['contratoDesde']) ? $row['contratoDesde'] : null,
                    ':contrato_hasta' => !empty($row['contratoHasta']) ? $row['contratoHasta'] : null,
                    ':tipo_contrato' => trim((string)($row['tipoContrato'] ?? '')),
                    ':jornada' => trim((string)($row['jornada'] ?? '')),
                    ':modalidad' => trim((string)($row['modalidad'] ?? '')),
                    ':call_center' => trim((string)($row['call'] ?? '')),
                    ':servicio' => trim((string)($row['servicio'] ?? '')),
                    ':jefatura' => strtoupper(trim((string)($row['jefatura'] ?? ''))),
                    ':hoja_origen' => $hojaOrigen
                ]);
            }

            // 2. Inserción en tablas específicas
            if ($tablaDestino === 'tbl_dotacion_fusion') {
                $stmtFusion->execute([
                    ':rut' => $rutLimpio,
                    ':usuario' => strtoupper(trim((string)($row['usuario'] ?? ''))),
                    ':nombre' => strtoupper(trim((string)($row['nombre'] ?? ''))),
                    ':apellido_paterno' => strtoupper(trim((string)($row['apellidoPaterno'] ?? ''))),
                    ':apellido_materno' => strtoupper(trim((string)($row['apellidoMaterno'] ?? ''))),
                    ':nombre_1' => strtoupper(trim((string)($row['nombre1'] ?? ''))),
                    ':nombre_2' => strtoupper(trim((string)($row['nombre2'] ?? ''))),
                    ':servicio' => trim((string)($row['servicio'] ?? '')),
                    ':servicio_actual' => trim((string)($row['servicio'] ?? '')),
                    ':contrato_desde' => !empty($row['contratoDesde']) ? $row['contratoDesde'] : null,
                    ':contrato_hasta' => !empty($row['contratoHasta']) ? $row['contratoHasta'] : null,
                    ':tipo_contrato' => trim((string)($row['tipoContrato'] ?? '')),
                    ':jornada' => trim((string)($row['jornada'] ?? '')),
                    ':usuario_supervisor' => strtoupper(trim((string)($row['usuarioSupervisor'] ?? ''))),
                    ':usuario_administrador' => strtoupper(trim((string)($row['usuarioAdministrador'] ?? ''))),
                    ':estado_excel' => trim((string)($row['estadoExcel'] ?? '')),
                    ':modalidad' => trim((string)($row['modalidad'] ?? '')),
                    ':call_center' => trim((string)($row['call'] ?? '')),
                    ':eat_a_observar' => trim((string)($row['eatAObservar'] ?? '')),
                    ':rut_supervisor' => strtoupper(trim((string)($row['rutSupervisor'] ?? ''))),
                    ':supervisor' => strtoupper(trim((string)($row['supervisor'] ?? ''))),
                    ':rut_jefatura' => strtoupper(trim((string)($row['rutJefatura'] ?? ''))),
                    ':jefatura' => strtoupper(trim((string)($row['jefatura'] ?? ''))),
                    ':plataforma' => trim((string)($row['plataforma'] ?? ''))
                ]);
            } elseif ($tablaDestino === 'tbl_dotacion_fuera_falta_grave') {
                $stmtFueraFalta->execute([
                    ':rut' => $rutLimpio,
                    ':usuario' => strtoupper(trim((string)($row['usuario'] ?? ''))),
                    ':nombre' => strtoupper(trim((string)($row['nombre'] ?? ''))),
                    ':apellido_paterno' => strtoupper(trim((string)($row['apellidoPaterno'] ?? ''))),
                    ':apellido_materno' => strtoupper(trim((string)($row['apellidoMaterno'] ?? ''))),
                    ':nombre_1' => strtoupper(trim((string)($row['nombre1'] ?? ''))),
                    ':nombre_2' => strtoupper(trim((string)($row['nombre2'] ?? ''))),
                    ':servicio' => trim((string)($row['servicio'] ?? '')),
                    ':servicio_actual' => trim((string)($row['servicio'] ?? '')),
                    ':contrato_desde' => !empty($row['contratoDesde']) ? $row['contratoDesde'] : null,
                    ':contrato_hasta' => !empty($row['contratoHasta']) ? $row['contratoHasta'] : null,
                    ':tipo_contrato' => trim((string)($row['tipoContrato'] ?? '')),
                    ':jornada' => trim((string)($row['jornada'] ?? '')),
                    ':usuario_supervisor' => strtoupper(trim((string)($row['usuarioSupervisor'] ?? ''))),
                    ':usuario_administrador' => strtoupper(trim((string)($row['usuarioAdministrador'] ?? ''))),
                    ':estado_excel' => trim((string)($row['estadoExcel'] ?? '')),
                    ':modalidad' => trim((string)($row['modalidad'] ?? '')),
                    ':call_center' => trim((string)($row['call'] ?? '')),
                    ':eat_a_observar' => trim((string)($row['eatAObservar'] ?? '')),
                    ':rut_supervisor' => strtoupper(trim((string)($row['rutSupervisor'] ?? ''))),
                    ':supervisor' => strtoupper(trim((string)($row['supervisor'] ?? ''))),
                    ':rut_administrador' => strtoupper(trim((string)($row['rutAdministrador'] ?? ''))),
                    ':jefatura' => strtoupper(trim((string)($row['jefatura'] ?? '')))
                ]);
            } elseif ($tablaDestino === 'tbl_dotacion_renuncias_termino') {
                $stmtRenuncias->execute([
                    ':rut' => $rutLimpio,
                    ':usuario' => strtoupper(trim((string)($row['usuario'] ?? ''))),
                    ':nombre' => strtoupper(trim((string)($row['nombre'] ?? ''))),
                    ':apellido_paterno' => strtoupper(trim((string)($row['apellidoPaterno'] ?? ''))),
                    ':apellido_materno' => strtoupper(trim((string)($row['apellidoMaterno'] ?? ''))),
                    ':nombre_1' => strtoupper(trim((string)($row['nombre1'] ?? ''))),
                    ':nombre_2' => strtoupper(trim((string)($row['nombre2'] ?? ''))),
                    ':servicio' => trim((string)($row['servicio'] ?? '')),
                    ':servicio_actual' => trim((string)($row['servicio'] ?? '')),
                    ':contrato_desde' => !empty($row['contratoDesde']) ? $row['contratoDesde'] : null,
                    ':contrato_hasta' => !empty($row['contratoHasta']) ? $row['contratoHasta'] : null,
                    ':tipo_contrato' => trim((string)($row['tipoContrato'] ?? '')),
                    ':jornada' => trim((string)($row['jornada'] ?? '')),
                    ':usuario_supervisor' => strtoupper(trim((string)($row['usuarioSupervisor'] ?? ''))),
                    ':usuario_administrador' => strtoupper(trim((string)($row['usuarioAdministrador'] ?? ''))),
                    ':estado_excel' => trim((string)($row['estadoExcel'] ?? '')),
                    ':modalidad' => trim((string)($row['modalidad'] ?? '')),
                    ':call_center' => trim((string)($row['call'] ?? '')),
                    ':eat_a_observar' => trim((string)($row['eatAObservar'] ?? '')),
                    ':rut_supervisor' => strtoupper(trim((string)($row['rutSupervisor'] ?? ''))),
                    ':supervisor' => strtoupper(trim((string)($row['supervisor'] ?? ''))),
                    ':rut_administrador' => strtoupper(trim((string)($row['rutAdministrador'] ?? ''))),
                    ':jefatura' => strtoupper(trim((string)($row['jefatura'] ?? '')))
                ]);
            } elseif ($tablaDestino === 'tbl_dotacion_apoyos_licencias') {
                $stmtApoyos->execute([
                    ':rut' => $rutLimpio,
                    ':usuario' => strtoupper(trim((string)($row['usuario'] ?? ''))),
                    ':nombre' => strtoupper(trim((string)($row['nombre'] ?? ''))),
                    ':apellido_paterno' => strtoupper(trim((string)($row['apellidoPaterno'] ?? ''))),
                    ':apellido_materno' => strtoupper(trim((string)($row['apellidoMaterno'] ?? ''))),
                    ':nombre_1' => strtoupper(trim((string)($row['nombre1'] ?? ''))),
                    ':nombre_2' => strtoupper(trim((string)($row['nombre2'] ?? ''))),
                    ':servicio' => trim((string)($row['servicio'] ?? '')),
                    ':servicio_actual' => trim((string)($row['servicio'] ?? '')),
                    ':contrato_desde' => !empty($row['contratoDesde']) ? $row['contratoDesde'] : null,
                    ':contrato_hasta' => !empty($row['contratoHasta']) ? $row['contratoHasta'] : null,
                    ':tipo_contrato' => trim((string)($row['tipoContrato'] ?? '')),
                    ':jornada' => trim((string)($row['jornada'] ?? '')),
                    ':usuario_supervisor' => strtoupper(trim((string)($row['usuarioSupervisor'] ?? ''))),
                    ':usuario_administrador' => strtoupper(trim((string)($row['usuarioAdministrador'] ?? ''))),
                    ':estado_excel' => trim((string)($row['estadoExcel'] ?? '')),
                    ':modalidad' => trim((string)($row['modalidad'] ?? '')),
                    ':call_center' => trim((string)($row['call'] ?? '')),
                    ':eat_a_observar' => trim((string)($row['eatAObservar'] ?? '')),
                    ':rut_supervisor' => strtoupper(trim((string)($row['rutSupervisor'] ?? ''))),
                    ':supervisor' => strtoupper(trim((string)($row['supervisor'] ?? ''))),
                    ':rut_administrador' => strtoupper(trim((string)($row['rutAdministrador'] ?? ''))),
                    ':jefatura' => strtoupper(trim((string)($row['jefatura'] ?? ''))),
                    ':plataforma' => trim((string)($row['plataforma'] ?? '')),
                    ':fecha_hoja' => !empty($row['fechaHoja']) ? $row['fechaHoja'] : null
                ]);
            } elseif ($tablaDestino === 'tbl_dotacion_jefatura') {
                $stmtJefatura->execute([
                    ':supervisor' => strtoupper(trim((string)($row['supervisor'] ?? ''))),
                    ':usuario_supervisor' => strtoupper(trim((string)($row['usuarioSupervisor'] ?? ''))),
                    ':usuario_administrador' => strtoupper(trim((string)($row['usuarioAdministrador'] ?? ''))),
                    ':rut_supervisor' => strtoupper(trim((string)($row['rutSupervisor'] ?? ''))),
                    ':rut_administrador' => strtoupper(trim((string)($row['rutAdministrador'] ?? ''))),
                    ':jefatura' => strtoupper(trim((string)($row['jefatura'] ?? ''))),
                    ':estado' => trim((string)($row['estadoExcel'] ?? '')),
                    ':contrato' => trim((string)($row['contrato'] ?? $row['tipoContrato'] ?? '')),
                    ':anidamiento' => trim((string)($row['anidamiento'] ?? ''))
                ]);
            }

            if ($tablaDestino) {
                $stmtLog->execute([
                    ':archivo_nombre' => $payload['fileName'] ?? 'dotacion.xlsx',
                    ':hoja_nombre' => $hojaOrigen ?: 'SIN_HOJA',
                    ':tabla_destino' => $tablaDestino,
                    ':registros_procesados' => 1,
                    ':registros_insertados' => 1,
                    ':registros_actualizados' => 0,
                    ':observacion' => 'Carga automatica de dotacion'
                ]);
            }
            $registrosProcesados++;
        }

    } else if ($type === 'errores') {
        $stmt = $db->prepare("
            INSERT IGNORE INTO tbl_errores_ingesta (
                id_reporte, categoria, fecha_origen, n_ot, 
                rut_cliente, nombre_ejecutivo, rut_ejecutivo, nombre_supervisor,
                estado_origen, observacion_cruda, tipificacion, campos_especificos
            ) VALUES (
                :id, :cat, :fecha, :ot, 
                :rutcli, :nomej, :rutej, :nomsup, 
                :estorg, :obs, :tip, :json
            )
        ");

        foreach ($data as $row) {
            $id = $row['id'];
            $categoria = $row['categoria'];
            $fecha_sql = date('Y-m-d H:i:s'); 
            if (!empty($row['fecha'])) {
                $mES = ["ene"=>"01","feb"=>"02","mar"=>"03","abr"=>"04","may"=>"05","jun"=>"06",
                        "jul"=>"07","ago"=>"08","sep"=>"09","oct"=>"10","nov"=>"11","dic"=>"12"];
                $parts = explode(' ', strtolower(trim($row['fecha'])));
                if(count($parts) >= 3) {
                    $d = str_pad($parts[0], 2, '0', STR_PAD_LEFT);
                    $m = isset($mES[$parts[1]]) ? $mES[$parts[1]] : '01';
                    $y = $parts[2];
                    $fecha_sql = "$y-$m-$d 00:00:00"; 
                } else if (preg_match('/^\d{4}-\d{2}-\d{2}/', $row['fecha'])) {
                    $fecha_sql = $row['fecha'];
                }
            }

            $rutEjecutivo = $row['rutEjecutivo'] ?? null;
            $supervisor = $row['supervisor'] ?? null;
            $ejecutivoNom = $row['ejecutivo'] ?? null;

            if (empty($supervisor)) {
                $qSup = null;
                if (!empty($rutEjecutivo)) {
                    $rutBase = preg_replace('/[^0-9Kk]/', '', $rutEjecutivo);
                    if (strlen($rutBase) > 2) {
                        $search = substr($rutBase, 0, -1);
                        $qSup = $db->prepare("SELECT supervisor_asignado FROM tbl_dotacion WHERE REPLACE(REPLACE(rut, '-', ''), '.', '') LIKE ? LIMIT 1");
                        $qSup->execute(["%$search%"]);
                    }
                } 
                if (empty($supervisor) && !$qSup && !empty($ejecutivoNom)) {
                    $qSup = $db->prepare("SELECT supervisor_asignado FROM tbl_dotacion WHERE nombre_completo LIKE ? LIMIT 1");
                    $qSup->execute(["%" . $ejecutivoNom . "%"]);
                }

                if ($qSup) {
                    $supData = $qSup->fetch();
                    if ($supData && !empty($supData['supervisor_asignado'])) {
                        $supervisor = $supData['supervisor_asignado'];
                    }
                }
            }

            $jsonPayload = array_diff_key($row, array_flip(['id','categoria','fecha','ot','rut','rutCliente', 'ejecutivo', 'rutEjecutivo', 'supervisor', 'estado', 'observacion', 'tipificacion', 'agendamientoEstado']));

            $stmt->execute([
                ':id' => $id,
                ':cat' => $categoria,
                ':fecha' => $fecha_sql,
                ':ot' => $row['ot'] ?? null,
                ':rutcli' => $row['rutCliente'] ?? $row['rut'] ?? null,
                ':nomej' => $ejecutivoNom,
                ':rutej' => $rutEjecutivo,
                ':nomsup' => $supervisor,
                ':estorg' => $row['agendamientoEstado'] ?? null,
                ':obs' => $row['observacion'] ?? null,
                ':tip' => $row['tipificacion'] ?? null,
                ':json' => json_encode($jsonPayload, JSON_UNESCAPED_UNICODE)
            ]);
            $registrosProcesados++;
        }
    }

    $db->commit();
    echo json_encode(["status" => "success", "inserted" => $registrosProcesados]);

} catch (Exception $e) {
    if ($db->inTransaction()) {
        $db->rollBack();
    }
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Fallo escribiendo en la BD", "details" => $e->getMessage()]);
}
?>
