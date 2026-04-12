@echo off
setlocal

cd /d "%~dp0"

echo ========================================
echo  Projeto 67 Dias - Ambiente de Dev com HMR
echo ========================================
echo Inspecionando mudancas em tempo real...
echo.

where npm >nul 2>&1
if errorlevel 1 (
  echo ERRO: npm nao encontrado no PATH. Instale o Node.js.
  pause
  exit /b 1
)

:: Chama o npm run dev que levanta o Vite com hot reload
:: Mantemos a janela aberta para enxergar qualquer erro de inicializacao.
start "Projeto 67 Dias - Dev Server" cmd /k "npm run dev"

:: Espera o servidor realmente responder antes de abrir o navegador.
powershell -NoProfile -ExecutionPolicy Bypass -Command "$deadline = (Get-Date).AddSeconds(60); while ((Get-Date) -lt $deadline) { try { $response = Invoke-WebRequest -UseBasicParsing -Uri 'http://localhost:3000/' -TimeoutSec 1; if ($response.StatusCode -eq 200) { exit 0 } } catch { } Start-Sleep -Milliseconds 500 }; exit 1"

if errorlevel 1 (
  echo ERRO: o servidor nao respondeu em http://localhost:3000.
  echo Verifique a janela "Projeto 67 Dias - Dev Server" para ver o erro.
  pause
  exit /b 1
)

start "" "http://localhost:3000"

echo.
echo Servidor de desenvolvimento estah rodando!
echo Qualquer mudanca no codigo sera atualizada imediatamente na tela.
pause
