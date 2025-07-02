import instaloader
import time
import sys
import random
import argparse
from instaloader.exceptions import ConnectionException, LoginException

# Parse command line arguments
parser = argparse.ArgumentParser(description='Instagram photo URL scraper')
parser.add_argument('--wait', action='store_true', help='Wait for user input before starting')
parser.add_argument('--delay', type=int, default=60, help='Base delay between operations (default: 60s)')
args = parser.parse_args()

PROFILE = 'for_everyoung10'  # Wonyoung's official IG handle

    # To access private or your own posts, you need to login.
    # Replace 'your_username' and 'your_password' with your Instagram credentials.
USERNAME = 'nagoyaka.hibi'
PASSWORD = '207208'

# Create Instaloader instance with more conservative settings
L = instaloader.Instaloader(
    download_pictures=False, 
    download_videos=False, 
    download_video_thumbnails=False,
    download_geotags=False, 
    download_comments=False, 
    save_metadata=False, 
    post_metadata_txt_pattern='',
    max_connection_attempts=1,  # Reduce connection attempts
    request_timeout=15.0,       # Increase timeout
    user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
)

# Use session file to avoid repeated logins
session_file = f"session-{USERNAME}"

# Add some delay to avoid being flagged as bot
if args.wait:
    input("Press Enter when you want to start the scraping process...")

initial_delay = random.randint(5, 15)
print(f"Waiting {initial_delay} seconds before starting...")
time.sleep(initial_delay)

try:
    # Try to load existing session
    try:
        L.load_session_from_file(USERNAME, session_file)
        print("Loaded existing session")
    except FileNotFoundError:
        print("No existing session found, logging in...")
        L.login(USERNAME, PASSWORD)
        L.save_session_to_file(session_file)
        print("Login successful and session saved!")
    
    time.sleep(3)  # Wait after login
except LoginException as e:
    print(f"Login failed: {e}")
    sys.exit(1)
except ConnectionException as e:
    print(f"Connection error during login: {e}")
    print("Please wait and try again later.")
    sys.exit(1)

def fetch_posts_with_retry(profile, max_retries=3):
    """Fetch posts with exponential backoff retry mechanism"""
    for attempt in range(max_retries):
        try:
            print(f"Attempt {attempt + 1} to fetch posts...")
            posts = profile.get_posts()
            print("Successfully fetched posts!")
            return posts
        except ConnectionException as e:
            if "401" in str(e) or "rate limit" in str(e).lower() or "Please wait" in str(e):
                base_wait = args.delay * (2 ** attempt)  # Use configurable base delay
                wait_time = base_wait + random.randint(30, 90)
                print(f"Rate limited on attempt {attempt + 1}. Waiting {wait_time} seconds...")
                print(f"Instagram says: Please wait a few minutes before you try again.")
                
                if attempt < max_retries - 1:
                    print(f"This is normal. We'll wait and try again automatically.")
                    time.sleep(wait_time)
                    continue
                else:
                    print(f"Reached maximum retries. Consider running the script again later.")
            raise e
    return None

def try_alternative_approach(profile):
    """Try an alternative approach to get post data"""
    try:
        print("Trying alternative approach - getting basic profile info first...")
        
        # Get basic profile info without posts
        print(f"Posts count: {profile.mediacount}")
        print(f"Followers: {profile.followers}")
        print(f"Following: {profile.followees}")
        
        # Try to get a smaller number of posts first
        print("Trying to get posts with takewhile to limit requests...")
        from itertools import islice
        
        posts = islice(profile.get_posts(), 50)  # Only get first 50 posts
        return posts
        
    except Exception as e:
        print(f"Alternative approach also failed: {e}")
        return None

try:
    print("Getting profile...")
    profile = instaloader.Profile.from_username(L.context, PROFILE)
    print(f"Profile found: {profile.full_name} (@{profile.username})")
    
    # Add longer delay before getting posts
    delay = random.randint(10, 20)
    print(f"Waiting {delay} seconds before fetching posts...")
    time.sleep(delay)
    
    print("Fetching posts...")
    posts = fetch_posts_with_retry(profile)
    
    if posts is None:
        print("Primary method failed. Trying alternative approach...")
        posts = try_alternative_approach(profile)
    
    if posts is None:
        print("Failed to fetch posts with primary method, trying alternative approach...")
        posts = try_alternative_approach(profile)
    
    if posts is None:
        print("Failed to fetch posts after all retries. Exiting.")
        sys.exit(1)
    
    links = []
    post_count = 0
    
    for post in posts:
        try:
            post_count += 1
            print(f"Processing post {post_count}...")
            
            if post.typename == "GraphImage":
                links.append(post.url)
            elif post.typename == "GraphSidecar":
                # For posts with multiple images
                for resource in post.get_sidecar_nodes():
                    links.append(resource.display_url)
            
            # Add random delay between processing posts to appear more human
            base_delay = random.uniform(2, 5)
            if post_count % 5 == 0:  # Take longer breaks more frequently
                print(f"Processed {post_count} posts, taking a longer break...")
                time.sleep(base_delay + random.randint(10, 20))
            else:
                time.sleep(base_delay)
                
            # limit to 500
            if len(links) >= 500:
                print("Reached 500 image limit")
                break
                
        except ConnectionException as e:
            if "401" in str(e) or "rate limit" in str(e).lower():
                wait_time = random.randint(120, 300)  # Wait 2-5 minutes
                print(f"Rate limited on post {post_count}. Waiting {wait_time} seconds...")
                time.sleep(wait_time)
                continue
            else:
                print(f"Connection error on post {post_count}: {e}")
                time.sleep(30)
                continue
        except Exception as e:
            print(f"Error processing post {post_count}: {e}")
            time.sleep(5)
            continue

except ConnectionException as e:
    print(f"Connection error: {e}")
    print("Instagram may be rate limiting. Please wait and try again later.")
    sys.exit(1)
except Exception as e:
    print(f"Unexpected error: {e}")
    sys.exit(1)

# Print results
print(f"\nFound {len(links)} image links:")
print("=" * 50)

# Print as CSV-ready lines
for idx, link in enumerate(links):
    print(f"{idx+1}, {link}")

print(f"\nTotal images found: {len(links)}")
