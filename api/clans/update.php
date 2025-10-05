<?php
require_once '../config/database.php';

startSecureSession();

if (!isset($_SESSION['user_id'])) {
    errorResponse('No autorizado', 401);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    errorResponse('Método no permitido', 405);
}

$data = getJsonInput();

if (!isset($data['id'])) {
    errorResponse('ID de clan requerido');
}

try {
    $database = new Database();
    $db = $database->getConnection();

    // Verificar que el clan existe y obtener información actual
    $clanQuery = "SELECT id, name, tag, leader_id FROM clans WHERE id = :id";
    $clanStmt = $db->prepare($clanQuery);
    $clanStmt->bindParam(':id', $data['id']);
    $clanStmt->execute();
    $clan = $clanStmt->fetch();

    if (!$clan) {
        errorResponse('Clan no encontrado', 404);
    }

    // Verificar permisos del usuario actual
    $userQuery = "SELECT role FROM users WHERE id = :id";
    $userStmt = $db->prepare($userQuery);
    $userStmt->bindParam(':id', $_SESSION['user_id']);
    $userStmt->execute();
    $currentUser = $userStmt->fetch();

    if (!$currentUser) {
        errorResponse('Usuario no encontrado', 404);
    }

    $isAdmin = $currentUser['role'] === 'admin';
    $isLeader = $clan['leader_id'] == $_SESSION['user_id'];

    // Verificar permisos: debe ser admin o líder del clan
    if (!$isAdmin && !$isLeader) {
        errorResponse('No tienes permisos para editar este clan', 403);
    }

    // Construir query de actualización dinámicamente
    $updateFields = [];
    $params = [':id' => $data['id']];

    // Validar y procesar nombre del clan
    if (isset($data['name'])) {
        $name = trim($data['name']);
        if (empty($name)) {
            errorResponse('El nombre del clan no puede estar vacío');
        }
        if (strlen($name) < 3) {
            errorResponse('El nombre del clan debe tener al menos 3 caracteres');
        }
        if (strlen($name) > 100) {
            errorResponse('El nombre del clan no puede exceder 100 caracteres');
        }

        // Verificar que el nombre no esté en uso por otro clan
        $nameCheckQuery = "SELECT id FROM clans WHERE name = :name AND id != :id";
        $nameCheckStmt = $db->prepare($nameCheckQuery);
        $nameCheckStmt->bindParam(':name', $name);
        $nameCheckStmt->bindParam(':id', $data['id']);
        $nameCheckStmt->execute();

        if ($nameCheckStmt->fetch()) {
            errorResponse('El nombre del clan ya está en uso por otro clan');
        }

        $updateFields[] = "name = :name";
        $params[':name'] = $name;
    }

    // Validar y procesar tag del clan
    if (isset($data['tag'])) {
        $tag = strtoupper(trim($data['tag']));
        if (empty($tag)) {
            errorResponse('El tag del clan no puede estar vacío');
        }
        if (strlen($tag) < 2) {
            errorResponse('El tag del clan debe tener al menos 2 caracteres');
        }
        if (strlen($tag) > 8) {
            errorResponse('El tag del clan no puede exceder 8 caracteres');
        }
        if (!preg_match('/^[A-Z0-9]+$/', $tag)) {
            errorResponse('El tag del clan solo puede contener letras mayúsculas y números');
        }

        // Verificar que el tag no esté en uso por otro clan
        $tagCheckQuery = "SELECT id FROM clans WHERE tag = :tag AND id != :id";
        $tagCheckStmt = $db->prepare($tagCheckQuery);
        $tagCheckStmt->bindParam(':tag', $tag);
        $tagCheckStmt->bindParam(':id', $data['id']);
        $tagCheckStmt->execute();

        if ($tagCheckStmt->fetch()) {
            errorResponse('El tag del clan ya está en uso por otro clan');
        }

        $updateFields[] = "tag = :tag";
        $params[':tag'] = $tag;
        
        // Si se cambia el tag, actualizar también en la tabla users
        $oldTag = $clan['tag'];
        if ($tag !== $oldTag) {
            $updateUsersQuery = "UPDATE users SET clan = :new_tag WHERE clan = :old_tag";
            $updateUsersStmt = $db->prepare($updateUsersQuery);
            $updateUsersStmt->bindParam(':new_tag', $tag);
            $updateUsersStmt->bindParam(':old_tag', $oldTag);
            $updateUsersStmt->execute();
        }
    }

    // Validar y procesar descripción
    if (isset($data['description'])) {
        $description = trim($data['description']);
        if (strlen($description) > 1000) {
            errorResponse('La descripción no puede exceder 1000 caracteres');
        }

        $updateFields[] = "description = :description";
        $params[':description'] = $description;
    }

    // Validar y procesar icono
    if (isset($data['icon'])) {
        $validIcons = ['crown', 'sword', 'shield', 'star', 'zap', 'target'];
        if (!in_array($data['icon'], $validIcons)) {
            errorResponse('Icono de clan inválido');
        }

        $updateFields[] = "icon = :icon";
        $params[':icon'] = $data['icon'];
    }

    // Validar y procesar logo
    if (isset($data['logo'])) {
        $logo = trim($data['logo']);
        if (!empty($logo)) {
            if (!filter_var($logo, FILTER_VALIDATE_URL)) {
                errorResponse('La URL del logo no es válida');
            }
            if (strlen($logo) > 500) {
                errorResponse('La URL del logo es demasiado larga');
            }
        }

        $updateFields[] = "logo = :logo";
        $params[':logo'] = $logo;
    }

    // Cambio de líder - solo admins pueden hacer esto
    if (isset($data['leaderId']) && $isAdmin) {
        $newLeaderId = $data['leaderId'];
        
        if (!empty($newLeaderId)) {
            // Verificar que el nuevo líder existe y está activo
            $leaderCheckQuery = "SELECT id, username, clan FROM users WHERE id = :id AND is_active = 1";
            $leaderCheckStmt = $db->prepare($leaderCheckQuery);
            $leaderCheckStmt->bindParam(':id', $newLeaderId);
            $leaderCheckStmt->execute();
            $newLeader = $leaderCheckStmt->fetch();

            if (!$newLeader) {
                errorResponse('El usuario seleccionado como líder no existe o no está activo');
            }

            // Verificar que el nuevo líder pertenece al clan
            if ($newLeader['clan'] !== $clan['tag']) {
                errorResponse('El nuevo líder debe ser miembro del clan');
            }

            $updateFields[] = "leader_id = :leader_id";
            $params[':leader_id'] = $newLeaderId;
        } else {
            // Remover líder
            $updateFields[] = "leader_id = NULL";
        }
    }

    // Verificar que hay campos para actualizar
    if (empty($updateFields)) {
        errorResponse('No hay campos para actualizar');
    }

    // Ejecutar la actualización
    $query = "UPDATE clans SET " . implode(', ', $updateFields) . ", updated_at = CURRENT_TIMESTAMP WHERE id = :id";
    $stmt = $db->prepare($query);
    
    foreach ($params as $key => $value) {
        $stmt->bindValue($key, $value);
    }
    
    if (!$stmt->execute()) {
        $errorInfo = $stmt->errorInfo();
        error_log("Error SQL en update clan: " . print_r($errorInfo, true));
        errorResponse('Error al actualizar el clan en la base de datos', 500);
    }

    // Log de la acción para auditoría
    error_log("Clan actualizado - ID: {$data['id']}, Usuario: {$_SESSION['user_id']}, Campos: " . implode(', ', array_keys($updateFields)));

    jsonResponse([
        'success' => true,
        'message' => 'Clan actualizado exitosamente',
        'updated_fields' => array_keys($updateFields)
    ]);

} catch (PDOException $e) {
    error_log("Error PDO en update clan: " . $e->getMessage());
    
    // Manejar errores específicos de base de datos
    if ($e->getCode() == '23000') {
        if (strpos($e->getMessage(), 'name') !== false) {
            errorResponse('El nombre del clan ya está en uso');
        } elseif (strpos($e->getMessage(), 'tag') !== false) {
            errorResponse('El tag del clan ya está en uso');
        } else {
            errorResponse('Violación de restricción de base de datos');
        }
    } else {
        errorResponse('Error de base de datos', 500);
    }
} catch (Exception $e) {
    error_log("Error general en update clan: " . $e->getMessage());
    errorResponse('Error interno del servidor', 500);
}
?>