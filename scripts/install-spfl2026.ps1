# ==============================================================================
# SP Football Life 2026 - Script Auxiliar de Instalacao e Validacao
# Autor: Antigravity AI (Google DeepMind)
# ==============================================================================

# Limpar tela e exibir cabecalho
Clear-Host
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "       SP FOOTBALL LIFE 2026 - INSTALADOR AUXILIAR POWERSHELL         " -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "Este script ira validar, extrair e auxiliar na instalacao do SP FL26," -ForegroundColor Gray
Write-Host "assim como seus updates correspondentes (Update 2.0 e 2.2)." -ForegroundColor Gray
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host ""

# ------------------------------------------------------------------------------
# 1. SOLICITAR PASTA DE DOWNLOADS
# ------------------------------------------------------------------------------
$defaultDownloads = "C:\Users\israe\Downloads\SP"
Write-Host "1. Definindo diretorio de downloads..." -ForegroundColor Yellow
$downloadsPath = Read-Host "Digite o caminho da pasta onde estao os arquivos [Padrao: $defaultDownloads]"
if ([string]::IsNullOrWhiteSpace($downloadsPath)) {
    $downloadsPath = $defaultDownloads
}

# Remover aspas se o usuario arrastar e soltar a pasta
$downloadsPath = $downloadsPath.Trim('"').Trim("'")

if (-not (Test-Path $downloadsPath)) {
    Write-Host "[ERRO] A pasta '$downloadsPath' nao existe! Verifique o caminho." -ForegroundColor Red
    Write-Host "Script encerrado." -ForegroundColor Red
    exit 1
}
Write-Host "Pasta de downloads selecionada: $downloadsPath" -ForegroundColor Green
Write-Host ""

# Inicializar relatorio
$reportPath = Join-Path $downloadsPath "SPFL26_Installation_Report.txt"
$reportContent = @()
$reportContent += "========================================================"
$reportContent += "RELATORIO DE INSTALACAO - SP FOOTBALL LIFE 2026"
$reportContent += "Data/Hora: $(Get-Date -Format 'dd/MM/yyyy HH:mm:ss')"
$reportContent += "Pasta de downloads: $downloadsPath"
$reportContent += "========================================================"
$reportContent += ""

# ------------------------------------------------------------------------------
# 2. VERIFICAR ARQUIVOS NECESSARIOS
# ------------------------------------------------------------------------------
Write-Host "2. Verificando presenca dos arquivos de instalacao..." -ForegroundColor Yellow

$baseGameOk = $true
$missingFiles = @()

# Verificar as 11 partes do jogo base
Write-Host "Verificando partes do Jogo Base (1 ate 11):" -ForegroundColor Gray
for ($i = 1; $i -le 11; $i++) {
    $partName = "SPFL26.part{0:D2}.rar" -f $i
    $partPath = Join-Path $downloadsPath $partName
    if (Test-Path $partPath) {
        Write-Host "  [OK] Encontrado: $partName" -ForegroundColor Green
        $reportContent += "  [OK] Encontrado: $partName"
    } else {
        Write-Host "  [FALTA] NAO ENCONTRADO: $partName" -ForegroundColor Red
        $reportContent += "  [FALTA] NAO ENCONTRADO: $partName"
        $baseGameOk = $false
        $missingFiles += $partName
    }
}

# Verificar Update 2.0
$update200Name = "SPFL26_200.rar"
$update200Path = Join-Path $downloadsPath $update200Name
$update200Ok = $false
if (Test-Path $update200Path) {
    Write-Host "  [OK] Encontrado Update 2.0: $update200Name" -ForegroundColor Green
    $reportContent += "  [OK] Encontrado Update 2.0: $update200Name"
    $update200Ok = $true
} else {
    Write-Host "  [FALTA] NAO ENCONTRADO: $update200Name" -ForegroundColor Red
    $reportContent += "  [FALTA] NAO ENCONTRADO: $update200Name"
    $missingFiles += $update200Name
}

