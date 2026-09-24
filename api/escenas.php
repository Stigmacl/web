<?php
// api/escenas.php
// Detecta fotos o videos propios en assets/img/ para reemplazar o enriquecer
// las escenas del teatro. Nombres admitidos: fachada, escenario, humo
// (extensiones jpg, jpeg, png, webp, mp4, webm). Si no existen, el escenario
// usa su ilustración animada propia.
require_once __DIR__ . '/config.php';

$slots = ['fachada', 'escenario', 'humo'];
$extensiones = ['mp4', 'webm', 'webp', 'jpg', 'jpeg', 'png'];
$videos = ['mp4', 'webm'];
$base = dirname(__DIR__) . '/assets/img/';

$escenas = [];
foreach ($slots as $slot) {
    $escenas[$slot] = null;
    foreach ($extensiones as $ext) {
        $archivo = $base . $slot . '.' . $ext;
        if (is_file($archivo)) {
            $escenas[$slot] = [
                'url' => 'assets/img/' . $slot . '.' . $ext . '?v=' . filemtime($archivo),
                'video' => in_array($ext, $videos, true),
            ];
            break;
        }
    }
}

json_response(['status' => 'ok', 'escenas' => $escenas]);
