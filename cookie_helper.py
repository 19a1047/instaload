"""
Instagram Cookie Exporter Helper
This script helps you create a cookies.txt file for gallery-dl authentication
"""

import json
import os
from pathlib import Path

def create_sample_cookies():
    """Create a sample cookies.txt file"""
    sample_content = """# Instagram Cookies for gallery-dl
# To get your real cookies:
# 1. Open Instagram in your browser and login
# 2. Install browser extension "Get cookies.txt" or "cookies.txt"
# 3. Export Instagram cookies
# 4. Replace this file with the exported cookies

# Sample format (replace with real values):
# .instagram.com	TRUE	/	TRUE	1234567890	sessionid	your_session_id_here
# .instagram.com	TRUE	/	FALSE	1234567890	csrftoken	your_csrf_token_here
"""
    
    with open('instagram_cookies_sample.txt', 'w') as f:
        f.write(sample_content)
    
    print("✓ Created sample cookies file: instagram_cookies_sample.txt")
    print("\n📋 To get real cookies:")
    print("1. Install browser extension:")
    print("   • Chrome: 'Get cookies.txt LOCALLY'")
    print("   • Firefox: 'cookies.txt'")
    print("2. Go to instagram.com and login")
    print("3. Use extension to export cookies")
    print("4. Save as 'instagram_cookies.txt'")

def find_chrome_cookies():
    """Try to find Chrome cookies location"""
    import platform
    
    system = platform.system()
    home = Path.home()
    
    if system == "Windows":
        chrome_path = home / "AppData/Local/Google/Chrome/User Data/Default/Cookies"
    elif system == "Darwin":  # macOS
        chrome_path = home / "Library/Application Support/Google/Chrome/Default/Cookies"
    else:  # Linux
        chrome_path = home / ".config/google-chrome/Default/Cookies"
    
    if chrome_path.exists():
        print(f"📁 Chrome cookies found at: {chrome_path}")
        print("⚠️  Note: Chrome cookies are encrypted and need special tools to extract")
    else:
        print("❌ Chrome cookies not found in default location")

def main():
    print("🍪 Instagram Cookie Helper")
    print("=" * 40)
    
    choice = input("\nChoose an option:\n1. Create sample cookies file\n2. Find Chrome cookies location\n3. Both\nEnter choice (1-3): ")
    
    if choice in ['1', '3']:
        create_sample_cookies()
    
    if choice in ['2', '3']:
        print()
        find_chrome_cookies()
    
    print("\n💡 Alternative: Use username/password authentication:")
    print("   python insta_gallery_dl_auth.py --username YOUR_USERNAME --password YOUR_PASSWORD")

if __name__ == "__main__":
    main()
