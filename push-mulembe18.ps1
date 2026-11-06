# Mulembe18 GitHub Push Script

$ErrorActionPreference = "Stop"

$RepoUrl = "https://github.com/jakommatin-design/mulembe_nation.git"
$Branch = "main"

try {
    if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
        throw "Git is not installed."
    }

    Set-Location "c:\Users\Admin\Desktop\mulembe18"

    Write-Host "Checking Git repository..." -ForegroundColor Cyan

    if (-not (Test-Path ".git")) {
        git init
        if ($LASTEXITCODE -ne 0) { throw "Git initialization failed." }
    }

    if (-not (Test-Path "README.md")) {
        "# mulembe18" | Set-Content "README.md"
    }

    git branch -M $Branch
    if ($LASTEXITCODE -ne 0) { throw "Branch setup failed." }

    # Configure origin safely, whether it exists or not
    $remotes = git remote
    if ($LASTEXITCODE -ne 0) { throw "Could not inspect Git remotes." }

    if ($remotes -contains "origin") {
        git remote set-url origin $RepoUrl
    }
    else {
        git remote add origin $RepoUrl
    }

    if ($LASTEXITCODE -ne 0) { throw "Could not configure GitHub remote." }

    Write-Host "Staging project files..." -ForegroundColor Cyan
    git add -A
    if ($LASTEXITCODE -ne 0) { throw "Staging files failed." }

    git diff --cached --quiet

    if ($LASTEXITCODE -eq 1) {
        git commit -m "Update mulembe18 website"
        if ($LASTEXITCODE -ne 0) {
            throw "Commit failed. Configure your Git username and email if requested."
        }
    }
    elseif ($LASTEXITCODE -ne 0) {
        throw "Could not inspect staged changes."
    }
    else {
        Write-Host "No new changes to commit." -ForegroundColor Yellow
    }

    Write-Host "Pushing to GitHub..." -ForegroundColor Cyan
    git push -u origin $Branch

    if ($LASTEXITCODE -ne 0) {
        throw "Push failed. Check authentication, repository permissions, and remote history."
    }

    Write-Host "SUCCESS: Project pushed to GitHub!" -ForegroundColor Green
    Write-Host $RepoUrl
}
catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
}