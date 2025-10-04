#!/bin/bash

# Script para configurar el cron job que recolecta estadísticas de jugadores
# Este script debe ejecutarse en el servidor de producción

echo "=========================================="
echo "Configuración de Cron Job para Rankings"
echo "=========================================="
echo ""

# Detectar la ruta del proyecto
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
API_PATH="$SCRIPT_DIR/api/rankings/collect-stats.php"

echo "Ruta del script: $API_PATH"
echo ""

# Crear el cron job (se ejecuta cada 5 minutos)
CRON_JOB="*/5 * * * * /usr/bin/php $API_PATH >> /var/log/ranking-stats.log 2>&1"

echo "Cron job a agregar:"
echo "$CRON_JOB"
echo ""

# Verificar si el cron job ya existe
if crontab -l 2>/dev/null | grep -q "collect-stats.php"; then
    echo "⚠️  El cron job ya existe. Eliminando versión anterior..."
    crontab -l 2>/dev/null | grep -v "collect-stats.php" | crontab -
fi

# Agregar el nuevo cron job
(crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -

echo "✓ Cron job agregado exitosamente!"
echo ""
echo "El sistema recolectará estadísticas automáticamente cada 5 minutos."
echo ""
echo "Para verificar: crontab -l"
echo "Para ver logs: tail -f /var/log/ranking-stats.log"
echo ""
echo "=========================================="
