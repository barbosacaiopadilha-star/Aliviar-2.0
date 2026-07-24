# AliCIA — Release orchestrator (comando único de deploy)
# Uso: powershell -ExecutionPolicy Bypass -File scripts/release/release.ps1

param(
    [switch]$SkipBuild,
    [switch]$SkipPush,
    [switch]$SkipDeployWait,
    [switch]$SkipSmoke,
    [switch]$SkipPr
)

$ErrorActionPreference = "Stop"

$RepoRoot = Split-Path $PSScriptRoot -Parent | Split-Path -Parent
Set-Location $RepoRoot
. (Join-Path $RepoRoot "scripts/release/lib/common.ps1")
$config = Get-ReleaseConfig -RepoRoot $RepoRoot

$startedAt = Get-Date
$report = [ordered]@{
    startedAt = $startedAt.ToString("o")
    repoRoot = $RepoRoot
    steps = @()
}

function Add-StepResult {
    param([string]$Name, [bool]$Ok, [string]$Detail = "")
    $report.steps += @{ name = $Name; ok = $Ok; detail = $Detail; at = (Get-Date).ToString("o") }
}

try {
    Write-Step "1/12 — Validar ambiente"
    Invoke-ValidateScript $RepoRoot "scripts/ci/validate-environment.ps1" "ambiente"
    Add-StepResult "validate-environment" $true

    Write-Step "2/12 — Validar Git"
    Invoke-ValidateScript $RepoRoot "scripts/ci/validate-git.ps1" "git"
    Add-StepResult "validate-git" $true

    Write-Step "3/12 — Validar branch"
    Invoke-ValidateScript $RepoRoot "scripts/ci/validate-branch.ps1" "branch"
    Add-StepResult "validate-branch" $true

    Write-Step "4/12 — Validar tags"
    Invoke-ValidateScript $RepoRoot "scripts/ci/validate-tags.ps1" "tags"
    Add-StepResult "validate-tags" $true

    Write-Step "5/12 — Validar release"
    Invoke-ValidateScript $RepoRoot "scripts/ci/validate-release.ps1" "release"
    Add-StepResult "validate-release" $true

    Write-Step "6/12 — Validar Studio"
    Invoke-ValidateScript $RepoRoot "scripts/ci/validate-studio.ps1" "studio"
    Add-StepResult "validate-studio" $true

    Write-Step "7/12 — Validar catálogo"
    Invoke-ValidateScript $RepoRoot "scripts/ci/validate-catalog.ps1" "catalog"
    Add-StepResult "validate-catalog" $true

    Write-Step "8/12 — Validar documentação"
    Invoke-ValidateScript $RepoRoot "scripts/ci/validate-docs.ps1" "docs"
    Add-StepResult "validate-docs" $true

    if (-not $SkipBuild) {
        Write-Step "9/12 — Quality gates (test, lint, typecheck, build)"
        Invoke-ValidateScript $RepoRoot "scripts/ci/validate-tests.ps1" "tests"
        Invoke-ValidateScript $RepoRoot "scripts/ci/validate-lint.ps1" "lint"
        Invoke-ValidateScript $RepoRoot "scripts/ci/validate-typecheck.ps1" "typecheck"
        Invoke-ValidateScript $RepoRoot "scripts/ci/validate-build.ps1" "build"
        Add-StepResult "quality-gates" $true
    } else {
        Write-Host "SKIP:quality-gates" -ForegroundColor Yellow
        Add-StepResult "quality-gates" $true "skipped"
    }

    Write-Step "10/12 — Autenticação GitHub"
    Ensure-GitHubAuth
    Add-StepResult "github-auth" $true

    if (-not $SkipPush) {
        Write-Step "11/12 — Repositório remoto, push e tags"
        $repoFull = Ensure-RemoteRepo -RepoRoot $RepoRoot -Config $config

        git push -u origin $config.releaseBranch
        if ($LASTEXITCODE -ne 0) { throw "git push branch falhou" }
        Write-Host "OK:push_branch:$($config.releaseBranch)"

        git push origin $config.releaseTag
        if ($LASTEXITCODE -ne 0) { throw "git push tag $($config.releaseTag) falhou" }
        Write-Host "OK:push_tag:$($config.releaseTag)"

        git push origin $config.previousRcTag
        if ($LASTEXITCODE -ne 0) {
            Write-Host "WARN:push_tag:$($config.previousRcTag) (opcional)" -ForegroundColor Yellow
        } else {
            Write-Host "OK:push_tag:$($config.previousRcTag)"
        }
        Add-StepResult "push" $true $repoFull
    } else {
        Write-Host "SKIP:push" -ForegroundColor Yellow
        Add-StepResult "push" $true "skipped"
    }

    if (-not $SkipDeployWait) {
        Write-Step "12/12 — Aguardar deploy Vercel"
        & (Join-Path $RepoRoot "scripts/vercel/wait-deploy.ps1") -RepoRoot $RepoRoot
        $deployOk = ($LASTEXITCODE -eq 0)
        Add-StepResult "wait-deploy" $deployOk $(if ($deployOk) { "live" } else { "timeout" })
        if (-not $deployOk) {
            Write-Host "Deploy não confirmado — continuando smoke test mesmo assim." -ForegroundColor Yellow
        }
    } else {
        Add-StepResult "wait-deploy" $true "skipped"
    }

    if (-not $SkipSmoke) {
        Write-Step "Smoke test produção"
        node (Join-Path $RepoRoot "scripts/vercel/smoke-production.mjs")
        $smokeOk = ($LASTEXITCODE -eq 0)
        Add-StepResult "smoke-production" $smokeOk
        if (-not $smokeOk) { throw "Smoke test de produção falhou" }
    }

    if (-not $SkipPr) {
        Write-Step "Abrir Pull Request"
        $existing = gh pr list --head $config.releaseBranch --json number --jq ".[0].number" 2>$null
        if ($existing) {
            Write-Host "PR já existe: #$existing" -ForegroundColor Green
            gh pr view $existing --web 2>$null | Out-Null
            Add-StepResult "pull-request" $true "existing:#$existing"
        } else {
            $body = @"
## Release Candidate — AliCIA $($config.releaseTag)

- Branch: ``$($config.releaseBranch)``
- Base tag: ``$($config.releaseBaseCommit)``
- Studio bloqueado em produção
- Quality gates executados pelo pipeline ``scripts/release/release.ps1``

**Não fazer merge sem aprovação final.**
"@
            gh pr create --base $config.prBase --head $config.releaseBranch --title $config.prTitle --body $body
            if ($LASTEXITCODE -ne 0) { throw "gh pr create falhou" }
            Add-StepResult "pull-request" $true "created"
        }
    }

    $report.finishedAt = (Get-Date).ToString("o")
    $report.success = $true
    $reportPath = Write-JsonReport -RepoRoot $RepoRoot -FileName "release-$(Get-Date -Format 'yyyyMMdd-HHmmss').json" -Data $report

    Write-Step "Release concluída" "ok"
    Write-Host "Relatório: $reportPath" -ForegroundColor Green
    Write-Host "PR aberto — aguardando aprovação final (sem merge)." -ForegroundColor Yellow
    exit 0
}
catch {
    $report.finishedAt = (Get-Date).ToString("o")
    $report.success = $false
    $report.error = $_.Exception.Message
    $null = Write-JsonReport -RepoRoot $RepoRoot -FileName "release-FAILED-$(Get-Date -Format 'yyyyMMdd-HHmmss').json" -Data $report
    Write-Step "Release falhou: $($_.Exception.Message)" "fail"
    exit 1
}
