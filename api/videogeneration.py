import os
import requests
from moviepy.editor import *
from moviepy.video.fx.all import fadein, fadeout
from dotenv import load_dotenv
import moviepy.config as mpconf
import sys
import json

# Create required directories
os.makedirs('temp', exist_ok=True)
os.makedirs('output', exist_ok=True)
os.makedirs('assets', exist_ok=True)

# ImageMagick Configuration
IMAGEMAGICK_PATH = r"C:\Program Files\ImageMagick-7.1.1-Q16-HDRI\magick.exe"
IMAGEMAGICK_PATHS = [
    r"C:\Program Files\ImageMagick-7.1.1-Q16-HDRI\magick.exe",
    r"C:\Program Files\ImageMagick\magick.exe",
    "magick"
]

def find_imagemagick():
    for path in IMAGEMAGICK_PATHS:
        if os.path.exists(path):
            return path
    return None

IMAGEMAGICK_PATH = find_imagemagick()
if IMAGEMAGICK_PATH:
    mpconf.change_settings({"IMAGEMAGICK_BINARY": IMAGEMAGICK_PATH})
else:
    print("Warning: ImageMagick not found. Text overlays may not work properly.")

# Load environment variables
load_dotenv()
UNSPLASH_ACCESS_KEY = os.getenv("UNSPLASH_ACCESS_KEY")

def fetch_unsplash_image(query, orientation='portrait'):
    url = 'https://api.unsplash.com/search/photos'
    headers = {'Authorization': f'Client-ID {UNSPLASH_ACCESS_KEY}'}
    params = {
        'query': query,
        'page': 1,
        'per_page': 1,
        'orientation': orientation
    }
    
    try:
        response = requests.get(url, headers=headers, params=params)
        response.raise_for_status()
        results = response.json()
        
        if not results.get('results'):
            print(f"No results found for {query}. Using fallback image.")
            return "https://images.unsplash.com/photo-1496181133206-80ce9b88a853"
        
        return results['results'][0]['urls']['regular']
    except Exception as e:
        print(f"API Error: {str(e)}")
        return "https://images.unsplash.com/photo-1496181133206-80ce9b88a853"

def create_reel(top_items, output_path='output/reel.mp4'):
    try:
        # Verify background music exists
        BACKGROUND_MUSIC = "assets/videoplayback.mp3"
        if os.path.exists(BACKGROUND_MUSIC):
            has_music = True
        else:
            has_music = False
            print("Background music not found, continuing without audio")
        
        output_path = os.path.normpath(output_path)
        output_dir = os.path.dirname(output_path) or '.'
        os.makedirs(output_dir, exist_ok=True)
        
        VIDEO_SIZE = (1080, 1920)
        CLIP_DURATION = 3
        FONT = "Arial-Bold"
        BRAND_COLOR = "#FF6B00"
        
        clips = []

        outro = (TextClip("Visit Us Today!\n📍 Porur, Chennai\n⏰ 9AM - 9PM", 
                         fontsize=80, font=FONT, color='white', interline=20,
                         stroke_color=BRAND_COLOR, stroke_width=2)
                .set_duration(3)
                .set_position('center')
                .fadein(0.5))
        
        clips.append(outro)
        
        for item in top_items:
            try:
                image_url = fetch_unsplash_image(item)
                image_path = f"temp/{item}.jpg"
                
                response = requests.get(image_url)
                response.raise_for_status()
                with open(image_path, 'wb') as f:
                    f.write(response.content)
                
                img_clip = ImageClip(image_path).set_duration(CLIP_DURATION)
                if img_clip.size[1] > VIDEO_SIZE[1]:
                    img_clip = img_clip.resize(height=int(VIDEO_SIZE[1] * 1.2))
                img_clip = img_clip.fx(fadein, 0.5).fx(fadeout, 0.5)
                
                gradient_bg = ColorClip(size=VIDEO_SIZE, color=(0, 0, 0))
                gradient_bg = gradient_bg.set_opacity(0.4).set_duration(CLIP_DURATION)
                
                txt = (TextClip(item, fontsize=90, color='white', font=FONT, 
                              stroke_color=BRAND_COLOR, stroke_width=5)
                       .set_position(('center', 0.85), relative=True)
                       .set_duration(CLIP_DURATION)
                       .fx(fadein, 0.5))
                
                final_clip = CompositeVideoClip([img_clip, gradient_bg, txt])
                clips.append(final_clip)
            
            except Exception as e:
                print(f"Error processing {item}: {str(e)}")
                continue
        
        final_video = concatenate_videoclips(clips, method="compose")
        
        if has_music:
            music = (AudioFileClip(BACKGROUND_MUSIC)
                    .subclip(0, final_video.duration)
                    .audio_fadein(1)
                    .audio_fadeout(1))
            final_video = final_video.set_audio(music)
        
        final_video.write_videofile(output_path, fps=30, codec='libx264', 
                                  audio_codec='aac', threads=4)

    except Exception as e:
        print(f"Error creating reel: {str(e)}")
        raise
    finally:
        # Cleanup
        for item in top_items:
            try:
                if os.path.exists(f"temp/{item}.jpg"):
                    os.remove(f"temp/{item}.jpg")
            except:
                pass

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python videogeneration.py '[\"product1\", \"product2\"]' output_path")
        sys.exit(1)
    
    try:
        products = json.loads(sys.argv[1])
        output_path = 'output/reel.mp4'
        create_reel(products, output_path)
    except Exception as e:
        print(f"Error: {str(e)}")
        sys.exit(1)
