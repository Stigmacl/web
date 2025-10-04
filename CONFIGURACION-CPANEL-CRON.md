# Configuración de Cron Job en cPanel (Sin SSH)

## 📋 Guía Paso a Paso para cPanel

### Paso 1: Acceder a Cron Jobs en cPanel

1. Inicia sesión en tu **cPanel**
2. Busca la sección **"Avanzado"** o **"Advanced"**
3. Haz clic en **"Cron Jobs"** o **"Tareas Cron"**

### Paso 2: Configurar el Cron Job

En la sección "Add New Cron Job" o "Agregar Nueva Tarea Cron":

#### Configuración Común (Common Settings):
- Selecciona: **"Every 2 Minutes"** o **"Cada 2 Minutos"**

Si no existe esa opción, configura manualmente:

#### Configuración Manual:
```
Minuto:   */2
Hora:     *
Día:      *
Mes:      *
Día Sem:  *
```

#### Comando (Command):
```bash
/usr/bin/php /home/TUUSUARIO/domains/api.lcto.cl/public_html/api/rankings/collect-stats.php
```

**IMPORTANTE:** Reemplaza `TUUSUARIO` con tu nombre de usuario de cPanel.

### Paso 3: Encontrar la Ruta Correcta

Si no sabes tu ruta exacta, puedes crear un archivo PHP temporal para averiguarla:

**Crear archivo:** `mostrar-ruta.php`
```php
<?php
echo __DIR__;
?>
```

Súbelo a tu carpeta `public_html` y ábrelo en el navegador:
`https://api.lcto.cl/mostrar-ruta.php`

Te mostrará la ruta completa. Luego agrégale `/api/rankings/collect-stats.php`

### Paso 4: Opciones de Comando Alternativas

Si el comando anterior no funciona, prueba estas alternativas:

**Opción A (Ruta completa de PHP):**
```bash
/usr/local/bin/php /home/TUUSUARIO/domains/api.lcto.cl/public_html/api/rankings/collect-stats.php
```

**Opción B (Con redirección a logs):**
```bash
/usr/bin/php /home/TUUSUARIO/domains/api.lcto.cl/public_html/api/rankings/collect-stats.php >> /home/TUUSUARIO/logs/ranking-stats.log 2>&1
```

**Opción C (Usando wget/curl):**
```bash
wget -q -O /dev/null https://api.lcto.cl/api/rankings/collect-stats.php
```

o

```bash
curl -s https://api.lcto.cl/api/rankings/collect-stats.php > /dev/null
```

### Paso 5: Configurar Email de Notificaciones (Opcional)

En la parte superior de la página de Cron Jobs:

**"Cron Email"** o **"Email de Cron":**
- Ingresa tu email si quieres recibir notificaciones
- Déjalo vacío si no quieres recibir emails cada 2 minutos

### Paso 6: Guardar

Haz clic en **"Add New Cron Job"** o **"Agregar Nueva Tarea Cron"**

## ✅ Verificación

### Verificar que el Cron se Creó:
Deberías ver tu nueva tarea cron en la lista de **"Current Cron Jobs"** o **"Tareas Cron Actuales"**

### Verificar que Funciona:
1. Espera 2-3 minutos
2. Ve a **phpMyAdmin** en cPanel
3. Selecciona tu base de datos
4. Ejecuta este query:
```sql
SELECT * FROM player_rankings ORDER BY last_seen DESC LIMIT 10;
```

Deberías ver jugadores con `last_seen` reciente.

### Verificar Snapshots:
```sql
SELECT * FROM ranking_snapshots ORDER BY snapshot_time DESC LIMIT 20;
```

Deberías ver nuevos registros cada 2 minutos.

## 🔧 Solución de Problemas

### El cron no ejecuta:

**1. Verificar la versión de PHP:**
En cPanel, ve a **"Select PHP Version"** y anota la ruta. Puede ser:
- `/usr/bin/php`
- `/usr/local/bin/php`
- `/opt/cpanel/ea-php80/root/usr/bin/php` (PHP 8.0)
- `/opt/cpanel/ea-php81/root/usr/bin/php` (PHP 8.1)

**2. Usar método HTTP (más confiable en cPanel):**
```bash
curl -s https://api.lcto.cl/api/rankings/collect-stats.php > /dev/null
```

**3. Verificar permisos del archivo:**
En el File Manager de cPanel:
- Navega a `api/rankings/collect-stats.php`
- Click derecho → Permissions
- Asegúrate que tenga permisos de lectura (644 o 755)

### Alternativa: Usar un Servicio Externo de Cron

Si el cron de cPanel no funciona, puedes usar un servicio gratuito:

**EasyCron (https://www.easycron.com/)**
1. Crea una cuenta gratuita
2. Agrega un nuevo cron job
3. URL: `https://api.lcto.cl/api/rankings/collect-stats.php`
4. Frecuencia: Cada 2 minutos
5. Guarda

**Cron-Job.org (https://cron-job.org/)**
1. Crea una cuenta gratuita
2. Agrega un nuevo cron job
3. URL: `https://api.lcto.cl/api/rankings/collect-stats.php`
4. Intervalo: `*/2 * * * *`
5. Activa el job

## 📊 Monitoreo

### Ver actividad reciente:
```sql
-- Ver últimas actualizaciones
SELECT player_name, total_kills, total_deaths, kd_ratio, games_played, last_seen
FROM player_rankings
WHERE last_seen > DATE_SUB(NOW(), INTERVAL 10 MINUTE)
ORDER BY last_seen DESC;

-- Contar snapshots de hoy
SELECT COUNT(*) as snapshots_hoy
FROM ranking_snapshots
WHERE DATE(snapshot_time) = CURDATE();

-- Ver actividad por hora
SELECT HOUR(snapshot_time) as hora, COUNT(*) as capturas
FROM ranking_snapshots
WHERE DATE(snapshot_time) = CURDATE()
GROUP BY HOUR(snapshot_time)
ORDER BY hora;
```

## 🎯 Resultado Final

Una vez configurado correctamente:
- ✅ El sistema recolectará stats cada 2 minutos
- ✅ Los datos se acumularán permanentemente
- ✅ El ranking en tu web se actualizará automáticamente
- ✅ Los jugadores verán su progreso acumulado

## 📸 Ejemplo Visual de Configuración en cPanel

```
┌─────────────────────────────────────────────────────┐
│ Add New Cron Job                                    │
├─────────────────────────────────────────────────────┤
│                                                     │
│ Common Settings: [Every 2 Minutes ▼]               │
│                                                     │
│ Or configure manually:                             │
│ Minute:  */2                                       │
│ Hour:    *                                         │
│ Day:     *                                         │
│ Month:   *                                         │
│ Weekday: *                                         │
│                                                     │
│ Command:                                           │
│ [curl -s https://api.lcto.cl/api/rankings/       │
│  collect-stats.php > /dev/null                    │]│
│                                                     │
│            [ Add New Cron Job ]                    │
└─────────────────────────────────────────────────────┘
```

## ✨ Recomendación Final

Para cPanel, la opción **más confiable** es usar `curl` o `wget`:

```bash
curl -s https://api.lcto.cl/api/rankings/collect-stats.php > /dev/null
```

Esto hace una petición HTTP al script cada 2 minutos, simulando como si alguien visitara la página.
