@echo off
cd /d "%~dp0"
echo Iniciando CryptoRadar...
if not exist node_modules (
  echo Instalando dependencias. Isso pode levar alguns minutos...
  npm install
  if errorlevel 1 (
    echo.
    echo Falha ao instalar dependencias.
    pause
    exit /b 1
  )
)
echo.
echo Abrindo em http://localhost:3000
node server.js
pause
