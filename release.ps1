#!/usr/bin/env pwsh
# Deploy: develop -> staging -> main, then return to develop

$ErrorActionPreference = "Stop"

function Step($msg) {
    Write-Host "`n==> $msg" -ForegroundColor Cyan
}

try {
    Step "Pushing develop"
    git push origin develop

    Step "Merging develop -> staging"
    git checkout staging
    git merge develop
    git push origin staging

    Step "Merging staging -> main"
    git checkout main
    git merge staging
    git push origin main

    Step "Back to develop"
    git checkout develop

    Write-Host "`nRelease complete." -ForegroundColor Green
} catch {
    Write-Host "`nFailed: $_" -ForegroundColor Red
    git checkout develop
    exit 1
}
