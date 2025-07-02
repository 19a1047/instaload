# PowerShell script to install gallery-dl
Write-Host "Installing gallery-dl and dependencies..." -ForegroundColor Green
Write-Host ""

# Check if pip is available
try {
    $pipVersion = & pip --version 2>$null
    Write-Host "Found pip: $pipVersion" -ForegroundColor Green
} catch {
    Write-Host "Error: pip is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Python and pip first" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Install gallery-dl
Write-Host "Installing gallery-dl..." -ForegroundColor Yellow
try {
    & pip install gallery-dl
    if ($LASTEXITCODE -eq 0) {
        Write-Host "gallery-dl installed successfully!" -ForegroundColor Green
    } else {
        throw "Installation failed"
    }
} catch {
    Write-Host "Error: gallery-dl installation failed" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Verify installation
Write-Host "Verifying installation..." -ForegroundColor Yellow
try {
    $version = & gallery-dl --version 2>$null
    Write-Host "gallery-dl version: $version" -ForegroundColor Green
} catch {
    Write-Host "Error: gallery-dl installation verification failed" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "Installation completed successfully!" -ForegroundColor Green
Write-Host "You can now run: python insta_gallery_dl.py" -ForegroundColor Cyan
Write-Host ""
Write-Host "Usage examples:" -ForegroundColor Yellow
Write-Host "  python insta_gallery_dl.py                           # Default: for_everyoung10, 500 images"
Write-Host "  python insta_gallery_dl.py --profile username        # Different profile"
Write-Host "  python insta_gallery_dl.py --limit 100               # Limit to 100 images"
Write-Host "  python insta_gallery_dl.py --output my_urls.csv      # Custom output file"
Write-Host ""
Write-Host "Optional: For better performance, you can also install:" -ForegroundColor Cyan
Write-Host "  pip install requests[socks]" -ForegroundColor Gray
Write-Host ""
Read-Host "Press Enter to exit"