# Verificar Update 2.2
$update220Name = "SPFL26_220.rar"
$update220Path = Join-Path $downloadsPath $update220Name
$update220Ok = $false
if (Test-Path $update220Path) {
    Write-Host "  [OK] Encontrado Update 2.2: $update220Name" -ForegroundColor Green
    $reportContent += "  [OK] Encontrado Update 2.2: $update220Name"
    $update220Ok = $true
} else {
    Write-Host "  [FALTA] NAO ENCONTRADO: $update220Name" -ForegroundColor Red
    $reportContent += "  [FALTA] NAO ENCONTRADO: $update220Name"
    $missingFiles += $update220Name
}

if (-not $baseGameOk -or -not $update200Ok -or -not $update220Ok) {
    Write-Host ""
    Write-Host "[ERRO CRITICO] Estao faltando arquivos necessarios na pasta de downloads." -ForegroundColor Red
    Write-Host "Arquivos ausentes:" -ForegroundColor Red
    foreach ($file in $missingFiles) {
        Write-Host " - $file" -ForegroundColor Red
    }
    Write-Host "Por favor, baixe todos os arquivos e coloque-os na mesma pasta antes de prosseguir." -ForegroundColor Yellow
    $reportContent += "`r`n[STATUS] Erro: Arquivos em falta. Instalacao abortada."
    [System.IO.File]::WriteAllLines($reportPath, $reportContent)
    Write-Host "Relatorio gerado em: $reportPath" -ForegroundColor Cyan
    exit 1
}
Write-Host "Todos os arquivos necessarios estao presentes!" -ForegroundColor Green
$reportContent += "`r`n[STATUS] Todos os arquivos necessarios encontrados."
Write-Host ""

# ------------------------------------------------------------------------------
# 3. VERIFICAR E CONFIGURAR DESCOMPACTADOR (7-Zip ou WinRAR)
# ------------------------------------------------------------------------------
Write-Host "3. Verificando ferramentas de descompactacao..." -ForegroundColor Yellow

$archiverPath = ""
$archiverType = ""

# 1. Tentar achar 7-Zip
$sevenZipPaths = @(
    "C:\Program Files\7-Zip\7z.exe",
    "C:\Program Files (x86)\7-Zip\7z.exe"
)
foreach ($path in $sevenZipPaths) {
    if (Test-Path $path) {
        $archiverPath = $path
        $archiverType = "7-Zip"
        break
    }
}
if ([string]::IsNullOrEmpty($archiverPath)) {
    $cmd7z = Get-Command 7z -ErrorAction SilentlyContinue
    if ($cmd7z) {
        $archiverPath = $cmd7z.Source
        $archiverType = "7-Zip"
    }
}

# 2. Tentar achar WinRAR se 7-zip nao foi encontrado
if ([string]::IsNullOrEmpty($archiverPath)) {
    $winRarPaths = @(
        "C:\Program Files\WinRAR\WinRAR.exe",
        "C:\Program Files (x86)\WinRAR\WinRAR.exe"
    )
    foreach ($path in $winRarPaths) {
        if (Test-Path $path) {
            $archiverPath = $path
            $archiverType = "WinRAR"
            break
        }
    }
    if ([string]::IsNullOrEmpty($archiverPath)) {
        $cmdWinRar = Get-Command winrar -ErrorAction SilentlyContinue
        if ($cmdWinRar) {
            $archiverPath = $cmdWinRar.Source
            $archiverType = "WinRAR"
        }
    }
}

if ([string]::IsNullOrEmpty($archiverPath)) {
    Write-Host "[ERRO CRITICO] Nem o 7-Zip nem o WinRAR foram localizados no sistema." -ForegroundColor Red
    Write-Host "Instale um deles e adicione ao PATH ou instale nos locais padrao:" -ForegroundColor Yellow
    Write-Host " - 7-Zip: C:\Program Files\7-Zip\" -ForegroundColor Yellow
    Write-Host " - WinRAR: C:\Program Files\WinRAR\" -ForegroundColor Yellow
    $reportContent += "`r`n[STATUS] Erro: Descompactador nao encontrado. Instalacao abortada."
    [System.IO.File]::WriteAllLines($reportPath, $reportContent)
    exit 1
}

