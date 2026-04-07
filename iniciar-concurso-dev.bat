@echo off
setlocal

cd /d "%~dp0\CONCURSO"

echo ========================================
echo  Projeto 67 Dias - CONCURSO (Hot Reload)
echo ========================================
echo Subindo ambiente de desenvolvimento da pasta CONCURSO...
echo.

where npm >nul 2>&1
if errorlevel 1 (
  echo ERRO: npm nao encontrado no PATH. Instale o Node.js.
  pause
  exit /b 1
)

:: Inicia o dev server do Vite focado apenas no Concurso
start "Concurso - Dev Server" cmd /c "npm run dev"

:: Aguarda uns segundos pro Vite levantar
timeout /t 3 /nobreak >nul

:: URL padrão do Vite + subrota /concurso configurada no vite.config.ts
start "" "http://localhost:5173/concurso/"

echo.
echo Servidor de desenvolvimento do CONCURSO estah rodando!
echo Suas modificacoes em CONCURSO/src aparecerao imediatamente no navegador.
pause