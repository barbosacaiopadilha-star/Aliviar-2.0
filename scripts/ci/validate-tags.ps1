param([string]$RepoRoot = "")
if ([string]::IsNullOrWhiteSpace($RepoRoot)) { $RepoRoot = (Get-Location).Path }
Set-Location $RepoRoot

. (Join-Path $RepoRoot "scripts/release/lib/common.ps1")
$config = Get-ReleaseConfig -RepoRoot $RepoRoot

$tags = @($config.releaseTag, $config.previousRcTag)
foreach ($tag in $tags) {
    git rev-parse "refs/tags/$tag" 2>$null | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "FAIL:tag_missing:$tag"
        exit 1
    }
    $commit = git rev-parse "$tag^{commit}"
    Write-Host "OK:tag:$tag->$commit"
}

$releaseCommit = git rev-parse "$($config.releaseTag)^{commit}"
$baseCommit = git rev-parse $config.releaseBaseCommit
if ($releaseCommit -ne $baseCommit) {
    Write-Host "FAIL:release_tag_mismatch:tag=$releaseCommit:expected=$baseCommit"
    exit 1
}
Write-Host "OK:release_tag_points_to_base"

Write-Host "PASS:validate-tags"
exit 0
