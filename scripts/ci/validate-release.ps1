param([string]$RepoRoot = "")
if ([string]::IsNullOrWhiteSpace($RepoRoot)) { $RepoRoot = (Get-Location).Path }
Set-Location $RepoRoot

. (Join-Path $RepoRoot "scripts/release/lib/common.ps1")
$config = Get-ReleaseConfig -RepoRoot $RepoRoot

$head = git rev-parse HEAD
$base = git rev-parse $config.releaseBaseCommit

if ($head -eq $base) {
    Write-Host "WARN:head_equals_base:studio_fix_may_be_missing"
}

$log = git log --oneline "$base..HEAD"
if ($log) {
    Write-Host "OK:commits_since_base:"
    $log | ForEach-Object { Write-Host "  $_" }
}

foreach ($file in $config.studioBlockFiles) {
    if (-not (Test-Path (Join-Path $RepoRoot $file))) {
        Write-Host "FAIL:studio_file_missing:$file"
        exit 1
    }
    Write-Host "OK:studio_file:$file"
}

$layout = Get-Content (Join-Path $RepoRoot "src/app/alicia/studio/layout.tsx") -Raw
if ($layout -notmatch "notFound") {
    Write-Host "FAIL:studio_layout_missing_notFound"
    exit 1
}
Write-Host "OK:studio_blocked_in_layout"

Write-Host "PASS:validate-release"
exit 0
