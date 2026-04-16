<?php
header('Content-Type: application/json; charset=utf-8');
require_once 'config.php';

$action = $_GET['action'] ?? null;

try {
    $pdo = Database::conectar();

    // ===============================
    // LISTADO DE AGENDAMIENTOS
    // ===============================
    if ($action === 'get_all_errors') {

        $supervisor = trim($_GET['supervisor'] ?? '');
        $estado     = strtoupper(trim($_GET['estado'] ?? 'RECHAZADO'));

        if ($supervisor === '') {
            echo json_encode([]);
            exit;
        }

        // 🔑 FILTRO POR ESTADO REAL
        if ($estado === 'RECHAZADO') {
            $whereEstado = "AND a.estado = 'RECHAZADO'";
        } elseif ($estado === 'HISTORICO') {
            $whereEstado = "AND a.estado IN ('EJECUTADO','EJECUTADOCONLLAMADO')";
        } else {
            // fallback seguro
            $whereEstado = "AND a.estado = 'RECHAZADO'";
        }

        /**
         * MEJORA: Cruce dinámico con tbl_dotacion_fusion
         * 1. Limpiamos el RUT de dotación (quitamos puntos, guiones y DV) para comparar con id_usuario.
         * 2. El filtro de supervisor ahora busca tanto en la tabla original como en la dotación resuelta.
         */
        $sql = "
            SELECT
                a.id,
                a.rut_cliente        AS rut,
                a.nombre_contacto    AS cliente,
                COALESCE(df.nombre, a.usuario_crea) AS ejecutivo,
                COALESCE(df.supervisor, a.supervisor) AS supervisor,
                a.estado             AS agendamientoEstado,
                a.fecha_agendamiento AS fecha,
                a.observaciones      AS error,
                a.timestamp_creacion
            FROM tbl_agendamientos a
            LEFT JOIN tbl_dotacion_fusion df
                ON a.id_usuario IS NOT NULL 
                AND a.id_usuario <> ''
                AND (
                    -- Caso A: id_usuario (sin DV) vs rut de dotación (limpiado de basura y quitando el último caracter si es DV)
                    -- Usamos REGEXP_REPLACE para dejar solo números y 'k'
                    -- Luego comparamos si el id_usuario coincide con el inicio del RUT de dotación
                    REGEXP_REPLACE(LOWER(df.rut), '[^0-9k]', '') LIKE CONCAT(a.id_usuario, '%')
                )
            WHERE (
                UPPER(TRIM(a.supervisor)) = UPPER(TRIM(?))
                OR 
                UPPER(TRIM(df.supervisor)) = UPPER(TRIM(?))
            )
            {$whereEstado}
            ORDER BY a.fecha_agendamiento DESC
            LIMIT 1000
        ";

        $stmt = $pdo->prepare($sql);
        $stmt->execute([$supervisor, $supervisor]);

        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
        exit;
    }

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'error' => $e->getMessage()
    ]);
}
?>
