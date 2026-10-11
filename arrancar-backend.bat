@echo off
REM ============================================================
REM  Ventas Garzon - ARRANCAR SOLO EL BACKEND (API puerto 5000)
REM  Doble clic para ejecutar. Esta ventana muestra los logs.
REM  Para detener el backend: Ctrl+C aqui o cerrar esta ventana.
REM ============================================================
setlocal EnableExtensions
title Ventas Garzon - Backend (puerto 5000)
cd /d "%~dp0server"

color 0A
echo.
echo ============================================
echo   VENTAS GARZON  -  BACKEND
echo ============================================
echo.

REM ---------- [1/4] Verificar Node.js y npm ----------
echo [1/4] Verificando Node.js y npm...
where node >nul 2>&1
if errorlevel 1 (
  color 4F
  echo.
  echo  ==============================================
  echo   ERROR: Node.js NO esta instalado en este PC
  echo  ==============================================
  echo   1. Descarga la version LTS desde: https://nodejs.org
  echo   2. Instalala  ^(siguiente-siguiente^)
  echo   3. Reinicia el PC
  echo   4. Vuelve a ejecutar este archivo
  echo.
  pause
  exit /b 1
)
where npm >nul 2>&1
if errorlevel 1 (
  color 4F
  echo.
  echo  ERROR: npm no se encontro. Reinstala Node.js desde https://nodejs.org
  echo.
  pause
  exit /b 1
)
for /f "delims=" %%v in ('node --version') do set NODEV=%%v
echo        Node %NODEV% detectado OK

REM ---------- [2/4] Instalar dependencias si faltan ----------
if exist "node_modules\" (
  echo [2/4] Dependencias ya instaladas OK
) else (
  echo [2/4] Instalando dependencias, puede tardar 1-3 minutos...
  echo.
  call npm install
  echo.
  if errorlevel 1 (
    color 4F
    echo.
    echo  ==============================================
    echo   ERROR: npm install fallo
    echo  ==============================================
    echo   Causas comunes:
    echo    - Sin conexion a internet
    echo    - Antivirus o proxy bloqueando npm
    echo   Reintenta o ejecuta manualmente en esta carpeta: npm install
    echo.
    pause
    exit /b 1
  )
  echo        Dependencias instaladas OK
)

REM ---------- [3/4] Verificar configuracion .env ----------
echo [3/4] Verificando configuracion...
if exist ".env" (
  echo        Archivo .env encontrado OK
) else (
  color 6F
  echo.
  echo  AVISO: No existe el archivo server\.env
  echo  Se usaran valores por defecto:
  echo    DB_USER=postgres  DB_PASSWORD=postgres  DB_NAME=ventas_garzon
  echo  Si tu contrasena de PostgreSQL es otra, crea el .env o copia
  echo  .env.example como .env y ajusta la linea DB_PASSWORD
  echo.
  timeout /t 6 >nul
  color 0A
)

REM ---------- [4/4] Verificar PostgreSQL ----------
echo [4/4] Verificando PostgreSQL en localhost:5432...
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
  echo  ==============================================
  echo   ADVERTENCIA: PostgreSQL NO responde
  echo  ==============================================
  echo   El backend va a intentar arrancar igual, pero si ves
  echo   ECONNREFUSED 127.0.0.1:5432 es porque la base de datos
  echo   esta apagada. Para encenderla:
  echo.
  echo    1. Presiona Windows + R, escribe: services.msc  y Enter
  echo    2. Busca el servicio "postgresql" en la lista
  echo    3. Clic derecho -^> Iniciar
  echo    4. Vuelve a ejecutar este archivo
  echo.
  echo   Si PostgreSQL no esta instalado:
  echo    https://www.postgresql.org/download/windows/
  echo.
  timeout /t 8 >nul
  color 0A
) else (
  echo        PostgreSQL respondiendo OK
)

REM ---------- Aviso de puerto ocupado ----------
netstat -ano | findstr ":5000 " | findstr "LISTENING" >nul 2>&1
if not errorlevel 1 (
  color 6F
  echo.
  echo  AVISO: El puerto 5000 YA esta en uso.
  echo  Probablemente ya hay un backend corriendo en otra ventana.
  echo  Cierra esa ventana primero si quieres reiniciar el backend.
  echo.
  timeout /t 6 >nul
  color 0A
)

REM ---------- Arrancar ----------
echo.
echo ============================================
echo   Todo listo. Arrancando el backend...
echo ============================================
echo   API:      http://localhost:5000/api
echo   Salud:    http://localhost:5000/api/health
echo.
echo   Cuando veas "Servidor ejecutandose en puerto 5000"
echo   puedes abrir la tienda en http://localhost:3000
echo   ^(para eso antes ejecuta arrancar-frontend.bat^)
echo.
echo   DETENER: presiona Ctrl+C o cierra esta ventana
echo ============================================
echo.

call npm run dev

REM ---------- Si el proceso termina ----------
color 4F
echo.
echo  ==============================================
echo   El backend se detuvo o fallo al arrancar
echo  ==============================================
echo   Errores tipicos y su solucion:
echo.
echo    ECONNREFUSED 127.0.0.1:5432
echo      -^> PostgreSQL apagado. Mira las instrucciones de arriba.
echo.
echo    password authentication failed for user "postgres"
echo      -^> Contrasena incorrecta. Edita server\.env en la linea
echo         DB_PASSWORD con la contrasena que pusiste al instalar PostgreSQL,
echo         guarda y vuelve a ejecutar este archivo.
echo.
echo    Cannot find module
echo      -^> Faltan dependencias. Borra la carpeta node_modules de server
echo         y vuelve a ejecutar este archivo.
echo.
echo   Cierra esta ventana y reintenta.
echo.
pause
endlocal
