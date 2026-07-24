param([string]$RepoRoot = "")
if ([string]::IsNullOrWhiteSpace($RepoRoot)) { $RepoRoot = (Get-Location).Path }
Set-Location $RepoRoot

. (Join-Path $RepoRoot "scripts/release/lib/common.ps1")
$config = Get-ReleaseConfig -RepoRoot $RepoRoot

$branch = git branch --show-current
if ($branch -ne $config.releaseBranch) {
    Write-Host "FAIL:wrong_branch:expected=$($config.releaseBranch):actual=$branch"
    exit 1
}
Write-Host "OK:branch:$branch"

$head = git rev-parse HEAD
Write-Host "OK:head:$head"

$mergeBase = git merge-base $config.releaseBaseCommit HEAD 2>$null
if ($LASTEXITCODE -ne 0 -or $mergeBase -ne (git rev-parse $config.releaseBaseCommit)) {
    Write-Host "FAIL:not_descendant_of_release_base:$($config.releaseBaseCommit)"
    exit 1
}
Write-Host "OK:descendant_of:$($config.releaseBaseCommit)"

Write-Host "PASS:validate-branch"
exit 0
