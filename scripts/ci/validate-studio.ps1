param([string]$RepoRoot = "")
if ([string]::IsNullOrWhiteSpace($RepoRoot)) { $RepoRoot = (Get-Location).Path }
Set-Location $RepoRoot

. (Join-Path $RepoRoot "scripts/release/lib/common.ps1")
$config = Get-ReleaseConfig -RepoRoot $RepoRoot

foreach ($file in $config.studioBlockFiles) {
    $full = Join-Path $RepoRoot $file
    if (-not (Test-Path $full)) {
        Write-Host "FAIL:missing:$file"
        exit 1
    }
    Write-Host "OK:file:$file"
}

$accessFile = Join-Path $RepoRoot "src/alicia/studio/studio-access.ts"
$content = Get-Content $accessFile -Raw
if ($content -notmatch "NODE_ENV") {
    Write-Host "FAIL:studio_access_missing_production_check"
    exit 1
}
Write-Host "OK:studio_access_production_guard"

Write-Host "RUN:studio unit tests"
npx vitest run src/alicia/studio/studio-access.test.ts
if ($LASTEXITCODE -ne 0) {
    Write-Host "FAIL:studio_tests"
    exit 1
}

Write-Host "PASS:validate-studio"
exit 0
