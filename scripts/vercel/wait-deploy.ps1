param(
    [string]$RepoRoot = "",
    [string]$ProductionUrl = "",
    [int]$TimeoutMinutes = 0
)

if ([string]::IsNullOrWhiteSpace($RepoRoot)) { $RepoRoot = (Get-Location).Path }
Set-Location $RepoRoot

. (Join-Path $RepoRoot "scripts/release/lib/common.ps1")
$config = Get-ReleaseConfig -RepoRoot $RepoRoot

if ([string]::IsNullOrWhiteSpace($ProductionUrl)) {
    $ProductionUrl = $config.productionUrl
}
if ($TimeoutMinutes -le 0) {
    $TimeoutMinutes = [int]$config.deployTimeoutMinutes
}

$pollSeconds = [int]$config.deployPollSeconds
$deadline = (Get-Date).AddMinutes($TimeoutMinutes)
$head = git rev-parse --short HEAD

Write-Host "Aguardando deploy em $ProductionUrl (commit ~$head) ..." -ForegroundColor Cyan

while ((Get-Date) -lt $deadline) {
    try {
        $response = Invoke-WebRequest -Uri "$ProductionUrl/alicia" -Method Head -MaximumRedirection 0 -ErrorAction SilentlyContinue
        $status = [int]$response.StatusCode
    } catch {
        if ($_.Exception.Response) {
            $status = [int]$_.Exception.Response.StatusCode
        } else {
            $status = 0
        }
    }

    if ($status -eq 200) {
        Write-Host "OK:deploy_live:/alicia -> 200" -ForegroundColor Green
        exit 0
    }

    Write-Host "  aguardando... /alicia -> $status ($(Get-Date -Format 'HH:mm:ss'))" -ForegroundColor DarkGray
    Start-Sleep -Seconds $pollSeconds
}

Write-Host "WARN:deploy_timeout:AliCIA ainda não responde 200 em $ProductionUrl" -ForegroundColor Yellow
Write-Host "Verifique Vercel Dashboard e se o projeto está conectado ao repositório."
exit 1
