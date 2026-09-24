@echo off
setlocal
title Subasta 360
cd /d "%~dp0"

where php >nul 2>nul
if %errorlevel%==0 (
    set "PHP_EXE=php"
) else if exist "C:\xampp\php\php.exe" (
    set "PHP_EXE=C:\xampp\php\php.exe"
) else if exist "C:\Program Files\XAMPP\php\php.exe" (
    set "PHP_EXE=C:\Program Files\XAMPP\php\php.exe"
) else (
    echo No se encontro PHP ni en el PATH ni en las rutas tipicas de XAMPP.
    echo Instala XAMPP (https://www.apachefriends.org/) o agrega php.exe al PATH.
    pause
    exit /b 1
)

echo Iniciando el servidor de Subasta 360 con "%PHP_EXE%"...
start "Subasta 360 - servidor (no cerrar)" "%PHP_EXE%" -S localhost:8000

timeout /t 2 /nobreak >nul

start "" http://localhost:8000/index.html

echo.
echo Listo. La pantalla principal deberia haberse abierto en tu navegador.
echo Para cargar premios entra a: http://localhost:8000/login.html
echo.
echo No cierres la ventana "Subasta 360 - servidor" mientras dure el evento.
echo Esta ventana se puede cerrar.
timeout /t 5 >nul
