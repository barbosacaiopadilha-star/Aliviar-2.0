param([string]$RepoRoot = "")
if ([string]::IsNullOrWhiteSpace($RepoRoot)) { $RepoRoot = (Get-Location).Path }
Set-Location $RepoRoot

Write-Host "RUN:npm run lint"
npm run lint
if ($LASTEXITCODE -ne 0) {
    Write-Host "FAIL:lint"
    exit 1
}
Write-Host "PASS:validate-lint"
exit 0
