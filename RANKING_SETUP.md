# Sistema de Ranking - Guía de Instalación

## Descripción del Sistema

El sistema de ranking recolecta automáticamente las estadísticas de los jugadores de los 4 servidores de Tactical Ops Chile y las almacena en una base de datos MySQL. Las estadísticas incluyen:

- Total de Kills (Frags)
- Total de Deaths (Muertes)
- Total de Score (Puntos)
- K/D Ratio (calculado automáticamente)
- Número de partidas jugadas
- Última vez visto

## Instalación

### Paso 1: Crear las Tablas de Base de Datos

Ejecuta el siguiente script SQL en tu base de datos MySQL:

```bash
mysql -u tu_usuario -p tu_base_de_datos < create-ranking-tables.sql
```

O ejecuta manualmente el contenido del archivo `create-ranking-tables.sql` en phpMyAdmin o tu cliente MySQL preferido.

### Paso 2: Configurar la Recolección Automática

El sistema incluye un script que recolecta automáticamente las estadísticas de todos los servidores cada 5 minutos.

#### Opción A: Usando Cron (Linux/Unix)

Ejecuta el script de configuración:

```bash
./setup-ranking-cron.sh
```

Este script configurará automáticamente un cron job que ejecuta la recolección cada 5 minutos.

#### Opción B: Configuración Manual

Agrega esta línea a tu crontab:

```bash
*/5 * * * * /usr/bin/php /ruta/a/tu/proyecto/api/rankings/collect-stats.php >> /var/log/ranking-stats.log 2>&1
```

Para editar el crontab:

```bash
crontab -e
```

### Paso 3: Verificar la Instalación

Puedes verificar manualmente que el sistema funciona ejecutando:

```bash
php api/rankings/collect-stats.php
```

O visitando la URL:

```
https://tudominio.com/api/rankings/collect-stats.php
```

## APIs Disponibles

### 1. Recolectar Estadísticas

**Endpoint:** `GET /api/rankings/collect-stats.php`

Recolecta las estadísticas actuales de todos los servidores y las almacena en la base de datos.

**Respuesta:**
```json
{
  "success": true,
  "message": "Stats collection completed",
  "total_updates": 15,
  "timestamp": "2025-10-04 14:30:00",
  "results": [
    {
      "server": "38.225.91.120:7777",
      "status": "success",
      "updated": 8,
      "players": 8
    }
  ]
}
```

### 2. Obtener Rankings

**Endpoint:** `GET /api/rankings/get-rankings.php`

Obtiene el ranking de jugadores.

**Parámetros:**
- `server_ip` (opcional): Filtrar por IP del servidor
- `server_port` (opcional): Filtrar por puerto del servidor
- `order_by` (opcional): Ordenar por `kd_ratio`, `total_kills`, `total_score`, o `games_played` (default: `kd_ratio`)
- `limit` (opcional): Número máximo de resultados (default: 100)

**Ejemplo:**
```
GET /api/rankings/get-rankings.php?server_ip=38.225.91.120&server_port=7777&order_by=kd_ratio&limit=50
```

**Respuesta:**
```json
{
  "success": true,
  "rankings": [
    {
      "rank": 1,
      "playerName": "Player1",
      "serverIp": "38.225.91.120",
      "serverPort": 7777,
      "totalKills": 150,
      "totalDeaths": 50,
      "totalScore": 3000,
      "kdRatio": 3.00,
      "gamesPlayed": 25,
      "lastSeen": "2025-10-04 14:25:00",
      "createdAt": "2025-10-01 10:00:00"
    }
  ],
  "server_ip": "38.225.91.120",
  "server_port": 7777,
  "order_by": "kd_ratio"
}
```

### 3. Actualizar Stats Manualmente (POST)

**Endpoint:** `POST /api/rankings/update-stats.php`

Permite actualizar las estadísticas de jugadores manualmente.

**Body:**
```json
{
  "server_ip": "38.225.91.120",
  "server_port": 7777,
  "players": [
    {
      "name": "Player1",
      "frags": 10,
      "deaths": 5,
      "score": 250,
      "ping": 50,
      "team": 1
    }
  ]
}
```

## Interfaz de Usuario

El componente `Ranking.tsx` muestra los rankings con las siguientes características:

- Selector de servidor (4 servidores disponibles)
- Filtros de ordenamiento (K/D Ratio, Total Kills, Total Score)
- Podio destacado para los 3 primeros lugares
- Tabla completa con todos los jugadores
- Actualización manual con botón de refresh
- Indicador de última actualización

## Mantenimiento

### Ver Logs

```bash
tail -f /var/log/ranking-stats.log
```

### Limpiar Datos Antiguos

Para limpiar snapshots antiguos (más de 30 días):

```sql
DELETE FROM ranking_snapshots WHERE snapshot_time < DATE_SUB(NOW(), INTERVAL 30 DAY);
```

### Resetear Rankings

Para resetear todos los rankings:

```sql
TRUNCATE TABLE player_rankings;
TRUNCATE TABLE ranking_snapshots;
```

## Troubleshooting

### El cron no se ejecuta

Verifica que el cron esté configurado:
```bash
crontab -l
```

Verifica los permisos del archivo PHP:
```bash
chmod 644 api/rankings/collect-stats.php
```

### No se actualizan las estadísticas

Verifica que la API externa esté funcionando:
```bash
curl "https://api.lcto.cl/players?ip=38.225.91.120&port=7777&timeOut=12"
```

Verifica los logs del servidor web y de MySQL.

### Problemas de conexión a la base de datos

Verifica la configuración en `api/config/database.php` y que las credenciales sean correctas.

## Servidores Monitoreados

1. Servidor Principal - 38.225.91.120:7777
2. Servidor #2 - 38.225.91.120:7755
3. Servidor #3 - 38.225.91.120:7788
4. Servidor #4 - 38.225.91.120:7744

## Notas Importantes

- El sistema acumula estadísticas cada vez que se ejecuta la recolección
- Si un jugador está en el servidor con 10 kills y en la próxima recolección tiene 15 kills, se sumarán 15 kills más a su total
- El K/D ratio se recalcula automáticamente en cada actualización
- Los datos históricos se mantienen en la tabla `ranking_snapshots` para futuros análisis
