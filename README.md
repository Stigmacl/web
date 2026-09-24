# SUBASTA 360

**Plataforma de experiencias y eventos.**

SUBASTA 360 es la dinámica de reconocimiento donde el equipo canjea los
puntos que ganó durante el período evaluado (Cliente Incógnito, CAMPUSBE,
ECM, agendamientos, ausencias, atrasos, etc.) por premios, pujando en una
subasta en vivo.

Esta web es el "maestro de ceremonias" del evento: reemplaza el combo de
Canva + Wooclap + PowerPoint por **una sola pestaña** que se comparte por
Teams o se proyecta en una TV, sin abrir y cerrar ventanas. Incluye un panel
de administración para preparar todo sin tocar código.

## Correr en local

**Windows (doble clic):** abre **`Iniciar Subasta 360.cmd`**. Levanta el
servidor PHP y abre el escenario en el navegador. Requiere PHP en el PATH o
XAMPP en `C:\xampp`. Deja abierta la ventana "Subasta 360 - servidor" durante
el evento; cerrarla apaga el servidor.

**XAMPP:** copia la carpeta a `htdocs/subasta360` y entra a
`http://localhost/subasta360/index.html`.

**Manual (Mac / Linux / Windows):**

```bash
php -S localhost:8000
```

y abre `http://localhost:8000/index.html`.

Requisitos: PHP 7.4 o superior. No necesita MySQL, Node, npm ni internet:
las tipografías vienen incluidas y los datos se guardan en `api/data/*.json`.

## El escenario (`index.html`)

Una presentación de 7 etapas con transiciones circulares "360°":

| # | Etapa | Qué muestra |
|---|-------|-------------|
| 01 | Bienvenida | Emblema 360°, nombre del evento, texto de bienvenida y cuenta regresiva |
| 02 | Cómo funciona | Lo que suma y lo que resta puntaje |
| 03 | Premios | Tarjetas de cada premio con su stock |
| 04 | Preparación | Reglas de la subasta |
| 05 | Ruleta | Ruleta con luces, sonido, cronómetro y premios en juego |
| 06 | Ganador | Premio seleccionado → nombre del ganador, con celebración |
| 07 | Cierre | Agradecimiento, premios entregados y ganadores |

Flujo de cada ronda: **Ruleta → Ganador → "Siguiente premio" → Ruleta**.
El ganador se puede escribir antes de girar o después de la puja; queda
guardado en el historial.

Atajos (funcionan con presentadores inalámbricos):

| Tecla | Acción |
|-------|--------|
| `→` / `←` (o Av Pág / Re Pág) | Siguiente / anterior etapa |
| `Espacio` | Girar la ruleta |
| `F` | Pantalla completa (los controles se ocultan solos) |
| `M` | Activar / silenciar sonido |
| `1`–`7` | Ir directo a una etapa |

## Uso durante el evento

1. Entra a `login.html` (contraseña por defecto `subasta360`) y prepara el
   evento desde el **panel admin**: nombre, subtítulo, bienvenida, fecha,
   hora, estado y premios (ícono, color, peso y stock).
2. Abre el escenario **en el mismo navegador** (el botón "Abrir escenario"
   del panel). Solo una sesión admin puede girar la ruleta.
3. Presiona `F`, comparte esa ventana por Teams o proyéctala, y avanza con las
   flechas. Los cambios que hagas en el panel llegan al escenario en segundos.

## Panel de administración (`admin.html`)

- **Dashboard:** estado del evento, cuenta regresiva, premios, disponibles,
  entregados, estado de la ruleta, último ganador y actividad reciente.
- **Evento:** datos del evento con vista previa 16:9 en vivo.
- **Premios:** crear, editar y eliminar; stock rápido (−/+); peso con
  probabilidad calculada; ícono (set propio o emoji) y color.
- **Ruleta:** vista previa y distribución de probabilidad.
- **Historial:** todos los giros con fecha, premio y ganador.
- **Configuración:** acento visual (Aurora, Océano, Magenta, Solar), atajos
  y seguridad.

## Cambiar la contraseña de admin

Genera un hash nuevo y pégalo en `api/config.php` (constante
`ADMIN_PASSWORD_HASH`):

```bash
php -r "echo password_hash('tu_clave_nueva', PASSWORD_DEFAULT);"
```

## Estructura

```
Iniciar Subasta 360.cmd   Lanzador de doble clic (Windows)
index.html                Escenario del evento
admin.html                Panel de administración
login.html                Acceso admin
css/
  base.css                Sistema de diseño: tokens, marca y componentes
  effects.css             Aurora, grilla con haces, border beam, spotlight, shimmer
  stage.css               Escenario (escala proporcional 16:9)
  admin.css / login.css   Panel y acceso
js/
  api.js                  Cliente de la API
  icons.js                Íconos SVG de interfaz y premios
  ui.js                   Toasts, modales, confirmaciones y formateadores
  effects.js              Spotlight, meteoros, haces y contadores animados
  wheel.js                Motor de la ruleta (canvas)
  sound.js / confetti.js  Sonidos sintetizados y confeti
  stage.js / admin.js / login.js
api/
  config.php              Sesión, contraseña y helpers
  auth.php                Login / logout / estado
  evento.php              Configuración del evento
  premios.php             CRUD de premios
  spin.php                Giro: elige premio por peso, descuenta stock, registra
  historial.php           Historial y asignación de ganador
  data/*.json             Datos (protegidos vía .htaccess en Apache/XAMPP)
assets/
  fonts/                  Inter y Sora (licencia SIL OFL)
  img/favicon.svg
```

El resultado de cada giro lo decide el servidor (`api/spin.php`); el
navegador solo anima la ruleta hasta ese premio.
