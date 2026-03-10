@echo off
title Servidor Plano TRT4

echo =========================================
echo  Reiniciando Servidor - Plano Diario
echo =========================================
echo.

echo [1/3] Procurando e encerrando servidor antigo na porta 5173 (se existir)...
for /f "tokens=5" %%a in ('netstat -a -n -o ^| findstr :5173') do (
    echo Encerrando processo PID %%a...
    taskkill /F /PID %%a 2>NUL
)

echo.
echo [2/3] Aguardando 2 segundos...
timeout /t 2 /nobreak > NUL

echo.
echo [3/3] Iniciando novo servidor e abrindo o site...
echo.
call npm run dev -- --open

if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERRO] O servidor falhou ao iniciar. Verifique as mensagens acima.
)

echo.
echo Pressione qualquer tecla para sair...
pause > NUL
