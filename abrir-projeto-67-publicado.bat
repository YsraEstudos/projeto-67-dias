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
start "Projeto 67 Dias - Dev Server" cmd /c "npm run dev"

:: Aguarda uns segundos pro Vite levantar
timeout /t 3 /nobreak >nul

start "" "http://localhost:5173"

echo.
echo Servidor de desenvolvimento estah rodando!
echo Qualquer mudanca no codigo sera atualizada imediatamente na tela.
pause
