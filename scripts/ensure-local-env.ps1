param(
    [string]$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
)

$envFilePath = Join-Path $ProjectRoot '.env.local'
$debugConfigPath = Join-Path $ProjectRoot 'public\debug-sync.html'

$requiredKeyMap = [ordered]@{
    VITE_FIREBASE_API_KEY = 'apiKey'
    VITE_FIREBASE_AUTH_DOMAIN = 'authDomain'
    VITE_FIREBASE_PROJECT_ID = 'projectId'
    VITE_FIREBASE_STORAGE_BUCKET = 'storageBucket'
    VITE_FIREBASE_MESSAGING_SENDER_ID = 'messagingSenderId'
    VITE_FIREBASE_APP_ID = 'appId'
}

$optionalKeys = @(
    'VITE_FIREBASE_MEASUREMENT_ID',
    'VITE_GEMINI_API_KEY'
)

function Read-EnvFile {
    param([string]$Path)

    $result = @{}
    if (-not (Test-Path $Path)) {
        return $result
    }

    foreach ($line in Get-Content $Path) {
        if ([string]::IsNullOrWhiteSpace($line)) {
            continue
        }

        $trimmed = $line.Trim()
        if ($trimmed.StartsWith('#')) {
            continue
        }

        $separatorIndex = $line.IndexOf('=')
        if ($separatorIndex -lt 1) {
            continue
        }

        $key = $line.Substring(0, $separatorIndex).Trim()
        $value = $line.Substring($separatorIndex + 1)
        $result[$key] = $value
    }

    return $result
}

function Read-DebugFirebaseConfig {
    param([string]$Path)

    $result = @{}
    if (-not (Test-Path $Path)) {
        return $result
    }

    $content = Get-Content $Path -Raw
    $patterns = @{
        apiKey = 'apiKey:\s*"([^"]+)"'
        authDomain = 'authDomain:\s*"([^"]+)"'
        projectId = 'projectId:\s*"([^"]+)"'
        storageBucket = 'storageBucket:\s*"([^"]+)"'
        messagingSenderId = 'messagingSenderId:\s*"([^"]+)"'
        appId = 'appId:\s*"([^"]+)"'
        measurementId = 'measurementId:\s*"([^"]+)"'
    }

    foreach ($property in $patterns.Keys) {
        $match = [regex]::Match($content, $patterns[$property])
        if ($match.Success) {
            $result[$property] = $match.Groups[1].Value
        }
    }

    return $result
}

function Get-MissingRequiredKeys {
    param([hashtable]$Values)

    return @(
        foreach ($key in $requiredKeyMap.Keys) {
            if (-not $Values.ContainsKey($key) -or [string]::IsNullOrWhiteSpace([string]$Values[$key])) {
                $key
            }
        }
    )
}

function Write-EnvFile {
    param(
        [string]$Path,
        [hashtable]$Values
    )

    $orderedKeys = @($requiredKeyMap.Keys) + $optionalKeys
    $lines = @(
        '# Gerado automaticamente para desenvolvimento local.'
        '# Revise os valores abaixo se precisar apontar para outro ambiente.'
        ''
    )

    foreach ($key in $orderedKeys) {
        $value = ''
        if ($Values.ContainsKey($key)) {
            $value = [string]$Values[$key]
        }

        $lines += '{0}={1}' -f $key, $value
    }

    $extraKeys = @(
        $Values.Keys |
        Where-Object { $orderedKeys -notcontains $_ } |
        Sort-Object
    )

    if ($extraKeys.Count -gt 0) {
        $lines += ''
        $lines += '# Chaves adicionais preservadas do arquivo anterior.'

        foreach ($key in $extraKeys) {
            $lines += '{0}={1}' -f $key, [string]$Values[$key]
        }
    }

    Set-Content -Path $Path -Value $lines -Encoding ascii
}

$values = Read-EnvFile -Path $envFilePath
$sourcesUsed = New-Object System.Collections.Generic.List[string]

if ((Get-MissingRequiredKeys -Values $values).Count -eq 0) {
    Write-Host '.env.local ja esta completo.'
    exit 0
}

foreach ($key in $requiredKeyMap.Keys + $optionalKeys) {
    if ($values.ContainsKey($key) -and -not [string]::IsNullOrWhiteSpace([string]$values[$key])) {
        continue
    }

    $envValue = [Environment]::GetEnvironmentVariable($key)
    if ([string]::IsNullOrWhiteSpace($envValue) -and $key -eq 'VITE_GEMINI_API_KEY') {
        $envValue = [Environment]::GetEnvironmentVariable('GEMINI_API_KEY')
    }
    if (-not [string]::IsNullOrWhiteSpace($envValue)) {
        $values[$key] = $envValue
        if (-not $sourcesUsed.Contains('variaveis do sistema')) {
            $null = $sourcesUsed.Add('variaveis do sistema')
        }
    }
}

$debugConfig = Read-DebugFirebaseConfig -Path $debugConfigPath
foreach ($entry in $requiredKeyMap.GetEnumerator()) {
    if ($values.ContainsKey($entry.Key) -and -not [string]::IsNullOrWhiteSpace([string]$values[$entry.Key])) {
        continue
    }

    if ($debugConfig.ContainsKey($entry.Value) -and -not [string]::IsNullOrWhiteSpace([string]$debugConfig[$entry.Value])) {
        $values[$entry.Key] = [string]$debugConfig[$entry.Value]
        if (-not $sourcesUsed.Contains('public/debug-sync.html')) {
            $null = $sourcesUsed.Add('public/debug-sync.html')
        }
    }
}

if (-not $values.ContainsKey('VITE_FIREBASE_MEASUREMENT_ID') -and $debugConfig.ContainsKey('measurementId')) {
    $values['VITE_FIREBASE_MEASUREMENT_ID'] = [string]$debugConfig['measurementId']
}

foreach ($key in $optionalKeys) {
    if (-not $values.ContainsKey($key)) {
        $values[$key] = ''
    }
}

Write-EnvFile -Path $envFilePath -Values $values

$missingRequiredKeys = Get-MissingRequiredKeys -Values $values
if ($missingRequiredKeys.Count -gt 0) {
    Write-Host '.env.local foi criado/atualizado, mas ainda faltam chaves obrigatorias:' -ForegroundColor Yellow
    foreach ($missingKey in $missingRequiredKeys) {
        Write-Host " - $missingKey" -ForegroundColor Yellow
    }
    exit 1
}

if ($sourcesUsed.Count -gt 0) {
    Write-Host ('.env.local pronto usando: {0}.' -f ($sourcesUsed -join ', '))
} else {
    Write-Host '.env.local pronto.'
}
