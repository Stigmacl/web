# Guía de Diagnóstico para Problemas en cPanel

## Problema
- Las operaciones funcionan en localhost (XAMPP) pero no en cPanel
- No se pueden crear noticias, editar noticias, ni registrar usuarios

## Archivos Actualizados
1. **api/config/database.php** - Credenciales de cPanel configuradas
2. **api/.htaccess** - CORS habilitado para producción
3. **api/test-connection.php** - Script de diagnóstico (NUEVO)
4. **api/news/create.php** - Manejo de errores mejorado
5. **api/news/update.php** - Manejo de errores mejorado
6. **api/auth/register.php** - Manejo de errores mejorado

## Pasos para Diagnosticar

### 1. Ejecutar Test de Conexión
Sube todos los archivos y accede a:
```
https://tu-dominio.com/api/test-connection.php
```

Este script te mostrará:
- ✅ Conexión a la base de datos
- ✅ Tablas existentes
- ✅ Estructura de la tabla news
- ✅ Cantidad de usuarios
- ✅ Estado de las sesiones
- ✅ Permisos de archivos
- ✅ Extensiones PHP cargadas

### 2. Verificar Credenciales de Base de Datos
En cPanel → phpMyAdmin, verifica:
- Nombre de la base de datos: `tactica2_tactical_ops_chile`
- Usuario: `tactica2_root`
- Contraseña: `Trini3915..`
- Host: `localhost`

Si son diferentes, edita `api/config/database.php` líneas 22-25.

### 3. Verificar Permisos en cPanel
En el File Manager de cPanel:
- Carpeta `api/`: **755**
- Archivos `.php`: **644**
- Carpeta `api/uploads/`: **755** (si existe)

### 4. Habilitar Logs de Error
Crea o edita el archivo `php.ini` en la carpeta raíz:
```ini
display_errors = Off
log_errors = On
error_log = error_log.txt
```

Luego revisa el archivo `error_log.txt` después de intentar crear una noticia.

### 5. Verificar la Consola del Navegador
1. Abre la página en tu navegador
2. Presiona F12 para abrir DevTools
3. Ve a la pestaña **Console**
4. Intenta crear una noticia
5. Busca errores en rojo (especialmente errores CORS o 500)

### 6. Verificar Network en DevTools
1. Ve a la pestaña **Network** en DevTools
2. Intenta crear una noticia
3. Busca la petición a `api/news/create.php`
4. Haz clic en ella y revisa:
   - **Status**: ¿Es 200, 400, 500?
   - **Response**: ¿Qué mensaje de error muestra?
   - **Headers**: ¿Los headers CORS están presentes?

### 7. Problemas Comunes y Soluciones

#### A. Error CORS
**Síntoma**: Console muestra "CORS policy blocked"
**Solución**:
- Verifica que `.htaccess` permite CORS
- Si el problema persiste, renombra `.htaccess.backup` a `.htaccess`

#### B. Error 500 - Internal Server Error
**Síntoma**: Status 500 en las peticiones
**Solución**:
- Revisa el archivo `error_log.txt` en cPanel
- Los errores ahora muestran detalles específicos
- Puede ser un problema de sintaxis en `.htaccess`

#### C. Sesiones no Funcionan
**Síntoma**: Se registra pero no aparece como logueado
**Solución**:
- Verifica que la carpeta de sesiones tiene permisos de escritura
- En cPanel → PHP Options, verifica `session.save_path`
- Puede que necesites crear: `mkdir -p ~/tmp && chmod 777 ~/tmp`

#### D. Base de Datos No Se Actualiza
**Síntoma**: No hay errores pero los datos no se guardan
**Solución**:
- Verifica que el usuario de BD tiene permisos de INSERT/UPDATE
- En cPanel → MySQL Databases → verifica privilegios del usuario
- El usuario debe tener: SELECT, INSERT, UPDATE, DELETE

#### E. Archivo .htaccess Causa Error 500
**Síntoma**: Error 500 inmediatamente después de subir archivos
**Solución**:
1. Renombra `.htaccess` a `.htaccess.disabled`
2. Copia el contenido de `.htaccess.backup` a un nuevo `.htaccess`
3. Sube el nuevo archivo

### 8. Test Manual de API
Puedes probar las APIs directamente con curl o Postman:

#### Registrar Usuario
```bash
curl -X POST https://tu-dominio.com/api/auth/register.php \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@test.com","password":"test123"}'
```

#### Crear Noticia (después de login)
```bash
curl -X POST https://tu-dominio.com/api/news/create.php \
  -H "Content-Type: application/json" \
  -b "PHPSESSID=tu_session_id" \
  -d '{"title":"Test","content":"Test content","author":"Admin","image":"","isPinned":false}'
```

## Solución Rápida - Si .htaccess da problemas

Si el archivo `.htaccess` causa error 500, usa esta versión mínima:

```apache
RewriteEngine On

<IfModule mod_headers.c>
    Header set Access-Control-Allow-Origin "*"
    Header set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
    Header set Access-Control-Allow-Headers "Content-Type, Authorization"
</IfModule>
```

## Contacto de Soporte
Si después de seguir estos pasos el problema persiste, anota:
1. El resultado completo de `test-connection.php`
2. Los errores de la consola del navegador
3. El contenido del archivo `error_log.txt`
4. La versión de PHP que muestra cPanel (PHP Selector)

Esta información ayudará a identificar el problema específico.
