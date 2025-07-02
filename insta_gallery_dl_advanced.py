import subprocess
import json
import sys
import os
import argparse
import time
from pathlib import Path

# Parse command line arguments
parser = argparse.ArgumentParser(description='Instagram photo URL scraper using gallery-dl')
parser.add_argument('--profile', default='for_everyoung10', help='Instagram profile to scrape')
parser.add_argument('--limit', type=int, default=500, help='Maximum number of images to collect')
parser.add_argument('--output', default='urls.csv', help='Output file for URLs')
parser.add_argument('--config', help='Path to gallery-dl config file')
parser.add_argument('--cookies', help='Path to cookies file (exported from browser)')
parser.add_argument('--username', help='Instagram username for authentication')
parser.add_argument('--password', help='Instagram password for authentication')
parser.add_argument('--verbose', action='store_true', help='Verbose output')
args = parser.parse_args()

def check_gallery_dl():
    """Check if gallery-dl is installed and get version"""
    try:
        result = subprocess.run(['gallery-dl', '--version'], 
                              capture_output=True, text=True, check=True)
        version = result.stdout.strip()
        print(f"✓ gallery-dl found: {version}")
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("✗ gallery-dl is not installed or not found in PATH")
        print("\nTo install gallery-dl:")
        print("  pip install gallery-dl")
        print("\nOr run the installation script:")
        print("  .\\install_gallery_dl.ps1")
        return False

def create_config_file():
    """Create optimized gallery-dl config"""
    config = {
        "extractor": {
            "instagram": {
                "include": "posts",
                "videos": False,
                "stories": False,
                "highlights": False,
                "tagged": False,
                "sleep": [2, 5],
                "sleep-retry": [30, 120],
                "timeout": 30.0,
                "retries": 3
            }
        },
        "output": {
            "log": {
                "level": "info" if args.verbose else "warning"
            }
        },
        "downloader": {
            "retries": 3,
            "timeout": 30.0
        }
    }
    
    # Add authentication if provided
    if args.username and args.password:
        config["extractor"]["instagram"]["username"] = args.username
        config["extractor"]["instagram"]["password"] = args.password
        print("✓ Using username/password authentication")
    
    config_path = "temp_gallery_dl_config.json"
    with open(config_path, 'w') as f:
        json.dump(config, f, indent=2)
    
    return config_path

def run_gallery_dl_command(profile, limit, config_path=None):
    """Run gallery-dl command with proper error handling"""
    
    instagram_url = f"https://www.instagram.com/{profile}/"
    
    # Build command
    cmd = ['gallery-dl']
    
    # Add config if specified
    if config_path:
        cmd.extend(['--config', config_path])
    elif args.config:
        cmd.extend(['--config', args.config])
    
    # Add cookies if specified
    if args.cookies:
        cmd.extend(['--cookies', args.cookies])
        print(f"✓ Using cookies from: {args.cookies}")
    
    # Core options
    cmd.extend([
        '--no-download',        # Don't download files
        '--dump-json',          # Output JSON for each post
        '--range', f'1-{limit}', # Limit posts
        '--quiet' if not args.verbose else '--verbose',
    ])
    
    cmd.append(instagram_url)
    
    print(f"🔍 Extracting URLs from: {instagram_url}")
    print(f"📊 Limit: {limit} posts")
    
    if args.verbose:
        print(f"🔧 Command: {' '.join(cmd)}")
    
    try:
        # Run with timeout
        result = subprocess.run(
            cmd, 
            capture_output=True, 
            text=True, 
            timeout=600,  # 10 minute timeout
            encoding='utf-8'
        )
        
        return result
        
    except subprocess.TimeoutExpired:
        print("⏰ Operation timed out after 10 minutes")
        return None
    except Exception as e:
        print(f"❌ Error running gallery-dl: {e}")
        return None

