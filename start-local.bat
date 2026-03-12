@echo off
setlocal enabledelayedexpansion

cd /d "%~dp0"

set "PROJECT_ROOT=%cd%"
set "FRONTEND_PORT=3000"
set "API_PORT=8000"
set "VENV_PYTHON=%PROJECT_ROOT%\.venv\Scripts\python.exe"

echo ========================================
echo  Projeto 67 Dias - Ambiente Local
echo ========================================
echo.

where node >nul 2>&1
if errorlevel 1 (
    echo ERRO: Node.js nao encontrado no PATH.
    pause
    exit /b 1
)

where npm >nul 2>&1
if errorlevel 1 (
    echo ERRO: npm nao encontrado no PATH.
    pause
    exit /b 1
)

where python >nul 2>&1
if errorlevel 1 (
    echo ERRO: Python nao encontrado no PATH.
    pause
    exit /b 1
)

echo [1/5] Garantindo .env.local...
powershell -NoProfile -ExecutionPolicy Bypass -File "%PROJECT_ROOT%\scripts\ensure-local-env.ps1"
if errorlevel 1 (
    echo.
    echo Revise o arquivo ".env.local", salve e execute este .bat novamente.
    if exist "%PROJECT_ROOT%\.env.local" (
        start "" notepad "%PROJECT_ROOT%\.env.local"
    )
    pause
    exit /b 1
)

echo.
echo [2/5] Conferindo dependencias do frontend...
call npm install
if errorlevel 1 (
    echo.
    echo ERRO: falha ao instalar dependencias do frontend.
    pause
    exit /b 1
)

echo.
echo [3/5] Preparando ambiente Python...
if not exist "%VENV_PYTHON%" (
    python -m venv "%PROJECT_ROOT%\.venv"
    if errorlevel 1 (
        echo.
        echo ERRO: falha ao criar o ambiente virtual Python.
        pause
        exit /b 1
    )
)

"%VENV_PYTHON%" -m pip install --disable-pip-version-check -r "%PROJECT_ROOT%\api\requirements.txt"
if errorlevel 1 (
    echo.
    echo ERRO: falha ao instalar dependencias do backend Python.
    pause
    exit /b 1
)

echo.
echo [4/5] Garantindo API local em http://127.0.0.1:%API_PORT% ...
powershell -NoProfile -Command ^
    "try { $response = Invoke-WebRequest -UseBasicParsing 'http://127.0.0.1:%API_PORT%/api/health' -TimeoutSec 2; if ($response.StatusCode -eq 200) { exit 0 } else { exit 1 } } catch { exit 1 }"
if errorlevel 1 (
    start "Projeto 67 Dias API" /D "%PROJECT_ROOT%" "%VENV_PYTHON%" -m uvicorn api.compress:app --host 127.0.0.1 --port %API_PORT%

    powershell -NoProfile -Command ^
        "$deadline = (Get-Date).AddSeconds(20);" ^
        "do {" ^
        "  try {" ^
        "    $response = Invoke-WebRequest -UseBasicParsing 'http://127.0.0.1:%API_PORT%/api/health' -TimeoutSec 2;" ^
        "    if ($response.StatusCode -eq 200) { exit 0 }" ^
        "  } catch {}" ^
        "  Start-Sleep -Milliseconds 500" ^
        "} while ((Get-Date) -lt $deadline);" ^
        "exit 1"

    if errorlevel 1 (
        echo.
        echo ERRO: a API local nao respondeu em http://127.0.0.1:%API_PORT%/api/health
        echo Verifique a janela "Projeto 67 Dias API" para mais detalhes.
        pause
        exit /b 1
    )
) else (
    echo API local ja estava respondendo.
)

echo.
echo [5/5] Iniciando frontend Vite...
echo.
echo Site local: http://127.0.0.1:%FRONTEND_PORT%
echo API local:  http://127.0.0.1:%API_PORT%/api/health
echo.
echo Para encerrar tudo, feche esta janela e a janela "Projeto 67 Dias API".
echo.

call npm run dev -- --host 127.0.0.1 --port %FRONTEND_PORT%

pause
