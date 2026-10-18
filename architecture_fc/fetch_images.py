import json
import re
import urllib.request
import urllib.parse
import time
import os
from concurrent.futures import ThreadPoolExecutor, as_completed

CACHE_FILE = 'images_cache.json'
cache = {}
if os.path.exists(CACHE_FILE):
    try:
        with open(CACHE_FILE, 'r', encoding='utf-8') as f:
            cache = json.load(f)
        print(f"Loaded {len(cache)} cached images.")
    except Exception:
        cache = {}

HEADERS = {
    'User-Agent': 'ArchitectureFC/2.0 (FIFA Online Architecture Game; contact@architecturefc.org) python-urllib'
}

def query_wiki_pageimage(title, lang='en'):
    url = f"https://{lang}.wikipedia.org/w/api.php?action=query&titles={urllib.parse.quote(title)}&prop=pageimages&format=json&pithumbsize=600"
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=4) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            pages = data.get('query', {}).get('pages', {})
            for pid, p in pages.items():
                if pid != '-1' and 'thumbnail' in p:
                    return p['thumbnail']['source']
    except Exception:
        pass
    return None

def query_wiki_search(query, lang='en'):
    url = f"https://{lang}.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch={urllib.parse.quote(query)}&gsrlimit=1&prop=pageimages&pithumbsize=600&format=json"
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=4) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            pages = data.get('query', {}).get('pages', {})
            for pid, p in pages.items():
                if 'thumbnail' in p:
                    return p['thumbnail']['source']
    except Exception:
        pass
    return None

def query_commons(query):
    url = f"https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch={urllib.parse.quote(query)}&gsrlimit=1&gsrnamespace=6&prop=imageinfo&iiprop=url&iiurlwidth=600&format=json"
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=4) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            pages = data.get('query', {}).get('pages', {})
            for pid, p in pages.items():
                if 'imageinfo' in p and len(p['imageinfo']) > 0:
                    return p['imageinfo'][0].get('thumburl') or p['imageinfo'][0].get('url')
    except Exception:
        pass
    return None

def resolve_image(key, en_name, ko_name, manager_en, manager_ko):
    if key in cache and cache[key]:
        return key, cache[key]

    # Strategy 1: Direct English title
    img = query_wiki_pageimage(en_name, 'en')
    if img:
        return key, img

    # Strategy 2: English search with manager
    img = query_wiki_search(f"{en_name} {manager_en}", 'en')
    if img:
        return key, img

    # Strategy 3: Just English title search
    img = query_wiki_search(en_name, 'en')
    if img:
        return key, img

    # Strategy 4: Korean search
    img = query_wiki_search(f"{ko_name} {manager_ko}", 'ko')
    if img:
        return key, img

    # Strategy 5: Korean title search
    img = query_wiki_search(ko_name, 'ko')
    if img:
        return key, img

    # Strategy 6: Commons search
    img = query_commons(f"{en_name} {manager_en}")
    if img:
        return key, img

    img = query_commons(en_name)
    if img:
        return key, img

    return key, None

def main():
    with open('data.js', 'r', encoding='utf-8') as f:
        text = f.read()

    match = re.search(r'const MANAGERS_DATA\s*=\s*(\[[\s\S]*\]);\s*(?:if\s*\(typeof module|$)', text)
    if not match:
        print("Could not parse data.js")
        return

    managers = json.loads(match.group(1))

    # Collect tasks
    tasks = []
    # 1. Architects
    for m in managers:
        m_key = f"mgr_{m['id']}"
        tasks.append((m_key, m['nativeName'], m['name'], '', ''))
        for b in m['buildings']:
            b_key = f"bld_{b['id']}"
            tasks.append((b_key, b.get('originalName', b['name']), b['name'], m['nativeName'], m['name']))

    print(f"Total items to check: {len(tasks)}")

    # Filter out already cached items
    pending = [t for t in tasks if t[0] not in cache or not cache[t[0]]]
    print(f"Pending items to fetch: {len(pending)}")

    completed = 0
    save_counter = 0

    with ThreadPoolExecutor(max_workers=6) as executor:
        future_map = {executor.submit(resolve_image, t[0], t[1], t[2], t[3], t[4]): t[0] for t in pending}
        for future in as_completed(future_map):
            k, url = future.result()
            if url:
                cache[k] = url
            completed += 1
            save_counter += 1
            if save_counter >= 25 or completed == len(pending):
                with open(CACHE_FILE, 'w', encoding='utf-8') as f:
                    json.dump(cache, f, ensure_ascii=False, indent=2)
                save_counter = 0
                print(f"Progress: {completed}/{len(pending)} (Cached total: {len(cache)})")

    print(f"Done! Total cached images: {len(cache)}")

if __name__ == '__main__':
    main()
