param([string]$RepoRoot = "")
if ([string]::IsNullOrWhiteSpace($RepoRoot)) { $RepoRoot = (Get-Location).Path }
Set-Location $RepoRoot

. (Join-Path $RepoRoot "scripts/release/lib/common.ps1")
$config = Get-ReleaseConfig -RepoRoot $RepoRoot

$seedPath = Join-Path $RepoRoot "src/alicia/infrastructure/seed/catalog.seed.json"
if (-not (Test-Path $seedPath)) {
    Write-Host "FAIL:catalog_seed_missing"
    exit 1
}

$seed = Get-Content $seedPath -Raw | ConvertFrom-Json
$count = @($seed.doctors).Count
if ($count -lt $config.catalogMinProfiles) {
    Write-Host "FAIL:catalog_count:$count:min=$($config.catalogMinProfiles)"
    exit 1
}
Write-Host "OK:catalog_profiles:$count"

Write-Host "RUN:alicia catalog tests"
npx vitest run src/alicia/catalog/catalog.test.ts src/alicia/lib/coverage-report.test.ts
if ($LASTEXITCODE -ne 0) {
    Write-Host "FAIL:catalog_tests"
    exit 1
}

Write-Host "PASS:validate-catalog"
exit 0
