#!/usr/bin/env python3
"""
Instagram URL Extractor using gallery-dl with Authentication
Enhanced version with multiple authentication methods
"""

import subprocess
import json
import sys
import argparse
import tempfile
import os
from pathlib import Path

def create_config_file(username=None, password=None, cookies_file=None):
    """Create a gallery-dl config file with authentication"""
    config = {
        "extractor": {
            "instagram": {
                "videos": False,
                "metadata": False,
                "highlights": False,
                "stories": False,
                "reels": False,
                "include": "posts",
                "sleep-request": [2, 5],  # Sleep 2-5 seconds between requests
                "sleep-extractor": 1,     # Sleep 1 second between extractors
            }
        }
    }
    
    # Add authentication if provided
    if username and password:
        config["extractor"]["instagram"]["username"] = username
        config["extractor"]["instagram"]["password"] = password
        print(f"✓ Using username/password authentication")
    
    if cookies_file and os.path.exists(cookies_file):
        config["extractor"]["instagram"]["cookies"] = cookies_file
        print(f"✓ Using cookies from: {cookies_file}")
    elif cookies_file:
        print(f"⚠️  Cookies file not found: {cookies_file}")
    
    # Create temporary config file
    config_file = tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False)
    json.dump(config, config_file, indent=2)
    config_file.close()
    
    return config_file.name

def extract_urls_with_auth(profile, limit=500, username=None, password=None, cookies_file=None, verbose=False):
    """Extract URLs using gallery-dl with authentication"""
    
    print(f"🔐 Instagram URL Extractor with Authentication")
    print("=" * 60)
    
    # Check if gallery-dl is available
    try:
        result = subprocess.run(['gallery-dl', '--version'], 
                              capture_output=True, text=True, timeout=10)
        if result.returncode == 0:
            version = result.stdout.strip()
            print(f"✓ gallery-dl found: {version}")
        else:
            raise FileNotFoundError
    except (FileNotFoundError, subprocess.TimeoutExpired):
        print("❌ gallery-dl not found. Please install it:")
        print("   pip install gallery-dl")
        return []
    
    # Create config file with authentication
    config_file = create_config_file(username, password, cookies_file)
    
    try:
        # Prepare the URL
        if not profile.startswith('http'):
            url = f"https://www.instagram.com/{profile.lstrip('@')}/"
        else:
            url = profile
        
        print(f"🎯 Target: {profile}")
        print(f"📊 Limit: {limit} posts")
        print(f"🔧 Config: {config_file}")
        print()
        
        # Build gallery-dl command
        cmd = [
            'gallery-dl',
            '--config', config_file,
            '--print', '{post_url}',  # Print the post URL
            '--print', '{display_url}',  # Print the image URL
            '--range', f'1-{limit}',
            '--no-download'
        ]
        
        if verbose:
            cmd.append('--verbose')
        
        cmd.append(url)
        
        print(f"🚀 Starting extraction...")
        if verbose:
            print(f"📝 Command: {' '.join(cmd)}")
        print()
        
        # Run gallery-dl
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
        
        if verbose:
            print("📤 Raw output:")
            print(result.stdout)
            if result.stderr:
                print("📤 Stderr:")
                print(result.stderr)
            print()
        
        # Parse results
        urls = []
        errors = 0
        
        if result.stdout:
            lines = result.stdout.strip().split('\n')
            for line in lines:
                line = line.strip()
                if line and (line.startswith('http://') or line.startswith('https://')):
                    # Filter out post URLs, keep only image URLs
                    if '/p/' not in line and ('/jpg' in line or '/png' in line or '/webp' in line or 'scontent' in line):
                        urls.append(line)
                elif line and not line.startswith('['):
                    errors += 1
        
        # Check for common error patterns
        error_output = result.stderr.lower()
        if 'login' in error_output or 'authentication' in error_output:
            print("❌ Authentication failed. Try:")
            print("   • Export cookies from your browser")
            print("   • Check username/password")
            print("   • Make sure account isn't locked")
        elif 'rate limit' in error_output or '429' in error_output:
            print("❌ Rate limited by Instagram. Wait and try again later.")
        elif result.returncode != 0:
            print(f"❌ gallery-dl failed with code {result.returncode}")
            if verbose:
                print(f"Error: {result.stderr}")
        
        return urls, errors
        
    except subprocess.TimeoutExpired:
        print("❌ gallery-dl timed out. Try with a smaller limit.")
        return [], 1
    except Exception as e:
        print(f"❌ Error running gallery-dl: {e}")
        return [], 1
    finally:
        # Clean up config file
        try:
            os.unlink(config_file)
        except:
            pass

def main():
    parser = argparse.ArgumentParser(description='Extract Instagram image URLs using gallery-dl with authentication')
    parser.add_argument('--profile', default='for_everyoung10', 
                       help='Instagram profile (default: for_everyoung10)')
    parser.add_argument('--limit', type=int, default=500, 
                       help='Maximum number of posts to extract (default: 500)')
    parser.add_argument('--username', help='Instagram username for authentication')
    parser.add_argument('--password', help='Instagram password for authentication')
    parser.add_argument('--cookies', help='Path to cookies.txt file')
    parser.add_argument('--output', help='Output file for URLs (default: print to stdout)')
    parser.add_argument('--verbose', '-v', action='store_true', help='Verbose output')
    
    args = parser.parse_args()
    
    # Extract URLs
    urls, errors = extract_urls_with_auth(
        profile=args.profile,
        limit=args.limit,
        username=args.username,
        password=args.password,
        cookies_file=args.cookies,
        verbose=args.verbose
    )
    
    # Display results
    print(f"📊 Results:")
    print(f"   ✓ Successfully extracted: {len(urls)} URLs")
    if errors > 0:
        print(f"   ⚠️  Parsing errors: {errors}")
    print()
    
    if urls:
        print("🖼️  Image URLs:")
        print("=" * 50)
        
        if args.output:
            # Write to file
            with open(args.output, 'w') as f:
                for idx, url in enumerate(urls, 1):
                    line = f"{idx}, {url}\n"
                    f.write(line)
                    print(f"{idx:3d}: {url}")
            print(f"\n✓ URLs saved to: {args.output}")
        else:
            # Print to stdout
            for idx, url in enumerate(urls, 1):
                print(f"{idx:3d}: {url}")
        
        print(f"\n✅ Total URLs extracted: {len(urls)}")
    else:
        print("❌ No URLs extracted. Possible causes:")
        print("   • Account is private (requires authentication)")
        print("   • Rate limiting by Instagram")
        print("   • Network issues")
        print("   • Profile doesn't exist or has no posts")
        print()
        print("💡 Tips:")
        if not args.username and not args.cookies:
            print("   • Try with --username and --password")
            print("   • Export cookies from browser and use --cookies")
        print("   • Use --verbose for more debugging info")
        print("   • Try again later if rate limited")
        
        return 1
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
