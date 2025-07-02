@echo off
echo Installing gallery-dl and dependencies...
echo.

REM Check if pip is available
pip --version >nul 2>&1
if errorlevel 1 (
    echo Error: pip is not installed or not in PATH
    echo Please install Python and pip first
    pause
    exit /b 1
)

REM Install gallery-dl
echo Installing gallery-dl...
pip install gallery-dl

REM Check if installation was successful
gallery-dl --version >nul 2>&1
if errorlevel 1 (
    echo Error: gallery-dl installation failed
    pause
    exit /b 1
)

echo.
echo Installation completed successfully!
echo You can now run: python insta_gallery_dl.py
echo.
echo Optional: For better rate limiting, you can also install:
echo pip install requests[socks]
echo.
pause
