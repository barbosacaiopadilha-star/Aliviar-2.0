param([string]$RepoRoot = "")
if ([string]::IsNullOrWhiteSpace($RepoRoot)) { $RepoRoot = (Get-Location).Path }
Set-Location $RepoRoot

Write-Host "RUN:npm run test"
npm run test
if ($LASTEXITCODE -ne 0) {
    Write-Host "FAIL:tests"
    exit 1
}
Write-Host "PASS:validate-tests"
exit 0
