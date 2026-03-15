#!/usr/bin/env python3
"""Download all teaching images from imgix CDN and update HTML references."""
import json, os, re, glob, urllib.request, sys
from urllib.parse import urlparse

DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'src', 'data', 'courses')
IMG_DIR = os.path.join(os.path.dirname(__file__), '..', 'public', 'images')
os.makedirs(IMG_DIR, exist_ok=True)

# Step 1: Find all unique image URLs across all course JSON files
print("Scanning course JSON files for image URLs...")
url_pattern = re.compile(r'(https://navigating-radiology\.imgix\.net/media/[^"\'>\s?]+)')
all_urls = set()
for f in sorted(glob.glob(os.path.join(DATA_DIR, '*.json'))):
    data = json.load(open(f))
    for case in data.get('cases', []):
        for section in case.get('teachingSections', []):
            html = section.get('html', '')
            for m in url_pattern.finditer(html):
                all_urls.add(m.group(1))

print(f"Found {len(all_urls)} unique image URLs")

# Step 2: Build URL -> local filename mapping
url_to_local = {}
for url in sorted(all_urls):
    # Extract path: /media/123/filename.png -> media_123_filename.png
    path = urlparse(url).path  # /media/123/filename.png
    parts = path.strip('/').split('/')  # ['media', '123', 'filename.png']
    local_name = '_'.join(parts)  # media_123_filename.png
    url_to_local[url] = local_name

# Step 3: Download images
downloaded = 0
skipped = 0
failed = 0
for url, local_name in sorted(url_to_local.items()):
    local_path = os.path.join(IMG_DIR, local_name)
    if os.path.exists(local_path) and os.path.getsize(local_path) > 0:
        skipped += 1
        continue
    try:
        # Add auto=format for optimal format, limit width to 1200px
        download_url = url + '?auto=format&w=1200'
        urllib.request.urlretrieve(download_url, local_path)
        downloaded += 1
        sys.stdout.write(f"\r  Downloaded {downloaded}: {local_name}")
        sys.stdout.flush()
    except Exception as e:
        print(f"\n  FAILED: {url} -> {e}")
        failed += 1

print(f"\nDownload complete: {downloaded} new, {skipped} already existed, {failed} failed")

# Step 4: Update teaching HTML in all course JSON files
print("\nUpdating teaching HTML to use local image paths...")
updated_files = 0
total_replacements = 0
for f in sorted(glob.glob(os.path.join(DATA_DIR, '*.json'))):
    data = json.load(open(f))
    file_changed = False
    for case in data.get('cases', []):
        for section in case.get('teachingSections', []):
            html = section.get('html', '')
            new_html = html
            for url, local_name in url_to_local.items():
                if url in new_html:
                    # Replace full URL (with any query params) with local path
                    # Match url followed by optional ?params
                    pattern = re.escape(url) + r'(\?[^"\'>\s]*)?'
                    new_html = re.sub(pattern, f'/images/{local_name}', new_html)
                    total_replacements += 1
            if new_html != html:
                section['html'] = new_html
                file_changed = True
    if file_changed:
        with open(f, 'w') as fh:
            json.dump(data, fh, separators=(',', ':'))
        updated_files += 1

print(f"Updated {updated_files} course files with {total_replacements} URL replacements")
print("Done!")
