# AliCIA — Rollback de release
# Uso: powershell -ExecutionPolicy Bypass -File scripts/release/rollback.ps1

param(
    [string]$TargetTag = "",
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"

$RepoRoot = Split-Path $PSScriptRoot -Parent | Split-Path -Parent
Set-Location $RepoRoot
. (Join-Path $RepoRoot "scripts/release/lib/common.ps1")
$config = Get-ReleaseConfig -RepoRoot $RepoRoot

if ([string]::IsNullOrWhiteSpace($TargetTag)) {
    $TargetTag = $config.previousRcTag
}

Write-Step "Rollback — localizar release anterior" "warn"

git rev-parse "refs/tags/$TargetTag" 2>$null | Out-Null
if ($LASTEXITCODE -ne 0) {
    throw "Tag de rollback não encontrada: $TargetTag"
}

$targetCommit = git rev-parse "$TargetTag^{commit}"
$currentHead = git rev-parse HEAD
Write-Host "Tag alvo:    $TargetTag -> $targetCommit"
Write-Host "HEAD atual:  $currentHead"

if ($DryRun) {
    Write-Host "[DRY-RUN] Nenhuma alteração aplicada." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Para rollback Git (branch de release):"
    Write-Host "  git checkout $($config.releaseBranch)"
    Write-Host "  git reset --hard $targetCommit"
    Write-Host ""
    Write-Host "Para rollback Vercel (produção):"
    Write-Host "  1. Vercel Dashboard -> Deployments"
    Write-Host "  2. Selecionar deployment estável anterior"
    Write-Host "  3. Promote to Production"
    exit 0
}

Ensure-GitHubAuth

$branch = git branch --show-current
if ($branch -ne $config.releaseBranch) {
    Write-Host "Checkout: $($config.releaseBranch)" -ForegroundColor Yellow
    git checkout $config.releaseBranch
}

Write-Host "Reset --hard para $TargetTag ($targetCommit) ..." -ForegroundColor Yellow
git reset --hard $targetCommit

if (Test-CommandExists "vercel") {
    Write-Host ""
    Write-Host "Vercel CLI detectado. Para promover deployment anterior:" -ForegroundColor Cyan
    Write-Host "  vercel ls"
    Write-Host "  vercel promote <deployment-url>"
} else {
    Write-Host ""
    Write-Host "Rollback Git local concluído." -ForegroundColor Green
    Write-Host "Para produção, promova deployment anterior no Vercel Dashboard."
}

$report = @{
    action = "rollback"
    targetTag = $TargetTag
    targetCommit = $targetCommit
    previousHead = $currentHead
    at = (Get-Date).ToString("o")
}
$path = Write-JsonReport -RepoRoot $RepoRoot -FileName "rollback-$(Get-Date -Format 'yyyyMMdd-HHmmss').json" -Data $report
Write-Host "Relatório: $path" -ForegroundColor Green

Write-Host ""
Write-Host "Para publicar rollback no remote (se necessário):" -ForegroundColor Yellow
Write-Host "  git push --force-with-lease origin $($config.releaseBranch)"
Write-Host "  (Requer aprovação explícita — não executado automaticamente.)"
