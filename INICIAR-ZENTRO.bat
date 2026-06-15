@echo off
chcp 65001 >nul
title Zentro - Servidor (NO cierres esta ventana mientras uses la app)
cd /d "%~dp0app"
set "PATH=%PATH%;C:\Program Files\nodejs"

echo ===============================================================
echo                      Z E N T R O
echo ===============================================================
echo.
echo  Iniciando el servidor... (la primera vez tarda unos segundos)
echo.
echo  CUANDO VEAS LA PALABRA  "Ready"  ABAJO:
echo     - Abre tu navegador en:   http://localhost:3000
echo.
echo  PARA DETENER LA APP:
echo     - Cierra esta ventana (o pulsa Ctrl + C)
echo.
echo ===============================================================
echo.

call npm run dev

echo.
echo El servidor se detuvo. Puedes cerrar esta ventana.
pause
