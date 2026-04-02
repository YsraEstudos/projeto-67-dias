@echo off
setlocal

cd /d "%~dp0"

set "ROOT_DIR=%cd%"
set "DIST_DIR=%ROOT_DIR%\dist"
set "URL=http://localhost:4173/"
set "PORT=4173"

echo ========================================
echo  Projeto 67 Dias - abertura rapida
echo ========================================
echo.

if not exist "%DIST_DIR%\index.html" (
  echo ERRO: "%DIST_DIR%\index.html" nao foi encontrado.
  echo Execute "npm run build" uma vez e tente novamente.
  if not "%NO_PAUSE%"=="1" pause
  exit /b 1
)

set "SERVER_CMD="
where python >nul 2>&1
if not errorlevel 1 (
  set "SERVER_CMD=python -m http.server %PORT% --bind 127.0.0.1 --directory dist"
) else (
  where py >nul 2>&1
  if not errorlevel 1 (
    set "SERVER_CMD=py -3 -m http.server %PORT% --bind 127.0.0.1 --directory dist"
  ) else (
    where node >nul 2>&1
    if errorlevel 1 (
      echo ERRO: Python ou Node.js nao encontrado no PATH.
      if not "%NO_PAUSE%"=="1" pause
      exit /b 1
    )

    where npm >nul 2>&1
    if errorlevel 1 (
      echo ERRO: npm nao encontrado no PATH.
      if not "%NO_PAUSE%"=="1" pause
      exit /b 1
    )

    set "SERVER_CMD=npm run preview -- --host 127.0.0.1 --port %PORT% --strictPort"
  )
)

powershell -NoProfile -Command ^
  "try { $r = Invoke-WebRequest -UseBasicParsing '%URL%' -TimeoutSec 2; if ($r.StatusCode -ge 200) { exit 0 } else { exit 1 } } catch { exit 1 }"
if errorlevel 1 (
  start "Projeto 67 Dias Rapido" /D "%ROOT_DIR%" cmd /c "%SERVER_CMD%"

  powershell -NoProfile -Command ^
    "$deadline = (Get-Date).AddSeconds(8);" ^
    "do {" ^
    "  try {" ^
    "    $r = Invoke-WebRequest -UseBasicParsing '%URL%' -TimeoutSec 2;" ^
    "    if ($r.StatusCode -ge 200) { exit 0 }" ^
    "  } catch {}" ^
    "  Start-Sleep -Milliseconds 250" ^
    "} while ((Get-Date) -lt $deadline);" ^
    "exit 1"

  if errorlevel 1 (
    echo.
    echo ERRO: o servidor rapido nao respondeu em %URL%
    if not "%NO_PAUSE%"=="1" pause
    exit /b 1
  )
)

start "" "%URL%"

echo.
echo Pronto. Abrindo a build em dist sem recompilar.
if not "%NO_PAUSE%"=="1" pause
