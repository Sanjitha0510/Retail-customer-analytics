import http.server
import socketserver
import threading
import subprocess
import time
import json
import requests
import sys
import os

# Instagram API credentials
long_access_token = 'EAASGrSvhX68BOyIv0FPDLYTYEjM2gGyrWvAEOVfSR9mP6HHKQaiOVYxg9PWsZBdxhej5rV4TBQIh1ooj5DocKM7yObTAjOIjBAmrS4DZBRv6BDLGDqUCOkskQP33YTyy961su1FkSeAX4ONZCRHv13W05AI541ez8Qs2RQt8KE1ZC4m9wYkGKXr5'
ig_user_id = "17841471793837113"

def main():
    if len(sys.argv) != 3:
        print("Usage: python instareel.py <user_id> '<json_products_list>'")
        sys.exit(1)

    products_json = sys.argv[2]
    output_filename = "reel.mp4"
    output_path = f"./output/{output_filename}"

    # Generate the video first
    try:
        result = subprocess.run(
            ['py', './videogeneration.py', products_json, output_path],
            check=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        print("Video generation output:", result.stdout)
    except subprocess.CalledProcessError as e:
        print(f"Video generation failed: {e.stderr}")
        sys.exit(1)

    # Start HTTP server
    PORT = 8000
    while True:
        try:
            Handler = http.server.SimpleHTTPRequestHandler
            httpd = socketserver.TCPServer(("", PORT), Handler)
            break
        except OSError:
            PORT += 1

    # Start ngrok tunnel
    ngrok = subprocess.Popen(
        [r"C:\Users\Mohnish\Desktop\retail customer analysis\api\output\ngrok.exe", "http", str(PORT)], 
        stdout=subprocess.PIPE
    )
    time.sleep(2)

    # Get public URL
    try:
        resp = requests.get("http://localhost:4040/api/tunnels")
        public_url = resp.json()["tunnels"][0]["public_url"]
        # Build video URL using the public URL and path to the video file
        video_url = f"{public_url}/output/{output_filename}"
        print("Public video URL:", video_url)
    except Exception as e:
        print("Failed to get ngrok URL:", str(e))
        httpd.shutdown()
        ngrok.terminate()
        sys.exit(1)

    # Create media container
    caption = '''Chinna Porur Yejamaan'''
    url = f"https://graph.facebook.com/v17.0/{ig_user_id}/media"
    payload = {
        "media_type": "REELS",
        "video_url": video_url,
        "caption": caption,
        "share_to_feed": "false",
        "access_token": long_access_token
    }

    try:
        response = requests.post(url, params=payload)
        data = response.json()
        print("container response:", json.dumps(data, indent=4))
        creation_id = data["id"]
    except Exception as e:
        print("Media creation failed:", str(e))
        httpd.shutdown()
        ngrok.terminate()
        sys.exit(1)

    # Publish media with retry logic
    url = f"https://graph.facebook.com/v17.0/{ig_user_id}/media_publish"
    payload = {
        "creation_id": creation_id,
        "access_token": long_access_token
    }

    max_retries = 5
    media_id = None

    for attempt in range(max_retries):
        try:
            time.sleep(10)
            response = requests.post(url, params=payload)
            response.raise_for_status()
            data = response.json()

            if "id" in data:
                media_id = data["id"]
                print(f"Published media ID: {media_id}")
                break
                
            print(f"Attempt {attempt + 1} failed: {json.dumps(data, indent=4)}")
            
        except requests.exceptions.RequestException as e:
            print(f"Attempt {attempt + 1} failed: {str(e)}")

    # if not media_id:
    #     print("Max retries reached. Could not publish media.")
    #     httpd.shutdown()
    #     ngrok.terminate()
    #     sys.exit(1)

    # # Get media details
    # try:
    #     url = f"https://graph.facebook.com/v21.0/{media_id}"
    #     payload = {
    #         "fields": "comments_count, like_count, media_url, permalink",
    #         "access_token": long_access_token
    #     }

    #     response = requests.get(url, params=payload)
    #     data = response.json()
    #     print("Media details:", json.dumps(data, indent=4))
    #     print(f"Reel permalink: {data.get('permalink', 'N/A')}")
    # except Exception as e:
    #     print("Failed to get media details:", str(e))

    # Cleanup
    # httpd.shutdown()
    # ngrok.terminate()

if __name__ == "__main__":
    main()
