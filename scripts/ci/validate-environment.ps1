param([string]$RepoRoot = "")
if ([string]::IsNullOrWhiteSpace($RepoRoot)) { $RepoRoot = (Get-Location).Path }
Set-Location $RepoRoot

$required = @("git", "node", "npm")
$optional = @("gh", "vercel", "curl")

foreach ($cmd in $required) {
    if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) {
        Write-Host "FAIL:required_missing:$cmd"
        exit 1
    }
    Write-Host "OK:required:$cmd"
}

foreach ($cmd in $optional) {
    if (Get-Command $cmd -ErrorAction SilentlyContinue) {
        Write-Host "OK:optional:$cmd"
    } else {
        Write-Host "WARN:optional_missing:$cmd"
    }
}

$nodeVersion = node -v
$npmVersion = npm -v
Write-Host "OK:node:$nodeVersion"
Write-Host "OK:npm:$npmVersion"
Write-Host "PASS:validate-environment"
exit 0
