@echo off
echo ========================================
echo  Configurando ambiente Node.js...
echo ========================================
echo.

REM Adiciona Node.js ao PATH temporariamente
set "PATH=C:\Program Files\nodejs;%PATH%"

REM Verifica se Node.js está disponível
node --version
if %ERRORLEVEL% NEQ 0 (
    echo ERRO: Node.js nao encontrado!
    echo Por favor, verifique se o Node.js esta instalado em "C:\Program Files\nodejs"
    pause
    exit /b 1
)

npm --version
if %ERRORLEVEL% NEQ 0 (
    echo ERRO: npm nao encontrado!
    pause
    exit /b 1
)

echo.
echo ========================================
echo  Instalando dependencias do projeto...
echo ========================================
echo.

npm install

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERRO na instalacao das dependencias!
    pause
    exit /b 1
)

echo.
echo ========================================
echo  Iniciando o servidor de desenvolvimento...
echo ========================================
echo.
echo O projeto estara disponivel em: http://localhost:5173
echo.
echo Pressione Ctrl+C para parar o servidor
echo.

npm run dev

pause
