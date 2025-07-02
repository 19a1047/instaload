#!/usr/bin/env python3
"""
Test Instagram Authentication with gallery-dl
Quick test to verify if authentication is working
"""

import subprocess
import sys
import tempfile
import json
import os

def test_authentication(username=None, password=None, cookies_file=None):
    """Test if authentication works with gallery-dl"""
    
    print("🧪 Testing Instagram Authentication")
    print("=" * 40)
    
    # Create minimal config
    config = {
        "extractor": {
            "instagram": {
                "videos": False,
                "metadata": False,
                "sleep-request": [1, 2],
            }
        }
    }
    
    # Add authentication
    if username and password:
        config["extractor"]["instagram"]["username"] = username
        config["extractor"]["instagram"]["password"] = password
        print(f"🔑 Testing with username: {username}")
    
    if cookies_file and os.path.exists(cookies_file):
        config["extractor"]["instagram"]["cookies"] = cookies_file
        print(f"🍪 Testing with cookies: {cookies_file}")
    elif cookies_file:
        print(f"❌ Cookies file not found: {cookies_file}")
        return False
    
    if not username and not cookies_file:
        print("⚠️  No authentication provided - testing anonymous access")
    
    # Create temp config file
    with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
        json.dump(config, f, indent=2)
        config_file = f.name
    
    try:
        # Test with a simple public post
        test_url = "https://www.instagram.com/for_everyoung10/"
        
        print(f"🎯 Testing URL: {test_url}")
        print("⏳ Running test...")
        
        cmd = [
            'gallery-dl',
            '--config', config_file,
            '--range', '1-1',  # Just get 1 post
            '--print', '{post_url}',
            '--no-download',
            test_url
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
        
        print(f"📤 Exit code: {result.returncode}")
        
        if result.returncode == 0:
            if result.stdout.strip():
                print("✅ SUCCESS! Authentication is working")
                print(f"📝 Output: {result.stdout.strip()[:100]}...")
                return True
            else:
                print("⚠️  Command succeeded but no output")
                print("   This might indicate no posts or access issues")
        else:
            print("❌ FAILED! Authentication not working")
            if result.stderr:
                print(f"📝 Error: {result.stderr}")
                
                # Check for specific error patterns
                error_lower = result.stderr.lower()
                if 'login' in error_lower or 'authentication' in error_lower:
                    print("💡 Suggestion: Check username/password or try cookies")
                elif 'rate limit' in error_lower or '429' in error_lower:
                    print("💡 Suggestion: Wait and try again (rate limited)")
                elif 'private' in error_lower:
                    print("💡 Suggestion: Account may be private, try with authentication")
        
        return False
        
    except subprocess.TimeoutExpired:
        print("❌ Test timed out")
        return False
    except Exception as e:
        print(f"❌ Test failed with error: {e}")
        return False
    finally:
        # Cleanup
        try:
            os.unlink(config_file)
        except:
            pass

def main():
    if len(sys.argv) < 2:
        print("Usage:")
        print("  python test_auth.py username password")
        print("  python test_auth.py --cookies cookies.txt")
        print("  python test_auth.py  # Test without auth")
        return
    
    if sys.argv[1] == "--cookies" and len(sys.argv) > 2:
        success = test_authentication(cookies_file=sys.argv[2])
    elif len(sys.argv) >= 3:
        success = test_authentication(username=sys.argv[1], password=sys.argv[2])
    else:
        success = test_authentication()
    
    if success:
        print("\n🎉 You can now use gallery-dl with authentication!")
        print("   python insta_gallery_dl_auth.py --username YOUR_USER --password YOUR_PASS")
    else:
        print("\n💡 Try these options:")
        print("   1. Export cookies from browser")
        print("   2. Check Instagram login credentials")
        print("   3. Wait if rate limited")

if __name__ == "__main__":
    main()
