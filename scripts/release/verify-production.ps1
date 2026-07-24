# AliCIA — Verificação de produção
# Uso: powershell -ExecutionPolicy Bypass -File scripts/release/verify-production.ps1

param(
    [string]$ProductionUrl = ""
)

$ErrorActionPreference = "Stop"

$RepoRoot = Split-Path $PSScriptRoot -Parent | Split-Path -Parent
Set-Location $RepoRoot
. (Join-Path $RepoRoot "scripts/release/lib/common.ps1")
$config = Get-ReleaseConfig -RepoRoot $RepoRoot

if ([string]::IsNullOrWhiteSpace($ProductionUrl)) {
    $ProductionUrl = $config.productionUrl
}

Write-Step "Verificação de produção: $ProductionUrl"

$meta = @{}
try {
    $response = Invoke-WebRequest -Uri $ProductionUrl -Method Head -MaximumRedirection 0 -ErrorAction SilentlyContinue
    $meta.rootStatus = [int]$response.StatusCode
} catch {
    if ($_.Exception.Response) {
        $meta.rootStatus = [int]$_.Exception.Response.StatusCode
    }
}

$meta.headCommit = git rev-parse --short HEAD 2>$null
$meta.releaseBranch = git branch --show-current
$meta.releaseTag = $config.releaseTag
$meta.checkedAt = (Get-Date).ToString("o")

Write-Host "HEAD local:        $($meta.headCommit)"
Write-Host "Branch local:      $($meta.releaseBranch)"
Write-Host "Release tag:       $($meta.releaseTag)"
Write-Host "URL produção:      $ProductionUrl"
Write-Host ""

Write-Host "Executando smoke test HTTP ..." -ForegroundColor Cyan
$env:PRODUCTION_URL = $ProductionUrl
node (Join-Path $RepoRoot "scripts/vercel/smoke-production.mjs") $ProductionUrl
$smokeOk = ($LASTEXITCODE -eq 0)

$report = @{
    tipo = "verify-production"
    productionUrl = $ProductionUrl
    smokeOk = $smokeOk
    meta = $meta
    gerado_em = $meta.checkedAt
}

$reportPath = Write-JsonReport -RepoRoot $RepoRoot -FileName "verify-production-$(Get-Date -Format 'yyyyMMdd-HHmmss').json" -Data $report

Write-Host ""
if ($smokeOk) {
    Write-Step "Produção VERDE" "ok"
    exit 0
} else {
    Write-Step "Produção VERMELHA" "fail"
    Write-Host "Relatório: $reportPath"
    exit 1
}
