@echo off
echo Setting up Instagram Extension (Fixed Version)
echo ================================================

REM Create backup of original files
if exist content.js (
    echo Creating backup of original content.js...
    copy content.js content.js.backup
)

if exist manifest.json (
    echo Creating backup of original manifest.json...
    copy manifest.json manifest.json.backup
)

REM Replace with fixed versions
if exist content_fixed.js (
    echo Installing fixed content script...
    copy content_fixed.js content.js
    echo ✓ content.js updated
) else (
    echo ❌ content_fixed.js not found!
)

if exist manifest_fixed.json (
    echo Installing fixed manifest...
    copy manifest_fixed.json manifest.json
    echo ✓ manifest.json updated
) else (
    echo ❌ manifest_fixed.json not found!
)

echo.
echo Installation complete!
echo.
echo Next steps:
echo 1. Open Chrome and go to chrome://extensions/
echo 2. Enable "Developer mode" (top-right toggle)
echo 3. Click "Reload" on the Instagram extension
echo 4. Navigate to an Instagram profile
echo 5. Look for the "Get All Images" button
echo.
echo If you encounter issues:
echo - Open test_page.html for troubleshooting guide
echo - Check browser console (F12) for error messages
echo - Use the "Test Selectors" button for debugging
echo.
pause
