# ============================================
# MULEMBE18 - AUTOMATED GITHUB PUSH SCRIPT
# ============================================

$ErrorActionPreference = "Stop"

$RepoUrl = "https://github.com/jakommatin-design/mulembe_nation.git"
$Branch = "main"

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "       MULEMBE18 GITHUB DEPLOYMENT" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""

try {
    # 1. Check Git installation
    if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
        throw "Git is not installed or is not available in PATH."
    }

    Write-Host "[1/7] Git installation verified." -ForegroundColor Green

    # 2. Select project folder
    $ProjectPath = Read-Host "Enter the full path to your mulembe18 project folder (press Enter to use the current folder)"

    if ([string]::IsNullOrWhiteSpace($ProjectPath)) {
        $ProjectPath = Get-Location
    }

    if (-not (Test-Path -LiteralPath $ProjectPath -PathType Container)) {
        throw "The specified project folder does not exist."
    }

    Set-Location -LiteralPath $ProjectPath

    Write-Host "[2/7] Project folder selected: $((Get-Location).Path)" -ForegroundColor Green

    # 3. Initialize Git if necessary
    if (-not (Test-Path ".git")) {
        git init
        if ($LASTEXITCODE -ne 0) {
            throw "Git initialization failed."
        }
    }

    git branch -M $Branch
    if ($LASTEXITCODE -ne 0) {
        throw "Could not configure the main branch."
    }

    Write-Host "[3/7] Git repository initialized." -ForegroundColor Green

    # 4. Create README if missing
    if (-not (Test-Path "README.md")) {
        "# mulembe18" | Set-Content -Path "README.md" -Encoding utf8
    }

    # 5. Configure the GitHub remote
    $ExistingRemote = git remote get-url origin 2>$null

    if ($LASTEXITCODE -eq 0 -and $ExistingRemote) {
        git remote set-url origin $RepoUrl
    }
    else {
        git remote add origin $RepoUrl
    }

    if ($LASTEXITCODE -ne 0) {
        throw "Could not configure the GitHub remote."
    }

    Write-Host "[4/7] GitHub remote configured." -ForegroundColor Green

    # 6. Stage and commit project files
    git add -A

    if ($LASTEXITCODE -ne 0) {
        throw "Could not stage project files."
    }

    git diff --cached --quiet

    if ($LASTEXITCODE -eq 1) {
        git commit -m "Update mulembe18 project"

        if ($LASTEXITCODE -ne 0) {
            throw "Commit failed. Check your Git username and email configuration."
        }

        Write-Host "[5/7] Project changes committed." -ForegroundColor Green
    }
    elseif ($LASTEXITCODE -eq 0) {
        Write-Host "[5/7] No new changes to commit." -ForegroundColor Yellow
    }
    else {
        throw "Could not check staged changes."
    }

    # 7. Authenticate and push
    Write-Host ""
    Write-Host "Preparing to push your project to GitHub..." -ForegroundColor Cyan
    Write-Host "If prompted, authenticate using your GitHub credentials." -ForegroundColor Yellow
    Write-Host "A secure credential manager or browser sign-in is recommended." -ForegroundColor Yellow
    Write-Host ""

    git push -u origin $Branch

    if ($LASTEXITCODE -ne 0) {
        throw "Push failed. Check authentication, repository permissions, and remote branch history."
    }

    Write-Host ""
    Write-Host "==========================================" -ForegroundColor Green
    Write-Host "       PROJECT PUSH SUCCESSFUL!" -ForegroundColor Green
    Write-Host "==========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Repository: $RepoUrl" -ForegroundColor Cyan
    Write-Host "Branch:     $Branch" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Your project has been pushed to GitHub." -ForegroundColor Green
}
catch {
    Write-Host ""
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Review the error, correct the issue, and run the script again." -ForegroundColor Yellow
}