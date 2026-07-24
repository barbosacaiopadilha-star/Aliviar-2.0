# Shared helpers for AliCIA release automation.

function Get-RepoRoot {
    $root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
    if (-not (Test-Path (Join-Path $root "package.json"))) {
        throw "Raiz do repositório não encontrada: $root"
    }
    return (Resolve-Path $root).Path
}

function Get-ReleaseConfig {
    param([string]$RepoRoot)
    $configPath = Join-Path $RepoRoot "scripts/release/release-config.json"
    if (-not (Test-Path $configPath)) {
        throw "Configuração ausente: $configPath"
    }
    return Get-Content $configPath -Raw | ConvertFrom-Json
}

function Write-Step {
    param(
        [string]$Message,
        [ValidateSet("info", "ok", "warn", "fail")]
        [string]$Level = "info"
    )
    $color = switch ($Level) {
        "ok" { "Green" }
        "warn" { "Yellow" }
        "fail" { "Red" }
        default { "Cyan" }
    }
    Write-Host ""
    Write-Host "=== $Message ===" -ForegroundColor $color
}

function Invoke-ValidateScript {
    param(
        [string]$RepoRoot,
        [string]$ScriptRelativePath,
        [string]$Label
    )
    $scriptPath = Join-Path $RepoRoot $ScriptRelativePath
    if (-not (Test-Path $scriptPath)) {
        throw "Script de validação ausente: $scriptPath"
    }
    Write-Host "→ $Label" -ForegroundColor DarkGray
    & $scriptPath -RepoRoot $RepoRoot
    if ($LASTEXITCODE -ne 0) {
        throw "Validação falhou: $Label"
    }
}

function Test-CommandExists {
    param([string]$Name)
    return [bool](Get-Command $Name -ErrorAction SilentlyContinue)
}

function Ensure-GitHubAuth {
    if (-not (Test-CommandExists "gh")) {
        throw "GitHub CLI (gh) não instalado. Instale: winget install GitHub.cli"
    }

    gh auth status 2>$null | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "GitHub: autenticado." -ForegroundColor Green
        return
    }

    Write-Host ""
    Write-Host "Execute:" -ForegroundColor Yellow
    Write-Host "gh auth login"
    Write-Host "e pressione ENTER."
    Write-Host ""
    Read-Host "Pressione ENTER após autenticar"

    gh auth status 2>$null | Out-Null
    if ($LASTEXITCODE -ne 0) {
        throw "Autenticação GitHub ainda inválida após pausa."
    }
    Write-Host "GitHub: autenticado." -ForegroundColor Green
}

function Get-GitHubOwner {
    $login = gh api user --jq .login 2>$null
    if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($login)) {
        throw "Não foi possível obter o usuário GitHub autenticado."
    }
    return $login.Trim()
}

function Get-RepoFullName {
    param(
        [object]$Config
    )
    $owner = Get-GitHubOwner
    return "$owner/$($Config.repoName)"
}

function Test-RemoteRepoExists {
    param([string]$RepoFullName)
    gh repo view $RepoFullName 2>$null | Out-Null
    return ($LASTEXITCODE -eq 0)
}

function Ensure-RemoteRepo {
    param(
        [string]$RepoRoot,
        [object]$Config
    )
    $repoFull = Get-RepoFullName -Config $Config

    if (Test-RemoteRepoExists -RepoFullName $repoFull) {
        Write-Host "Repositório remoto: $repoFull (existe)" -ForegroundColor Green
        return $repoFull
    }

    Write-Host "Repositório remoto não encontrado — criando $repoFull ..." -ForegroundColor Yellow
    Push-Location $RepoRoot
    try {
        gh repo create $Config.repoName --private --source=. --remote=origin `
            --description "Aliviar OS — AliCIA" 2>&1 | Write-Host
        if ($LASTEXITCODE -ne 0) {
            throw "gh repo create falhou. Verifique permissões da conta e se o nome já está em uso."
        }
    }
    finally {
        Pop-Location
    }

    if (-not (Test-RemoteRepoExists -RepoFullName $repoFull)) {
        throw "Repositório criado mas ainda inacessível: $repoFull"
    }

    Write-Host "Repositório criado: $repoFull" -ForegroundColor Green
    return $repoFull
}

function Write-JsonReport {
    param(
        [string]$RepoRoot,
        [string]$FileName,
        [object]$Data
    )
    $dir = Join-Path $RepoRoot "scripts/release/reports"
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
    $path = Join-Path $dir $FileName
    $Data | ConvertTo-Json -Depth 10 | Set-Content -Path $path -Encoding UTF8
    return $path
}
