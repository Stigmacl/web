# Guía de Configuración: Sistema de Ranking Automático

## 📋 Resumen
El sistema de ranking recopila automáticamente estadísticas de los servidores cada 2 minutos y las almacena permanentemente en la base de datos MySQL.

## ✅ Estado Actual
- ✓ El código PHP funciona correctamente
- ✓ Los datos se están guardando en la base de datos
- ✓ Las tablas están definidas correctamente
- ⚠️ Falta configurar la ejecución automática (cron job)

## 🔧 Pasos de Instalación

### Paso 1: Crear las Tablas en la Base de Datos

Ejecuta el siguiente SQL en tu base de datos MySQL:

```bash
mysql -u tu_usuario -p tu_base_de_datos < create-ranking-tables.sql
```

O accede a phpMyAdmin y ejecuta el contenido del archivo `create-ranking-tables.sql`

**Esto creará 2 tablas:**
- `player_rankings` - Rankings acumulados de jugadores
- `ranking_snapshots` - Historial de todas las capturas de datos

### Paso 2: Verificar que las Tablas Existan

```sql
SHOW TABLES LIKE 'player_rankings';
SHOW TABLES LIKE 'ranking_snapshots';
```

### Paso 3: Configurar el Cron Job (Ejecución Automática)

**Opción A: Usar el script automático**

```bash
chmod +x setup-ranking-cron.sh
./setup-ranking-cron.sh
```

**Opción B: Configurar manualmente**

```bash
crontab -e
```

Agrega esta línea (reemplaza la ruta con la correcta de tu servidor):

```
*/2 * * * * /usr/bin/php /ruta/completa/a/tu/proyecto/api/rankings/collect-stats.php >> /var/log/ranking-stats.log 2>&1
```

### Paso 4: Verificar que el Cron Job Esté Activo

```bash
crontab -l
```

Deberías ver la línea que agregaste.

### Paso 5: Monitorear los Logs

```bash
# Ver los últimos logs
tail -f /var/log/ranking-stats.log

# O verificar manualmente ejecutando:
php api/rankings/collect-stats.php
```

## 🎯 Cómo Funciona

### Recopilación de Datos
1. Cada 2 minutos, el cron ejecuta `collect-stats.php`
2. El script consulta los 4 servidores definidos:
   - 38.225.91.120:7777
   - 38.225.91.120:7755
   - 38.225.91.120:7788
   - 38.225.91.120:7744

3. Para cada servidor:
   - Obtiene la lista de jugadores activos
   - Extrae: nombre, kills (frags), deaths, score, ping, team
   - Guarda un snapshot en `ranking_snapshots`
   - Actualiza los totales acumulados en `player_rankings`

### Acumulación de Estadísticas
- **Primera vez**: Se crea un nuevo registro con los datos del jugador
- **Visitas posteriores**: Se suman los kills, deaths y score a los totales
- **K/D Ratio**: Se recalcula automáticamente
- **Games Played**: Incrementa cada vez que se ve al jugador

### Ejemplo de Datos

**Jugador en su 1ra partida:**
```
Kills: 15, Deaths: 8, Score: 1500
→ Total Kills: 15, Total Deaths: 8, K/D: 1.88, Games: 1
```

**Mismo jugador en su 2da partida:**
```
Kills: 20, Deaths: 10, Score: 2000
→ Total Kills: 35, Total Deaths: 18, K/D: 1.94, Games: 2
```

## 🔍 Verificación y Pruebas

### Probar Manualmente
```bash
# Ejecutar recolección manual
php api/rankings/collect-stats.php

# Debería retornar algo como:
# {"success":true,"message":"Stats collection completed","total_updates":5,...}
```

### Verificar Datos en la Base de Datos
```sql
-- Ver todos los rankings
SELECT * FROM player_rankings ORDER BY kd_ratio DESC LIMIT 10;

-- Ver snapshots recientes
SELECT * FROM ranking_snapshots
ORDER BY snapshot_time DESC
LIMIT 20;

-- Contar jugadores registrados
SELECT COUNT(*) as total_players FROM player_rankings;

-- Ver actividad por servidor
SELECT server_ip, server_port, COUNT(*) as players
FROM player_rankings
GROUP BY server_ip, server_port;
```

## 📊 Visualización en la Web

La página de Ranking (`/ranking`) muestra automáticamente:
- Top 3 jugadores destacados
- Tabla completa ordenable por K/D, Kills o Score
- Filtro por servidor
- Actualización en tiempo real

**Los datos se actualizan automáticamente** sin necesidad de refrescar la página cada 2 minutos.

## ⚙️ Configuración Avanzada

### Cambiar la Frecuencia de Recopilación

Edita el cron job:
- Cada 1 minuto: `*/1 * * * *`
- Cada 5 minutos: `*/5 * * * *`
- Cada 10 minutos: `*/10 * * * *`

### Agregar Más Servidores

Edita `api/rankings/collect-stats.php` línea 139-144:

```php
$servers = [
    ['ip' => '38.225.91.120', 'port' => 7777],
    ['ip' => '38.225.91.120', 'port' => 7755],
    ['ip' => '38.225.91.120', 'port' => 7788],
    ['ip' => '38.225.91.120', 'port' => 7744],
    ['ip' => 'NUEVO_IP', 'port' => NUEVO_PUERTO], // Agregar aquí
];
```

También actualiza `src/components/Ranking.tsx` línea 24-29.

## 🐛 Solución de Problemas

### No se guardan datos
1. Verificar que las tablas existan: `SHOW TABLES;`
2. Verificar permisos de base de datos
3. Revisar logs: `tail -f /var/log/ranking-stats.log`
4. Ejecutar manualmente: `php api/rankings/collect-stats.php`

### Cron no ejecuta
1. Verificar que cron esté corriendo: `systemctl status cron`
2. Verificar la ruta de PHP: `which php`
3. Revisar permisos del archivo: `chmod +x api/rankings/collect-stats.php`

### Datos no aparecen en la web
1. Verificar que haya datos: `SELECT COUNT(*) FROM player_rankings;`
2. Abrir consola del navegador (F12) y ver errores
3. Verificar que la API responda: `curl https://api.lcto.cl/rankings`

## 📝 Notas Importantes

- Los datos son **permanentes** y se acumulan con el tiempo
- Los snapshots históricos permiten análisis detallados
- El sistema maneja correctamente jugadores sin actividad (0 kills, 0 deaths)
- Se filtran jugadores con nombre vacío automáticamente
- El K/D ratio se calcula correctamente (evitando división por cero)

## 🎮 ¡Listo!

Una vez configurado, el sistema funcionará automáticamente las 24/7, recopilando estadísticas cada 2 minutos y mostrándolas en tiempo real en tu sitio web.
