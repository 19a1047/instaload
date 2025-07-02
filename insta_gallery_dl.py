import subprocess
import json
import sys
import os
import argparse
from urllib.parse import urlparse

# Parse command line arguments
parser = argparse.ArgumentParser(description='Instagram photo URL scraper using gallery-dl')
parser.add_argument('--profile', default='for_everyoung10', help='Instagram profile to scrape')
parser.add_argument('--limit', type=int, default=500, help='Maximum number of images to collect')
parser.add_argument('--output', default='urls.csv', help='Output file for URLs')
parser.add_argument('--dry-run', action='store_true', help='Only extract URLs without downloading')
args = parser.parse_args()

PROFILE = args.profile
LIMIT = args.limit

def check_gallery_dl():
    """Check if gallery-dl is installed"""
    try:
        result = subprocess.run(['gallery-dl', '--version'], 
                              capture_output=True, text=True, check=True)
        print(f"gallery-dl version: {result.stdout.strip()}")
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("gallery-dl is not installed or not found in PATH")
        print("Please install it using: pip install gallery-dl")
        return False

def create_config():
    """Create a gallery-dl config file optimized for Instagram"""
    config = {
        "extractor": {
            "instagram": {
                "include": "posts",
                "videos": False,
                "stories": False,
                "highlights": False,
                "tagged": False,
                "metadata": True,
                "sleep-request": [2, 5],  # Sleep 2-5 seconds between requests
                "sleep-retry": [60, 300]  # Sleep 60-300 seconds on rate limit
            },
            "base-directory": "./downloads",
            "skip": True
        },
        "output": {
            "mode": "json",
            "format": {
                "filename": "{post_url}|{display_url}"
            }
        }
    }
    
    config_path = "gallery_dl_config.json"
    with open(config_path, 'w') as f:
        json.dump(config, f, indent=2)
    
    print(f"Created config file: {config_path}")
    return config_path

def extract_urls_with_gallery_dl(profile, limit):
    """Extract URLs using gallery-dl"""
    
    # Create config file
    config_path = create_config()
    
    try:
        # Construct the Instagram URL
        instagram_url = f"https://www.instagram.com/{profile}/"
        
        print(f"Extracting URLs from: {instagram_url}")
        print(f"Limit: {limit} images")
        
        # Run gallery-dl with JSON output to extract metadata
        cmd = [
            'gallery-dl',
            '--config', config_path,
            '--no-download',  # Don't download, just extract metadata
            '--write-info-json',  # Write metadata to JSON files
            '--range', f'1-{limit}',  # Limit number of posts
            instagram_url
        ]
        
        print(f"Running command: {' '.join(cmd)}")
        
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
        
        if result.returncode != 0:
            print(f"gallery-dl error: {result.stderr}")
            if "login required" in result.stderr.lower():
                print("\nInstagram requires login. You may need to:")
                print("1. Set up authentication in gallery-dl config")
                print("2. Use cookies from your browser")
                print("3. Try with a different approach")
            return None
        
        print("gallery-dl extraction completed successfully!")
        return result.stdout
        
    except subprocess.TimeoutExpired:
        print("gallery-dl operation timed out")
        return None
    except Exception as e:
        print(f"Error running gallery-dl: {e}")
        return None
    finally:
        # Clean up config file
        if os.path.exists(config_path):
            os.remove(config_path)

def extract_urls_json_mode(profile, limit):
    """Extract URLs using gallery-dl in JSON mode"""
    try:
        instagram_url = f"https://www.instagram.com/{profile}/"
        
        print(f"Extracting URLs from: {instagram_url}")
        print("Using JSON output mode for better URL extraction...")
        
        # Run gallery-dl with JSON output
        cmd = [
            'gallery-dl',
            '--no-download',
            '--dump-json',
            '--range', f'1-{limit}',
            instagram_url
        ]
        
        print(f"Running command: {' '.join(cmd)}")
        
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=600)
        
        if result.returncode != 0:
            print(f"gallery-dl error: {result.stderr}")
            return []
        
        # Parse JSON output
        urls = []
        for line in result.stdout.strip().split('\n'):
            if line.strip():
                try:
                    data = json.loads(line)
                    if 'url' in data:
                        urls.append(data['url'])
                    elif 'display_url' in data:
                        urls.append(data['display_url'])
                except json.JSONDecodeError:
                    continue
        
        return urls
        
    except subprocess.TimeoutExpired:
        print("gallery-dl operation timed out")
        return []
    except Exception as e:
        print(f"Error running gallery-dl: {e}")
        return []

def save_urls_to_file(urls, filename):
    """Save URLs to a CSV file"""
    with open(filename, 'w', encoding='utf-8') as f:
        f.write("index,url\n")  # CSV header
        for idx, url in enumerate(urls, 1):
            f.write(f"{idx},{url}\n")
    
    print(f"Saved {len(urls)} URLs to {filename}")

def main():
    print("Instagram URL Extractor using gallery-dl")
    print("=" * 50)
    
    # Check if gallery-dl is available
    if not check_gallery_dl():
        sys.exit(1)
    
    print(f"Target profile: @{PROFILE}")
    print(f"Image limit: {LIMIT}")
    
    if args.dry_run:
        print("DRY RUN MODE - Only extracting URLs")
    
    # Try JSON mode first
    print("\nAttempting to extract URLs...")
    urls = extract_urls_json_mode(PROFILE, LIMIT)
    
    if not urls:
        print("JSON mode failed, trying alternative extraction...")
        result = extract_urls_with_gallery_dl(PROFILE, LIMIT)
        if result is None:
            print("Failed to extract URLs with gallery-dl")
            sys.exit(1)
        urls = []  # Would need to parse the result differently
    
    if urls:
        print(f"\nSuccessfully extracted {len(urls)} URLs!")
        
        # Display first few URLs
        print("\nFirst 5 URLs:")
        for i, url in enumerate(urls[:5], 1):
            print(f"{i}: {url}")
        
        if len(urls) > 5:
            print(f"... and {len(urls) - 5} more")
        
        # Save to file
        save_urls_to_file(urls, args.output)
        
        # Also print all URLs for immediate use
        print(f"\nAll URLs (CSV format):")
        print("=" * 50)
        for idx, url in enumerate(urls, 1):
            print(f"{idx},{url}")
    
    else:
        print("No URLs were extracted. This could be due to:")
        print("1. Rate limiting by Instagram")
        print("2. Private account requiring authentication")
        print("3. Network issues")
        print("4. Changes in Instagram's API")

if __name__ == "__main__":
    main()
