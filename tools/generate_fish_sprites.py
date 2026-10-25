import os
import json
import math
from PIL import Image

DEX_PATH = os.path.join("Assets", "StreamingAssets", "FishDex.json")
FISH_TEXTURE_DIR = os.path.join("Assets", "CozyPixelFishing", "Textures", "Fishes")
os.makedirs(FISH_TEXTURE_DIR, exist_ok=True)

def hex_to_rgb(hex_str):
    hex_str = hex_str.lstrip('#')
    if len(hex_str) == 3:
        hex_str = ''.join([c*2 for c in hex_str])
    return tuple(int(hex_str[i:i+2], 16) for i in (0, 2, 4))

def draw_cozy_pixel_fish(fish_data, output_file):
    w, h = 48, 32
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))

    base_rgb = hex_to_rgb(fish_data.get("color_hex", "#A0E7E5"))
    # Derived colors
    c_highlight = tuple(min(255, int(c * 1.35 + 30)) for c in base_rgb) + (255,)
    c_base = base_rgb + (255,)
    c_shadow = tuple(max(0, int(c * 0.65)) for c in base_rgb) + (255,)
    c_belly = tuple(min(255, int(c * 1.2 + 60)) for c in base_rgb) + (255,)
    c_eye_white = (255, 255, 255, 255)
    c_eye_pupil = (25, 20, 30, 255)
    c_sparkle = (255, 255, 220, 255)

    fish_id = fish_data.get("id", 1)
    rarity = fish_data.get("rarity", "Common")
    body_type = fish_id % 4 # 0: Carp/Goldfish, 1: Round Puffer/Minnow, 2: Long Trout/Eel, 3: Mystic Jelly/Ray

    # Center is at (26, 16)
    cx, cy = 26.0, 16.0

    if body_type == 0:
        # Classic Carp / Goldfish
        rx, ry = 14.0, 8.5
        for y in range(h):
            for x in range(w):
                dx = (x - cx) / rx
                dy = (y - cy) / ry
                if dx*dx + dy*dy <= 1.0:
                    # Shading
                    if y < cy - 3:
                        c = c_highlight
                    elif y > cy + 2:
                        c = c_belly
                    else:
                        # Scales pattern
                        c = c_base if (x + y) % 3 != 0 else c_shadow
                    img.putpixel((x, y), c)

                # Tail Fin
                if x < 13:
                    tail_dy = abs(y - cy)
                    tail_span = (13 - x) * 1.1
                    if tail_dy <= tail_span:
                        c_fin = c_highlight if tail_dy > tail_span - 2 else c_shadow
                        img.putpixel((x, y), c_fin)

                # Dorsal Fin
                if 20 <= x <= 32 and cy - ry - 4 <= y < cy - ry + 1:
                    if (x - 20) * 0.5 >= (cy - ry - y):
                        img.putpixel((x, y), c_highlight)

    elif body_type == 1:
        # Plump Puffer / Minnow (Cute round body)
        rx, ry = 12.0, 11.0
        for y in range(h):
            for x in range(w):
                dx = (x - cx) / rx
                dy = (y - cy) / ry
                if dx*dx + dy*dy <= 1.0:
                    c = c_belly if y > cy + 3 else (c_highlight if y < cy - 4 else c_base)
                    img.putpixel((x, y), c)

                # Little fluttering tail
                if x < 15 and abs(y - cy) <= (15 - x) * 0.8:
                    img.putpixel((x, y), c_highlight)
                # Tiny pectoral fin
                if 22 <= x <= 26 and cy + 1 <= y <= cy + 5:
                    img.putpixel((x, y), c_highlight)

    elif body_type == 2:
        # Sleek Salmon / Streamlined Fish
        rx, ry = 16.0, 6.5
        for y in range(h):
            for x in range(w):
                dx = (x - cx) / rx
                dy = (y - cy) / ry
                if dx*dx + dy*dy <= 1.0:
                    c = c_belly if y > cy + 1 else (c_highlight if y < cy - 2 else c_base)
                    img.putpixel((x, y), c)
                # Split tail
                if x < 11:
                    tail_dy = abs(y - cy)
                    if 2 <= tail_dy <= (11 - x) * 1.2:
                        img.putpixel((x, y), c_shadow)

    else:
        # Whimsical / Ray / Bioluminescent
        rx, ry = 15.0, 8.0
        for y in range(h):
            for x in range(w):
                dx = (x - cx) / rx
                dy = (y - cy) / ry
                if dx*dx + dy*dy <= 1.0:
                    c = c_base if (x*x + y*y) % 5 != 0 else c_sparkle
                    img.putpixel((x, y), c)
                # Flowing wispy ribbon tail
                if x < 12 and abs(y - cy - math.sin(x * 0.8) * 3.0) <= 2.0:
                    img.putpixel((x, y), c_highlight)

    # Big cute anime eye
    eye_x = int(cx + rx * 0.55)
    eye_y = int(cy - 2)
    img.putpixel((eye_x, eye_y), c_eye_white)
    img.putpixel((eye_x + 1, eye_y), c_eye_white)
    img.putpixel((eye_x, eye_y + 1), c_eye_white)
    img.putpixel((eye_x + 1, eye_y + 1), c_eye_pupil)
    # Cute eye catchlight
    img.putpixel((eye_x, eye_y), (255, 255, 255, 255))

    # Legendary / Epic Aura sparkles
    if rarity in ("Epic", "Legendary"):
        for sx, sy in [(eye_x + 4, eye_y - 4), (int(cx), int(cy - ry - 3)), (int(cx - 8), int(cy + ry + 2))]:
            if 0 <= sx < w and 0 <= sy < h:
                img.putpixel((sx, sy), c_sparkle)

    img.save(output_file)

def main():
    if not os.path.exists(DEX_PATH):
        print(f"Error: {DEX_PATH} not found!")
        return

    with open(DEX_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    fishes = data.get("fishes", [])
    print(f"[FishGen] Generating {len(fishes)} unique handcrafted pixel fish sprites...")

    for fish in fishes:
        fid = fish.get("id", 1)
        filename = f"fish_{fid:02d}.png"
        filepath = os.path.join(FISH_TEXTURE_DIR, filename)
        draw_cozy_pixel_fish(fish, filepath)

    print(f"[FishGen] All {len(fishes)} pixel fish sprites successfully generated in {FISH_TEXTURE_DIR}!")

if __name__ == "__main__":
    main()
