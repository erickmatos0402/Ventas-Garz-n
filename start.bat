@echo off
REM ============================================================
REM  Ventas Garzon - Arranque rapido (doble clic para ejecutar)
REM  1) Verifica Node.js y npm
REM  2) Instala dependencias si faltan
REM  3) Copia las fotos de productos al cliente
REM  4) Verifica PostgreSQL
REM  5) Levanta backend (puerto 5000) y frontend (puerto 3000)
REM ============================================================
setlocal EnableExtensions
title Ventas Garzon - Launcher
cd /d "%~dp0"

echo.
echo ============================================
echo   VENTAS GARZON - Iniciando aplicacion...
echo ============================================
echo.

REM --- 0) Verificar Node.js y npm ---
echo [0/4] Verificando Node.js...
where node >nul 2>&1
if errorlevel 1 (
  color 4F
  echo.
  echo  ERROR: Node.js no esta instalado o no esta en el PATH.
  echo  Descargalo desde: https://nodejs.org  ^(version LTS^)
  echo  Instalalo, reinicia el PC y vuelve a ejecutar este archivo.
  echo.
  pause
  exit /b 1
)
for /f "delims=" %%v in ('node --version') do set NODEV=%%v
echo        Node detectado: %NODEV% OK

REM --- 1) Instalar dependencias del servidor si faltan ---
if not exist "server\node_modules\" (
  echo [1/4] Instalando dependencias del servidor, puede tardar unos minutos...
  pushd server
  call npm install
  if errorlevel 1 (
    popd
    color 4F
    echo.
    echo  ERROR: npm install fallo en la carpeta server.
    echo  Causas comunes: sin internet, antivirus o proxy bloqueando npm.
    echo  Intenta manualmente: abre CMD, ve a la carpeta server y ejecuta: npm install
    echo.
    pause
    exit /b 1
  )
  popd
) else (
  echo [1/4] Dependencias del servidor OK
)

REM --- 2) Instalar dependencias del cliente si faltan ---
if not exist "client\node_modules\" (
  echo [2/4] Instalando dependencias del cliente, puede tardar unos minutos...
  pushd client
  call npm install
  if errorlevel 1 (
    popd
    color 4F
    echo.
    echo  ERROR: npm install fallo en la carpeta client.
    echo.
    pause
    exit /b 1
  )
  popd
) else (
  echo [2/4] Dependencias del cliente OK
)

REM --- 3) Copiar fotos de productos al cliente ---
if exist "Fotos" (
  if not exist "client\public\img" mkdir "client\public\img"
  copy /y "Fotos\*.jpg" "client\public\img\" >nul 2>&1
  echo [3/4] Fotos de productos copiadas
) else (
  echo [3/4] Carpeta Fotos no encontrada, se saltan las imagenes locales
)

REM --- 4) Verificar PostgreSQL ---
echo [4/4] Verificando PostgreSQL...
set PGBIN=
if exist "C:\Program Files\PostgreSQL" (
  for /d %%D in ("C:\Program Files\PostgreSQL\*") do if exist "%%D\bin\pg_isready.exe" set PGBIN=%%D\bin\
)
if defined PGBIN (
  "%PGBIN%pg_isready.exe" -h localhost -p 5432 >nul 2>&1
) else (
  pg_isready -h localhost -p 5432 >nul 2>&1
)
if errorlevel 1 (
  color 6F
  echo.
  echo  ADVERTENCIA: PostgreSQL no responde en localhost:5432.
  echo  El backend va a arrancar, pero si falla al conectar revisa:
  echo   1. Que PostgreSQL este instalado: https://www.postgresql.org/download/windows/
  echo   2. Que el servicio este iniciado: services.msc -^> postgresql -^> Iniciar
  echo   3. La contrasena en el archivo server\.env  ^(linea DB_PASSWORD^)
  echo.
  timeout /t 8 >nul
  color
) else (
  echo        PostgreSQL OK
)

REM --- Verificar puertos ocupados ---
netstat -ano | findstr ":5000 " | findstr "LISTENING" >nul 2>&1
if not errorlevel 1 (
  echo.
  echo  AVISO: El puerto 5000 ya esta en uso. Si ya hay un backend corriendo,
  echo  se reutilizara. Si ves errores, cierra esa ventana y vuelve a intentar.
  echo.
)

echo.
echo ============================================
echo   Backend:  http://localhost:5000/api
echo   Frontend: http://localhost:3000
echo ============================================
echo   Se abren 2 ventanas: Backend y Frontend.
echo   NO las cierres para que la tienda funcione.
echo   Para detener todo: cierra ambas ventanas.
echo ============================================
echo.

REM --- Arrancar backend en ventana propia ---
start "Ventas Garzon - Backend (5000)" cmd /k "cd /d "%~dp0server" && npm run dev"

REM --- Esperar a que el backend levante ---
timeout /t 8 >nul

REM --- Arrancar frontend en ventana propia ---
start "Ventas Garzon - Frontend (3000)" cmd /k "cd /d "%~dp0client" && npm run dev"

REM --- Esperar a que Vite compile y abrir el navegador ---
timeout /t 6 >nul
start http://localhost:3000

echo Listo: backend y frontend corriendo en ventanas separadas.
echo.
echo SI EL BACKEND MUESTRA UN ERROR EN SU VENTANA:
echo  - ECONNREFUSED 127.0.0.1:5432  =  PostgreSQL no esta corriendo
echo  - password authentication failed = contrasena incorrecta en server\.env
echo  - Cannot find module = faltan dependencias, ejecuta este archivo de nuevo
echo.
echo Puedes cerrar esta ventana cuando quieras.
pause
endlocal