Write-Host "Ferramenta detectada: $archiverType ($archiverPath)" -ForegroundColor Green
$reportContent += "Ferramenta de descompactacao: $archiverType ($archiverPath)"
Write-Host ""

# Funcao auxiliar para extrair
function Executar-Extracao {
    param (
        [string]$archive,
        [string]$dest
    )
    
    # Se ja existir conteudo, perguntar se quer pular
    if (Test-Path $dest) {
        $files = Get-ChildItem -Path $dest -ErrorAction SilentlyContinue
        if ($files -and $files.Count -gt 0) {
            Write-Host "A pasta '$dest' ja possui arquivos extraidos." -ForegroundColor Yellow
            $opcao = Read-Host "Deseja extrair novamente? (S/N) [Padrao: N]"
            if ($opcao -notmatch "^[sS]") {
                Write-Host "Pulando extracao de $archive..." -ForegroundColor Yellow
                return $true
            }
        }
    } else {
        New-Item -ItemType Directory -Path $dest -Force | Out-Null
    }

    Write-Host "Extraindo '$(Split-Path $archive -Leaf)'..." -ForegroundColor Cyan
    Write-Host "Destino: $dest" -ForegroundColor Gray
    Write-Host "Isso pode levar alguns minutos. Aguarde..." -ForegroundColor Gray

    $startTime = Get-Date

    if ($archiverType -eq "7-Zip") {
        # 7-Zip extraction
        $proc = Start-Process -FilePath $archiverPath -ArgumentList "x", "-o$dest", "$archive", "-y" -PassThru -Wait -NoNewWindow
        $exitCode = $proc.ExitCode
    } else {
        # WinRAR extraction: x -y -ibck archive dest\
        # O WinRAR precisa de barra invertida no final da pasta destino
        $destWinRar = $dest
        if (-not $destWinRar.EndsWith("\")) { $destWinRar += "\" }
        $proc = Start-Process -FilePath $archiverPath -ArgumentList "x", "-y", "-ibck", "$archive", "$destWinRar" -PassThru -Wait -NoNewWindow
        $exitCode = $proc.ExitCode
    }

    $elapsed = (Get-Date) - $startTime

    if ($exitCode -eq 0) {
        Write-Host "Extracao concluida com sucesso em $($elapsed.ToString('mm\:ss'))!" -ForegroundColor Green
        return $true
    } else {
        Write-Host "[ERRO] Falha na extracao de $archive. Codigo de saida: $exitCode" -ForegroundColor Red
        return $false
    }
}

# ------------------------------------------------------------------------------
# 4. EXTRAIR BASE GAME (PARTE 1)
# ------------------------------------------------------------------------------
Write-Host "4. Extraindo o Jogo Base (Part 1)..." -ForegroundColor Yellow
$baseExtractPath = Join-Path $downloadsPath "TempExtract_Base"
$part1Path = Join-Path $downloadsPath "SPFL26.part01.rar"

if (-not (Executar-Extracao -archive $part1Path -dest $baseExtractPath)) {
    Write-Host "[ERRO CRITICO] Falha ao extrair o jogo base. Script abortado." -ForegroundColor Red
    $reportContent += "`r`n[STATUS] Erro: Falha na extracao do jogo base."
    [System.IO.File]::WriteAllLines($reportPath, $reportContent)
    exit 1
}
$reportContent += "Jogo Base extraido em: $baseExtractPath"
Write-Host ""

# ------------------------------------------------------------------------------
# 5. LOCALIZAR E EXECUTAR O INSTALADOR DO JOGO BASE
# ------------------------------------------------------------------------------
Write-Host "5. Localizando o instalador do jogo base..." -ForegroundColor Yellow
$setupBaseFiles = Get-ChildItem -Path $baseExtractPath -Filter "SPFL26_setup.exe" -Recurse
if ($setupBaseFiles.Count -eq 0) {
    # Tentar buscar qualquer executavel que comece com SPFL ou setup caso o nome varie
    $setupBaseFiles = Get-ChildItem -Path $baseExtractPath -Filter "*setup*.exe" -Recurse
}

if ($setupBaseFiles.Count -eq 0) {
    Write-Host "[ERRO CRITICO] Nao foi possivel encontrar o arquivo executavel do instalador ('SPFL26_setup.exe') na pasta extraida!" -ForegroundColor Red
    $reportContent += "`r`n[STATUS] Erro: Instalador base nao encontrado na extracao."
    [System.IO.File]::WriteAllLines($reportPath, $reportContent)
    exit 1
}

$setupBasePath = $setupBaseFiles[0].FullName
Write-Host "Instalador encontrado: $setupBasePath" -ForegroundColor Green
$reportContent += "Instalador Base detectado: $setupBasePath"

Write-Host ""
Write-Host "======================================================================" -ForegroundColor Yellow
Write-Host "ATENCAO - INSTRUCOES PARA A JANELA DE INSTALACAO DO JOGO BASE:" -ForegroundColor Yellow
Write-Host "1. Voce deve selecionar uma pasta NOVA e VAZIA para instalar o jogo." -ForegroundColor White
Write-Host "   Exemplo recomendado: C:\Games\SP Football Life 2026" -ForegroundColor White
Write-Host "2. NUNCA instale por cima de outro patch ou de outra versao do Football Life!" -ForegroundColor Red
Write-Host "3. O instalador do SmokePatch eh interativo. Siga as instrucoes na tela." -ForegroundColor White
Write-Host "======================================================================" -ForegroundColor Yellow
Write-Host ""

Write-Host "Caminho do executavel a ser rodado:" -ForegroundColor Cyan
Write-Host "  $setupBasePath" -ForegroundColor DarkCyan

$confirm = Read-Host "Deseja executar o instalador do jogo base como administrador agora? (S/N) [Padrao: S]"
if ($confirm -match "^[nN]") {
    Write-Host "Instalacao abortada pelo usuario." -ForegroundColor Yellow
    $reportContent += "`r`n[STATUS] Abortado pelo usuario na execucao do instalador base."
    [System.IO.File]::WriteAllLines($reportPath, $reportContent)
    exit 1
}

Write-Host "Executando o instalador do Jogo Base. O script ira aguardar a conclusao..." -ForegroundColor Cyan
try {
    # Executar como administrador e aguardar
    $proc = Start-Process -FilePath $setupBasePath -Verb RunAs -Wait -PassThru
    $reportContent += "Jogo Base executado. Codigo de saida: $($proc.ExitCode)"
} catch {
    Write-Host "[ERRO CRITICO] Falha ao iniciar o instalador: $_" -ForegroundColor Red
    $reportContent += "`r`n[STATUS] Erro ao executar instalador base: $_"
    [System.IO.File]::WriteAllLines($reportPath, $reportContent)
    exit 1
}

Write-Host "Instalacao do Jogo Base concluida (ou janela fechada)." -ForegroundColor Green
Write-Host ""

# ------------------------------------------------------------------------------
# 6. DEFINIR E VALIDAR DIRETORIO DE INSTALACAO
# ------------------------------------------------------------------------------
Write-Host "6. Definindo e validando pasta de instalacao do jogo..." -ForegroundColor Yellow
$defaultInstallDir = "C:\Games\SP Football Life 2026"
$gameInstallPath = ""

$valido = $false
while (-not $valido) {
    $gameInstallPath = Read-Host "Digite o caminho completo da pasta onde voce instalou o jogo [Padrao: $defaultInstallDir]"
    if ([string]::IsNullOrWhiteSpace($gameInstallPath)) {
        $gameInstallPath = $defaultInstallDir
    }
    $gameInstallPath = $gameInstallPath.Trim('"').Trim("'")

    if (-not (Test-Path $gameInstallPath)) {
        Write-Host "[ALERTA] A pasta informada nao existe ou esta incorreta!" -ForegroundColor Yellow
        $repro = Read-Host "Deseja tentar digitar novamente? (S/N) [Padrao: S]"
        if ($repro -match "^[nN]") {
            Write-Host "Instalacao finalizada sem validacao dos updates." -ForegroundColor Yellow
            $reportContent += "`r`n[STATUS] Finalizado pelo usuario devido a pasta incorreta."
            [System.IO.File]::WriteAllLines($reportPath, $reportContent)
            exit 0
        }
    } else {
        $gameExecutable = Join-Path $gameInstallPath "FL_2026 start.exe"
        if (-not (Test-Path $gameExecutable)) {
            Write-Host "[ALERTA] O executavel 'FL_2026 start.exe' nao foi encontrado na pasta '$gameInstallPath'." -ForegroundColor Red
            Write-Host "Isso indica que o jogo nao foi instalado corretamente la ou a pasta esta errada." -ForegroundColor Yellow
            $choiceDir = Read-Host "Deseja prosseguir mesmo assim? (S/N) [Padrao: N]"
            if ($choiceDir -match "^[sS]") {
                $valido = $true
            }
        } else {
            Write-Host "[OK] Executavel do jogo base detectado com sucesso em: $gameExecutable" -ForegroundColor Green
            $valido = $true
        }
    }
}

$reportContent += "Pasta de Instalacao do Jogo: $gameInstallPath"
Write-Host ""

# ------------------------------------------------------------------------------
# 7. EXTRAIR E INSTALAR UPDATE 2.0 (DEVE vir antes do 2.2)
# ------------------------------------------------------------------------------
Write-Host "7. Processando UPDATE 2.0..." -ForegroundColor Yellow
$update200ExtractPath = Join-Path $downloadsPath "TempExtract_Update200"

if (-not (Executar-Extracao -archive $update200Path -dest $update200ExtractPath)) {
    Write-Host "[ERRO] Falha ao extrair o Update 2.0. Script interrompido." -ForegroundColor Red
    $reportContent += "`r`n[STATUS] Erro: Falha na extracao do Update 2.0."
    [System.IO.File]::WriteAllLines($reportPath, $reportContent)
    exit 1
}

$setupUpdate200Files = Get-ChildItem -Path $update200ExtractPath -Filter "*.exe" -Recurse
if ($setupUpdate200Files.Count -eq 0) {
    Write-Host "[ERRO CRITICO] Executavel do instalador do Update 2.0 nao encontrado na pasta extraida!" -ForegroundColor Red
    $reportContent += "`r`n[STATUS] Erro: Executavel do Update 2.0 nao encontrado."
    [System.IO.File]::WriteAllLines($reportPath, $reportContent)
    exit 1
}

$setupUpdate200Path = $setupUpdate200Files[0].FullName
Write-Host "Instalador do Update 2.0 encontrado: $setupUpdate200Path" -ForegroundColor Green
$reportContent += "Instalador Update 2.0 detectado: $setupUpdate200Path"

Write-Host ""
Write-Host "======================================================================" -ForegroundColor Yellow
Write-Host "ATENCAO - INSTRUCOES PARA INSTALACAO DO UPDATE 2.0:" -ForegroundColor Yellow
Write-Host "1. Voce deve selecionar EXATAMENTE a mesma pasta do jogo base:" -ForegroundColor White
Write-Host "   -> $gameInstallPath" -ForegroundColor Cyan
Write-Host "2. Certifique-se de que o instalador conclua com sucesso." -ForegroundColor White
Write-Host "======================================================================" -ForegroundColor Yellow
Write-Host ""

Write-Host "Caminho do executavel do Update 2.0 a ser rodado:" -ForegroundColor Cyan
Write-Host "  $setupUpdate200Path" -ForegroundColor DarkCyan

$confirm200 = Read-Host "Executar o Update 2.0 como administrador agora? (S/N) [Padrao: S]"
if ($confirm200 -match "^[nN]") {
    Write-Host "Instalacao do Update 2.0 cancelada pelo usuario. O Update 2.2 nao pode ser instalado sem o 2.0." -ForegroundColor Yellow
    $reportContent += "`r`n[STATUS] Abortado no Update 2.0 pelo usuario."
    [System.IO.File]::WriteAllLines($reportPath, $reportContent)
    exit 1
}

Write-Host "Executando Update 2.0. O script ira aguardar..." -ForegroundColor Cyan
try {
    $proc = Start-Process -FilePath $setupUpdate200Path -Verb RunAs -Wait -PassThru
    $reportContent += "Update 2.0 executado. Codigo de saida: $($proc.ExitCode)"
} catch {
    Write-Host "[ERRO CRITICO] Falha ao iniciar o Update 2.0: $_" -ForegroundColor Red
    $reportContent += "`r`n[STATUS] Erro ao rodar Update 2.0: $_"
    [System.IO.File]::WriteAllLines($reportPath, $reportContent)
    exit 1
}
Write-Host "Update 2.0 concluido!" -ForegroundColor Green
Write-Host ""

# ------------------------------------------------------------------------------
# 8. EXTRAIR E INSTALAR UPDATE 2.2
# ------------------------------------------------------------------------------
Write-Host "8. Processando UPDATE 2.2..." -ForegroundColor Yellow
$update220ExtractPath = Join-Path $downloadsPath "TempExtract_Update220"

if (-not (Executar-Extracao -archive $update220Path -dest $update220ExtractPath)) {
    Write-Host "[ERRO] Falha ao extrair o Update 2.2. Script interrompido." -ForegroundColor Red
    $reportContent += "`r`n[STATUS] Erro: Falha na extracao do Update 2.2."
    [System.IO.File]::WriteAllLines($reportPath, $reportContent)
    exit 1
}

$setupUpdate220Files = Get-ChildItem -Path $update220ExtractPath -Filter "*.exe" -Recurse
if ($setupUpdate220Files.Count -eq 0) {
    Write-Host "[ERRO CRITICO] Executavel do instalador do Update 2.2 nao encontrado na pasta extraida!" -ForegroundColor Red
    $reportContent += "`r`n[STATUS] Erro: Executavel do Update 2.2 nao encontrado."
    [System.IO.File]::WriteAllLines($reportPath, $reportContent)
    exit 1
}

$setupUpdate220Path = $setupUpdate220Files[0].FullName
Write-Host "Instalador do Update 2.2 encontrado: $setupUpdate220Path" -ForegroundColor Green
$reportContent += "Instalador Update 2.2 detectado: $setupUpdate220Path"

Write-Host ""
Write-Host "======================================================================" -ForegroundColor Yellow
Write-Host "ATENCAO - INSTRUCOES PARA INSTALACAO DO UPDATE 2.2:" -ForegroundColor Yellow
Write-Host "1. Voce deve selecionar EXATAMENTE a mesma pasta do jogo base:" -ForegroundColor White
Write-Host "   -> $gameInstallPath" -ForegroundColor Cyan
Write-Host "2. Certifique-se de que o instalador conclua com sucesso." -ForegroundColor White
Write-Host "======================================================================" -ForegroundColor Yellow
Write-Host ""

Write-Host "Caminho do executavel do Update 2.2 a ser rodado:" -ForegroundColor Cyan
Write-Host "  $setupUpdate220Path" -ForegroundColor DarkCyan

$confirm220 = Read-Host "Executar o Update 2.2 como administrador agora? (S/N) [Padrao: S]"
if ($confirm220 -match "^[nN]") {
    Write-Host "Instalacao do Update 2.2 cancelada pelo usuario." -ForegroundColor Yellow
    $reportContent += "`r`n[STATUS] Abortado no Update 2.2 pelo usuario."
    [System.IO.File]::WriteAllLines($reportPath, $reportContent)
    exit 1
}

Write-Host "Executando Update 2.2. O script ira aguardar..." -ForegroundColor Cyan
try {
    $proc = Start-Process -FilePath $setupUpdate220Path -Verb RunAs -Wait -PassThru
    $reportContent += "Update 2.2 executado. Codigo de saida: $($proc.ExitCode)"
} catch {
    Write-Host "[ERRO CRITICO] Falha ao iniciar o Update 2.2: $_" -ForegroundColor Red
    $reportContent += "`r`n[STATUS] Erro ao rodar Update 2.2: $_"
    [System.IO.File]::WriteAllLines($reportPath, $reportContent)
    exit 1
}
Write-Host "Update 2.2 concluido!" -ForegroundColor Green
Write-Host ""

# ------------------------------------------------------------------------------
# 9. VALIDACAO FINAL
# ------------------------------------------------------------------------------
Write-Host "9. Executando validacao final de arquivos..." -ForegroundColor Yellow
$finalExecutable = Join-Path $gameInstallPath "FL_2026 start.exe"
$instalacaoSucesso = $false

if (Test-Path $finalExecutable) {
    Write-Host "======================================================================" -ForegroundColor Green
    Write-Host "   PARABENS! O SP FOOTBALL LIFE 2026 FOI INSTALADO E ATUALIZADO!     " -ForegroundColor Green
    Write-Host "======================================================================" -ForegroundColor Green
    Write-Host "O executavel principal do jogo foi validado com sucesso:" -ForegroundColor White
    Write-Host "  -> $finalExecutable" -ForegroundColor Green
    Write-Host "======================================================================" -ForegroundColor Green
    $reportContent += "`r`n[STATUS FINAL] Instalacao Concluida e Validada com Sucesso!"
    $instalacaoSucesso = $true
} else {
    Write-Host "======================================================================" -ForegroundColor Red
    Write-Host "   ATENCAO - INSTALACAO INCOMPLETA OU COM ERRO                       " -ForegroundColor Red
    Write-Host "======================================================================" -ForegroundColor Red
    Write-Host "O executavel principal do jogo ('FL_2026 start.exe') nao foi" -ForegroundColor White
    Write-Host "encontrado no caminho esperado: $gameInstallPath" -ForegroundColor Red
    Write-Host "======================================================================" -ForegroundColor Red
    $reportContent += "`r`n[STATUS FINAL] Erro: Executavel principal nao localizado apos instalacao."
}

# ------------------------------------------------------------------------------
# 10. LIMPEZA DOS ARQUIVOS TEMPORARIOS EXTRAIDOS
# ------------------------------------------------------------------------------
Write-Host ""
Write-Host "10. Limpeza de espaco em disco..." -ForegroundColor Yellow
Write-Host "As pastas temporarias de extracao estao consumindo bastante espaco:" -ForegroundColor Gray
Write-Host " - $baseExtractPath" -ForegroundColor Gray
Write-Host " - $update200ExtractPath" -ForegroundColor Gray
Write-Host " - $update220ExtractPath" -ForegroundColor Gray

$opcaoLimpar = Read-Host "Deseja excluir essas pastas temporarias de extracao agora? (S/N) [Padrao: S]"
if ([string]::IsNullOrWhiteSpace($opcaoLimpar) -or $opcaoLimpar -match "^[sS]") {
    Write-Host "Removendo pastas temporarias..." -ForegroundColor Cyan
    $pastas = @($baseExtractPath, $update200ExtractPath, $update220ExtractPath)
    foreach ($pasta in $pastas) {
        if (Test-Path $pasta) {
            Remove-Item -Path $pasta -Recurse -Force -ErrorAction SilentlyContinue
            Write-Host "  Pasta removida: $pasta" -ForegroundColor Green
        }
    }
    $reportContent += "Pastas temporarias excluidas pelo usuario para liberar espaco."
} else {
    Write-Host "Pastas temporarias mantidas no disco." -ForegroundColor Yellow
    $reportContent += "Pastas temporarias mantidas no disco pelo usuario."
}

# Gravar Relatorio TXT
[System.IO.File]::WriteAllLines($reportPath, $reportContent)
Write-Host ""
Write-Host "Relatorio de instalacao detalhado gerado em:" -ForegroundColor Cyan
Write-Host "  -> $reportPath" -ForegroundColor Green
Write-Host ""
Write-Host "Pressione qualquer tecla para fechar o script..."
$null = [System.Console]::ReadKey()
