@echo off
REM docker-setup.bat - manage the dockerized KKuTu stack on Windows.
REM See docs/DOCKER.md for details.
REM Usage: docker-setup.bat [up^|down^|reset^|logs^|status^|restart-web^|help]

setlocal

REM Always run from the repo root (this script's directory).
cd /d "%~dp0"

set "COMPOSE=docker compose"
set "URL=http://localhost/"
set "HEALTH_TIMEOUT=360"

set "ACTION=%~1"
if "%ACTION%"=="" set "ACTION=up"

if /i "%ACTION%"=="up"          goto :up
if /i "%ACTION%"=="down"        goto :down
if /i "%ACTION%"=="reset"       goto :reset
if /i "%ACTION%"=="logs"        goto :logs
if /i "%ACTION%"=="status"      goto :status
if /i "%ACTION%"=="restart-web" goto :restartweb
if /i "%ACTION%"=="help"        goto :usage
if /i "%ACTION%"=="-h"          goto :usage
if /i "%ACTION%"=="--help"      goto :usage

echo Unknown command: %ACTION%>&2
echo.
call :usage
exit /b 1

REM ---------------------------------------------------------------- commands

:up
call :check_prereqs
if errorlevel 1 exit /b 1
call :check_password_sync
%COMPOSE% up --build -d
if errorlevel 1 exit /b 1
echo Waiting for services to become healthy (up to %HEALTH_TIMEOUT%s; first boot imports db.sql)...
set /a WAITED=0
:waitloop
REM A healthy 'web' implies db, redis and game are healthy (dependency chain).
%COMPOSE% ps | findstr "web" | findstr "healthy" >nul 2>&1
if not errorlevel 1 goto :healthy
if %WAITED% geq %HEALTH_TIMEOUT% goto :health_timeout
<nul set /p "=."
timeout /t 5 /nobreak >nul
set /a WAITED+=5
goto :waitloop

:healthy
echo.
echo [OK] all services healthy
echo.
echo KKuTu is up -^> %URL%
exit /b 0

:health_timeout
echo.
echo ERROR: services did not become healthy within %HEALTH_TIMEOUT%s.>&2
echo        Inspect with: %COMPOSE% logs -f db>&2
echo        Current status:>&2
%COMPOSE% ps
exit /b 1

:down
call :check_prereqs
if errorlevel 1 exit /b 1
%COMPOSE% down
exit /b %errorlevel%

:reset
call :check_prereqs
if errorlevel 1 exit /b 1
%COMPOSE% down -v
exit /b %errorlevel%

:logs
call :check_prereqs
if errorlevel 1 exit /b 1
%COMPOSE% logs -f web game
exit /b %errorlevel%

:status
call :check_prereqs
if errorlevel 1 exit /b 1
%COMPOSE% ps
exit /b %errorlevel%

:restartweb
call :check_prereqs
if errorlevel 1 exit /b 1
%COMPOSE% restart web
exit /b %errorlevel%

REM --------------------------------------------------------------- functions

REM Verify docker + Compose v2 are available.
:check_prereqs
where docker >nul 2>&1
if errorlevel 1 (
    echo ERROR: 'docker' not found. Install Docker Engine + Compose v2.>&2
    exit /b 1
)
%COMPOSE% version >nul 2>&1
if errorlevel 1 (
    echo ERROR: 'docker compose' ^(Compose v2^) not available.>&2
    echo        Install the Docker Compose v2 plugin.>&2
    exit /b 1
)
exit /b 0

REM Warn (non-fatal) if the DB password is out of sync between the two files.
REM Reads POSTGRES_PASSWORD from the (simple, unquoted) YAML, then just checks
REM that the same literal appears in global.docker.json - avoids parsing JSON.
:check_password_sync
set "COMPOSE_PW="
for /f "tokens=2 delims=:" %%A in ('findstr /c:"POSTGRES_PASSWORD:" docker-compose.yml 2^>nul') do (
    if not defined COMPOSE_PW for /f "tokens=*" %%B in ("%%A") do set "COMPOSE_PW=%%B"
)
if not defined COMPOSE_PW exit /b 0
findstr /c:"%COMPOSE_PW%" deploy\global.docker.json >nul 2>&1
if not errorlevel 1 exit /b 0
echo WARNING: DB password mismatch>&2
echo   docker-compose.yml has POSTGRES_PASSWORD='%COMPOSE_PW%',>&2
echo   but deploy/global.docker.json PG_PASSWORD does not match.>&2
echo   The app will fail to connect until these match. Continuing anyway...>&2
exit /b 0

:usage
echo KKuTu docker helper - wraps 'docker compose' for the KKuTu stack.
echo.
echo Usage: docker-setup.bat ^<command^>
echo.
echo Commands:
echo   up           Build the image, start all services, wait until healthy, print the URL
echo   down         Stop the stack (keeps the database volume)
echo   reset        Stop the stack AND wipe the database (re-imports db.sql next 'up')
echo   logs         Tail the web + game logs (Ctrl-C to stop)
echo   status       Show service status / health
echo   restart-web  Restart only the web service (needed if game restarted)
echo   help         Show this help
echo.
echo If no command is given, 'up' is assumed.
exit /b 0
