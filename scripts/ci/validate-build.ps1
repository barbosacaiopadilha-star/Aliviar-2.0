param([string]$RepoRoot = "")
if ([string]::IsNullOrWhiteSpace($RepoRoot)) { $RepoRoot = (Get-Location).Path }
Set-Location $RepoRoot

Write-Host "RUN:npm run build"
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "FAIL:build"
    exit 1
}
Write-Host "PASS:validate-build"
exit 0