def parse_gallery_dl_output(result):
    """Parse gallery-dl JSON output to extract image URLs"""
    urls = []
    errors = []
    
    if result.returncode != 0:
        print(f"❌ gallery-dl failed with return code {result.returncode}")
        if result.stderr:
            print(f"Error output: {result.stderr}")
        return urls, errors
    
    # Parse JSON output line by line
    for line_num, line in enumerate(result.stdout.strip().split('\n'), 1):
        if not line.strip():
            continue
            
        try:
            data = json.loads(line)
            
            # Extract URL from different possible fields
            url = None
            if 'url' in data:
                url = data['url']
            elif 'display_url' in data:
                url = data['display_url']
            elif 'thumbnail_url' in data:
                url = data['thumbnail_url']
            
            if url and url.startswith('http'):
                urls.append(url)
                if args.verbose:
                    print(f"  📸 Found URL {len(urls)}: {url[:80]}...")
            
        except json.JSONDecodeError as e:
            errors.append(f"Line {line_num}: JSON decode error - {str(e)}")
            if args.verbose:
                print(f"⚠️  Skipping malformed JSON on line {line_num}")
            continue
        except Exception as e:
            errors.append(f"Line {line_num}: {str(e)}")
            continue
    
    return urls, errors

def save_urls(urls, filename):
    """Save URLs to CSV file"""
    try:
        with open(filename, 'w', encoding='utf-8', newline='') as f:
            f.write("index,url\n")
            for idx, url in enumerate(urls, 1):
                f.write(f"{idx},{url}\n")
        
        print(f"💾 Saved {len(urls)} URLs to {filename}")
        return True
    except Exception as e:
        print(f"❌ Failed to save URLs: {e}")
        return False

def display_results(urls, errors):
    """Display extraction results"""
    print(f"\n📊 Results:")
    print(f"   ✓ Successfully extracted: {len(urls)} URLs")
    
    if errors:
        print(f"   ⚠️  Parsing errors: {len(errors)}")
        if args.verbose:
            for error in errors[:5]:  # Show first 5 errors
                print(f"      {error}")
            if len(errors) > 5:
                print(f"      ... and {len(errors) - 5} more errors")
    
    if urls:
        print(f"\n📸 Sample URLs (first 3):")
        for i, url in enumerate(urls[:3], 1):
            print(f"   {i}: {url}")
        
        if len(urls) > 3:
            print(f"   ... and {len(urls) - 3} more")

def main():
    print("🚀 Instagram URL Extractor using gallery-dl")
    print("=" * 50)
    
    # Check dependencies
    if not check_gallery_dl():
        sys.exit(1)
    
    print(f"🎯 Target: @{args.profile}")
    print(f"🔢 Limit: {args.limit} posts")
    
    # Create temporary config
    config_path = create_config_file()
    
    try:
        # Run gallery-dl
        print(f"\n🔄 Starting extraction...")
        result = run_gallery_dl_command(args.profile, args.limit, config_path)
        
        if result is None:
            print("❌ Failed to run gallery-dl")
            sys.exit(1)
        
        # Parse results
        print(f"🔍 Parsing results...")
        urls, errors = parse_gallery_dl_output(result)
        
        # Display results
        display_results(urls, errors)
        
        if urls:
            # Save to file
            if save_urls(urls, args.output):
                print(f"\n✅ Success! Check {args.output} for all URLs")
            
            # Also print for immediate use
            print(f"\n📋 All URLs (CSV format):")
            print("=" * 50)
            for idx, url in enumerate(urls, 1):
                print(f"{idx},{url}")
        else:
            print(f"\n❌ No URLs extracted. Possible causes:")
            print(f"   • Account is private (try --cookies or --username/--password)")
            print(f"   • Rate limiting by Instagram")
            print(f"   • Network issues")
            print(f"   • Profile doesn't exist or has no posts")
            
            if not args.cookies and not (args.username and args.password):
                print(f"\n💡 Tips:")
                print(f"   • Export cookies from your browser and use --cookies")
                print(f"   • Use --username and --password for authentication")
                print(f"   • Try again later if rate limited")
    
    finally:
        # Cleanup
        if os.path.exists(config_path):
            os.remove(config_path)

if __name__ == "__main__":
    main()
