# Subasta 360

Web todo-en-uno para la subasta: portada, "cómo funciona", reglas, ruleta de
premios con cronómetro y reveal del ganador — navegable con las flechas del
teclado, sin alternar entre Canva/Wooclap/PowerPoint. Pensada para compartir
pantalla por Teams o proyectar a una TV.

## Requisitos

- PHP 7.4+ (viene con XAMPP). No necesita MySQL: los premios y la
  configuración del evento se guardan en `api/data/*.json`.

## Correr en local

Con XAMPP: copiá esta carpeta a `htdocs/subasta360` y entrá a
`http://localhost/subasta360/index.html`.

Sin XAMPP, con el PHP embebido (más rápido para probar):

```bash
php -S localhost:8000
```

y abrí `http://localhost:8000/index.html`.

## Uso durante el evento

1. Antes de empezar, abrí `login.html` en esa misma pestaña/PC y entrá con
   la contraseña de admin (por defecto: `subasta360` — cambiarla, ver abajo).
2. Cargá los premios desde el **panel admin** (`admin.html`): nombre, color,
   ícono, peso (probabilidad) y stock (-1 = ilimitado).
3. Ajustá el título/subtítulo del evento y la fecha/hora objetivo del
   cronómetro también desde el panel admin.
4. Abrí `index.html`, apretá el ícono de pantalla completa (o tecla `F`) y
   compartí esa ventana por Teams / proyectala.
5. Navegá los slides con las flechas `←` `→` del teclado (o los botones de
   abajo). En el slide de la ruleta, el botón "Girar la ruleta" solo
   funciona si esa pestaña ya inició sesión como admin (paso 1).

## Cambiar la contraseña de admin

Generá un hash nuevo y pegalo en `api/config.php` (constante
`ADMIN_PASSWORD_HASH`):

```bash
php -r 'echo password_hash("tu_clave_nueva", PASSWORD_DEFAULT);'
```

## Estructura

- `index.html` + `js/stage.js` + `css/stage.css` — pantalla principal (proyector).
- `admin.html` + `js/admin.js` — panel para cargar premios y configurar el evento.
- `login.html` + `js/login.js` — acceso admin.
- `api/*.php` — backend PHP (sesión, premios, ruleta, evento, historial).
- `api/data/*.json` — datos persistidos (protegidos de acceso directo vía
  `api/data/.htaccess`; funciona en Apache/XAMPP, no con `php -S`).
