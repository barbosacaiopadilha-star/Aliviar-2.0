param([string]$RepoRoot = "")
if ([string]::IsNullOrWhiteSpace($RepoRoot)) { $RepoRoot = (Get-Location).Path }
Set-Location $RepoRoot

if (-not (Test-Path ".git")) {
    Write-Host "FAIL:not_a_git_repo"
    exit 1
}
Write-Host "OK:git_repo"

$remotes = git remote
if ($remotes -notcontains "origin") {
    Write-Host "WARN:no_origin_remote"
} else {
    $url = git remote get-url origin
    Write-Host "OK:origin:$url"
}

$porcelain = git status --porcelain
$allowedUntracked = @(
    "RELEASE_EXECUTION.md",
    "RELEASE_RECOVERY_FINAL.md",
    "DEPLOY_FINAL_REPORT.md",
    "DEPLOY_AUTOMATION.md",
    "scripts/release/reports/"
)

$blocking = @()
foreach ($line in ($porcelain -split "`n")) {
    if ([string]::IsNullOrWhiteSpace($line)) { continue }
    $path = $line.Substring(3).Trim()
    $isAllowed = $false
    foreach ($allowed in $allowedUntracked) {
        if ($path -eq $allowed -or $path.StartsWith($allowed)) {
            $isAllowed = $true
            break
        }
    }
    if (-not $isAllowed) {
        $blocking += $line
    }
}

if ($blocking.Count -gt 0) {
    Write-Host "FAIL:dirty_working_tree"
    $blocking | ForEach-Object { Write-Host "  $_" }
    exit 1
}

Write-Host "OK:working_tree_clean"
Write-Host "PASS:validate-git"
exit 0
