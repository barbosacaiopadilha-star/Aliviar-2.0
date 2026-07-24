param([string]$RepoRoot = "")
if ([string]::IsNullOrWhiteSpace($RepoRoot)) { $RepoRoot = (Get-Location).Path }
Set-Location $RepoRoot

. (Join-Path $RepoRoot "scripts/release/lib/common.ps1")
$config = Get-ReleaseConfig -RepoRoot $RepoRoot

foreach ($doc in $config.requiredDocs) {
    $full = Join-Path $RepoRoot $doc
    if (-not (Test-Path $full)) {
        Write-Host "FAIL:doc_missing:$doc"
        exit 1
    }
    $size = (Get-Item $full).Length
    if ($size -lt 50) {
        Write-Host "FAIL:doc_too_small:$doc"
        exit 1
    }
    Write-Host "OK:doc:$doc"
}

Write-Host "PASS:validate-docs"
exit 0
