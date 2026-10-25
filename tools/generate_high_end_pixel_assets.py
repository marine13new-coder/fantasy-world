import os
import math
import json
from PIL import Image, ImageDraw

TEXTURE_DIR = os.path.join("Assets", "CozyPixelFishing", "Textures")
os.makedirs(TEXTURE_DIR, exist_ok=True)

def hex_to_rgb(hex_str):
    hex_str = hex_str.lstrip('#')
    return tuple(int(hex_str[i:i+2], 16) for i in (0, 2, 4))

def create_boat_sprite():
    w, h = 160, 72
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Palette
    c_wood_dark = (70, 42, 28, 255)
    c_wood_mid = (115, 72, 46, 255)
    c_wood_light = (168, 114, 76, 255)
    c_wood_highlight = (214, 158, 118, 255)
    c_trim_gold = (218, 165, 32, 255)
    c_brass_lantern = (235, 185, 80, 255)
    c_rope = (195, 175, 130, 255)
    c_shadow = (20, 25, 45, 140)

    # 1. Soft underwater shadow ellipse
    for y in range(48, 68):
        for x in range(12, 148):
            dx = (x - 80) / 64.0
            dy = (y - 58) / 8.0
            if dx*dx + dy*dy <= 1.0:
                dist = math.sqrt(dx*dx + dy*dy)
                alpha = int(120 * (1.0 - dist))
                img.putpixel((x, y), (15, 30, 45, alpha))

    # 2. Boat Hull Construction (Smooth curved planks)
    for x in range(16, 144):
        # Normalized boat length
        tx = (x - 16) / 128.0
        # Hull bottom profile (deeper in middle, sloping up at bow and stern)
        bottom_curve = math.sin(tx * math.pi) * 16.0
        top_y = 24 + int(abs(tx - 0.5) * 6.0)
        bot_y = 38 + int(bottom_curve)

        for y in range(top_y, bot_y):
            # Planks simulation with horizontal grooves
            layer = (y - top_y)
            if y == bot_y - 1:
                color = c_wood_dark
            elif (y % 7) == 0:
                color = c_wood_dark
            elif y == top_y:
                color = c_trim_gold
            elif y == top_y + 1:
                color = c_wood_highlight
            elif y > bot_y - 5:
                color = c_wood_mid
            else:
                color = c_wood_light

            # Stern/Bow shading
            if x < 28 or x > 132:
                # Darken ends
                color = tuple(max(0, int(c * 0.8)) for c in color[:3]) + (255,)
            img.putpixel((x, y), color)

    # 3. Wooden Deck Bench & Interior
    for x in range(36, 124):
        for y in range(22, 28):
            color = c_wood_mid if y == 27 else c_wood_light
            img.putpixel((x, y), color)

    # 4. Tackle Box on Deck (Left side)
    for bx in range(42, 54):
        for by in range(16, 24):
            c_box = (65, 105, 125, 255) # Cozy sea-blue tackle box
            if bx in (42, 53) or by in (16, 23):
                c_box = (35, 55, 70, 255)
            elif by == 19:
                c_box = (220, 200, 120, 255) # Brass clasp
            img.putpixel((bx, by), c_box)

    # 5. Rope Spool (Right side)
    for rx in range(106, 118):
        for ry in range(18, 25):
            dx = (rx - 112) / 5.0
            dy = (ry - 21) / 3.0
            if dx*dx + dy*dy <= 1.0:
                c_r = c_rope if (rx + ry) % 2 == 0 else (150, 130, 90, 255)
                img.putpixel((rx, ry), c_r)

    # 6. Bow Lantern Post & Brass Lantern (Rightmost bow)
    # Post
    for py in range(8, 26):
        img.putpixel((136, py), (80, 50, 30, 255))
        img.putpixel((137, py), (130, 85, 50, 255))
    # Hook
    for hx in range(137, 143):
        img.putpixel((hx, 9), (90, 60, 40, 255))
    # Lantern Frame
    for lx in range(139, 147):
        for ly in range(11, 21):
            if lx in (139, 146) or ly in (11, 20):
                img.putpixel((lx, ly), c_brass_lantern)
            else:
                # Glowing lantern core
                img.putpixel((lx, ly), (255, 240, 160, 255))

    img.save(os.path.join(TEXTURE_DIR, "boat_detailed.png"))
    print("[Asset] boat_detailed.png created!")

def create_angler_sprites():
    # 4 poses: Idle, Cast, Reel, Catch (Each 64x96)
    poses = ["idle", "cast", "reel", "catch"]

    # Shared Cozy Palette
    c_hat_straw = (245, 220, 145, 255)
    c_hat_shadow = (205, 175, 105, 255)
    c_ribbon = (175, 55, 75, 255)
    c_skin = (255, 220, 190, 255)
    c_skin_shadow = (230, 185, 155, 255)
    c_sweater_mint = (95, 175, 160, 255)
    c_sweater_dark = (65, 130, 120, 255)
    c_sweater_highlight = (135, 210, 195, 255)
    c_pants_brown = (100, 75, 60, 255)
    c_boots = (55, 40, 30, 255)
    c_rod_bamboo = (225, 195, 110, 255)
    c_rod_wrap = (155, 60, 60, 255)

    for pose in poses:
        img = Image.new("RGBA", (64, 96), (0, 0, 0, 0))

        # Y offset for breathing or tension
        y_off = 0
        if pose == "reel":
            y_off = 4 # crouching
        elif pose == "cast":
            y_off = -2 # reaching high
        elif pose == "catch":
            y_off = -3 # standing proud

        # 1. Straw Hat (Common to all)
        hat_center_x = 28 if pose != "cast" else 25
        hat_y = 20 + y_off

        # Brim
        for x in range(hat_center_x - 18, hat_center_x + 19):
            for y in range(hat_y + 8, hat_y + 13):
                dist = abs(x - hat_center_x)
                if dist <= 18 - (y - (hat_y + 8))*2:
                    c = c_hat_straw if y == hat_y + 8 else c_hat_shadow
                    img.putpixel((x, y), c)

        # Crown
        for x in range(hat_center_x - 9, hat_center_x + 10):
            for y in range(hat_y, hat_y + 9):
                c = c_hat_straw if x < hat_center_x + 3 else c_hat_shadow
                if y == hat_y + 7:
                    c = c_ribbon # Maroon ribbon
                img.putpixel((x, y), c)

        # 2. Face & Hair
        face_x = hat_center_x - 5
        face_y = hat_y + 12
        for x in range(face_x, face_x + 12):
            for y in range(face_y, face_y + 11):
                img.putpixel((x, y), c_skin)
        # Cozy cheek blush
        img.putpixel((face_x + 1, face_y + 6), (255, 150, 160, 255))
        img.putpixel((face_x + 9, face_y + 6), (255, 150, 160, 255))
        # Eyes
        if pose == "catch":
            # Happy closed crescent eyes ^ ^
            img.putpixel((face_x + 3, face_y + 4), (40, 25, 20, 255))
            img.putpixel((face_x + 4, face_y + 3), (40, 25, 20, 255))
            img.putpixel((face_x + 7, face_y + 4), (40, 25, 20, 255))
            img.putpixel((face_x + 8, face_y + 3), (40, 25, 20, 255))
            # Big smile
            img.putpixel((face_x + 5, face_y + 8), (180, 60, 60, 255))
            img.putpixel((face_x + 6, face_y + 8), (180, 60, 60, 255))
        elif pose == "reel":
            # Determined focused eyes
            img.putpixel((face_x + 4, face_y + 4), (40, 25, 20, 255))
            img.putpixel((face_x + 8, face_y + 4), (40, 25, 20, 255))
        else:
            # Gentle relaxed eyes
            img.putpixel((face_x + 4, face_y + 4), (40, 25, 20, 255))
            img.putpixel((face_x + 8, face_y + 4), (40, 25, 20, 255))
            # Gentle smile
            img.putpixel((face_x + 6, face_y + 8), (200, 100, 90, 255))

        # 3. Knitted Mint Sweater (Torso)
        body_x = face_x - 3
        body_y = face_y + 11
        for x in range(body_x, body_x + 18):
            for y in range(body_y, body_y + 22):
                # Knitted sweater pattern
                knit = (x + y) % 3 == 0
                c = c_sweater_highlight if (x < body_x + 6 and knit) else (c_sweater_mint if not knit else c_sweater_dark)
                img.putpixel((x, y), c)

        # 4. Trousers & Boots
        pants_y = body_y + 22
        for x in range(body_x + 2, body_x + 16):
            for y in range(pants_y, pants_y + 16):
                img.putpixel((x, y), c_pants_brown)
        # Boots
        for x in range(body_x + 1, body_x + 18):
            for y in range(pants_y + 16, pants_y + 24):
                img.putpixel((x, y), c_boots)

        # 5. Arms, Hands & Bamboo Rod Poses
        if pose == "idle":
            # Holding rod comfortably pointed right-up
            for i in range(32):
                rx = body_x + 14 + i
                ry = body_y + 8 - int(i * 0.75)
                if 0 <= rx < 64 and 0 <= ry < 96:
                    c = c_rod_bamboo if i % 5 != 0 else c_rod_wrap
                    img.putpixel((rx, ry), c)
            # Arm
            for ax in range(body_x + 10, body_x + 16):
                for ay in range(body_y + 6, body_y + 14):
                    img.putpixel((ax, ay), c_sweater_mint)

        elif pose == "cast":
            # Rod held backwards high overhead
            for i in range(36):
                rx = body_x + 4 - int(i * 0.7)
                ry = body_y - 4 - int(i * 0.8)
                if 0 <= rx < 64 and 0 <= ry < 96:
                    img.putpixel((rx, ry), c_rod_bamboo)
            # Raised arms
            for ax in range(body_x + 2, body_x + 8):
                for ay in range(body_y - 2, body_y + 8):
                    img.putpixel((ax, ay), c_sweater_mint)

        elif pose == "reel":
            # Rod heavily bent forward-up!
            for i in range(34):
                rx = body_x + 12 + i
                # Curved bending rod arc
                bend = math.sin((i / 34.0) * math.pi * 0.6) * 12.0
                ry = body_y + 6 - int(i * 0.5) - int(bend)
                if 0 <= rx < 64 and 0 <= ry < 96:
                    img.putpixel((rx, ry), (245, 175, 80, 255))
            # Two hands gripping tightly
            for ax in range(body_x + 8, body_x + 16):
                for ay in range(body_y + 4, body_y + 12):
                    img.putpixel((ax, ay), c_sweater_dark)

        elif pose == "catch":
            # Rod raised vertical with pride!
            for i in range(36):
                rx = body_x + 20
                ry = body_y + 4 - i
                if 0 <= rx < 64 and 0 <= ry < 96:
                    img.putpixel((rx, ry), c_rod_bamboo)
            # Arm raised holding a cute wiggling fish!
            for ax in range(body_x - 6, body_x):
                for ay in range(body_y - 6, body_y + 4):
                    img.putpixel((ax, ay), c_skin)
            # Fish in hand!
            for fx in range(body_x - 14, body_x - 4):
                for fy in range(body_y - 12, body_y - 2):
                    img.putpixel((fx, fy), (255, 195, 80, 255)) # Golden fish!

        img.save(os.path.join(TEXTURE_DIR, f"angler_{pose}.png"))
        print(f"[Asset] angler_{pose}.png created!")

def create_cat_mochi():
    w, h = 36, 36
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))

    # Calico Palette
    c_white = (250, 245, 240, 255)
    c_orange = (235, 140, 60, 255)
    c_dark = (60, 45, 40, 255)
    c_pink = (255, 170, 180, 255)

    # Cat Body (fluffy curled ball)
    for x in range(8, 28):
        for y in range(12, 28):
            dx = (x - 18) / 10.0
            dy = (y - 20) / 7.0
            if dx*dx + dy*dy <= 1.0:
                # Calico patches
                c = c_orange if x < 15 else (c_dark if x > 23 and y < 18 else c_white)
                img.putpixel((x, y), c)

    # Cat Head
    for x in range(16, 30):
        for y in range(6, 18):
            dx = (x - 23) / 6.0
            dy = (y - 12) / 5.0
            if dx*dx + dy*dy <= 1.0:
                c = c_orange if x > 24 else c_white
                img.putpixel((x, y), c)

    # Cute Triangular Ears
    # Left Ear
    img.putpixel((19, 4), c_white)
    img.putpixel((18, 5), c_white)
    img.putpixel((19, 5), c_pink)
    # Right Ear
    img.putpixel((26, 4), c_orange)
    img.putpixel((26, 5), c_pink)
    img.putpixel((27, 5), c_orange)

    # Eyes (Cozy sleeping closed curves ^ ^)
    img.putpixel((22, 11), (40, 30, 25, 255))
    img.putpixel((23, 10), (40, 30, 25, 255))
    img.putpixel((26, 11), (40, 30, 25, 255))
    img.putpixel((27, 10), (40, 30, 25, 255))
    # Pink nose
    img.putpixel((24, 13), c_pink)

    # Swishing Fluffy Tail
    for i in range(12):
        tx = 8 - int(i * 0.6)
        ty = 22 - int(math.sin(i / 12.0 * math.pi) * 6.0)
        if 0 <= tx < w and 0 <= ty < h:
            img.putpixel((tx, ty), c_orange if i < 6 else c_white)
            img.putpixel((tx, ty+1), c_dark if i < 4 else c_white)

    # Front paw reaching out toward water
    img.putpixel((26, 26), c_white)
    img.putpixel((27, 27), c_pink)
    img.putpixel((28, 28), c_white)

    img.save(os.path.join(TEXTURE_DIR, "cat_mochi.png"))
    print("[Asset] cat_mochi.png created!")

def create_fx_textures():
    # 1. High Detail Bobber (24x40)
    img_bob = Image.new("RGBA", (24, 40), (0, 0, 0, 0))
    for y in range(40):
        for x in range(24):
            # Top stem
            if 0 <= y < 10 and 11 <= x <= 12:
                img_bob.putpixel((x, y), (40, 40, 45, 255))
            # Oval float body
            elif 10 <= y < 34:
                dx = (x - 11.5) / 7.5
                dy = (y - 22.0) / 11.0
                if dx*dx + dy*dy <= 1.0:
                    dist = math.sqrt(dx*dx + dy*dy)
                    highlight = 1.0 if x in (8, 9) and y in (14, 15, 16) else 0.0

                    if y < 22:
                        # Crimson Top
                        c = (255, 60, 75, 255) if highlight == 0 else (255, 190, 200, 255)
                    elif y in (22, 23):
                        # Clean white mid-stripe
                        c = (255, 255, 255, 255)
                    else:
                        # Teal Bottom
                        c = (45, 135, 140, 255)
                    img_bob.putpixel((x, y), c)
            # Bottom stem
            elif 34 <= y < 39 and 11 <= x <= 12:
                img_bob.putpixel((x, y), (200, 180, 80, 255))
    img_bob.save(os.path.join(TEXTURE_DIR, "bobber_detailed.png"))

    # 2. Exclamation Pop Bubble (36x64)
    img_excl = Image.new("RGBA", (36, 64), (0, 0, 0, 0))
    # Juicy cartoon (!) with outer dark border, golden gradient, white specular
    for y in range(64):
        for x in range(36):
            # Upper exclamation bar
            if 6 <= y <= 42:
                width = 5.0 + (42 - y) * 0.12 # tapered downwards
                cx = 18.0
                if abs(x - cx) <= width:
                    if abs(x - cx) >= width - 1.2 or y in (6, 7, 41, 42):
                        img_excl.putpixel((x, y), (140, 25, 20, 255)) # Dark red outline
                    else:
                        grad = (y - 6) / 36.0
                        r = int(255)
                        g = int(220 - grad * 120)
                        b = int(40)
                        if x == int(cx - width + 2) and y < 24: # Specular highlight
                            img_excl.putpixel((x, y), (255, 255, 240, 255))
                        else:
                            img_excl.putpixel((x, y), (r, g, b, 255))
            # Bottom dot
            elif 48 <= y <= 58:
                dx = (x - 18.0) / 5.0
                dy = (y - 53.0) / 5.0
                if dx*dx + dy*dy <= 1.0:
                    if dx*dx + dy*dy >= 0.65:
                        img_excl.putpixel((x, y), (140, 25, 20, 255))
                    else:
                        img_excl.putpixel((x, y), (255, 190, 30, 255))
    img_excl.save(os.path.join(TEXTURE_DIR, "exclamation_detailed.png"))

    # 3. Water Ripple Ring (64x32)
    img_rip = Image.new("RGBA", (64, 32), (0, 0, 0, 0))
    for y in range(32):
        for x in range(64):
            dx = (x - 32.0) / 28.0
            dy = (y - 16.0) / 12.0
            r = math.sqrt(dx*dx + dy*dy)
            if 0.8 <= r <= 1.0:
                alpha = int(180 * math.sin((r - 0.8) / 0.2 * math.pi))
                img_rip.putpixel((x, y), (220, 250, 245, alpha))
            elif 0.45 <= r <= 0.65:
                alpha = int(100 * math.sin((r - 0.45) / 0.2 * math.pi))
                img_rip.putpixel((x, y), (180, 235, 240, alpha))
    img_rip.save(os.path.join(TEXTURE_DIR, "water_ripple_ring.png"))

    # 4. Underwater Fish Shadow (64x32)
    img_fish = Image.new("RGBA", (64, 32), (0, 0, 0, 0))
    for y in range(32):
        for x in range(64):
            # Fish body profile
            dx = (x - 32.0) / 22.0
            dy = (y - 16.0) / 8.0
            if dx*dx + dy*dy <= 1.0:
                # Taper tail
                if x < 20:
                    dy_tail = abs(y - 16.0)
                    if dy_tail <= (20 - x) * 0.7:
                        img_fish.putpixel((x, y), (20, 45, 60, 160))
                else:
                    img_fish.putpixel((x, y), (20, 45, 60, 180))
            # Tail fin
            if 6 <= x <= 14 and abs(y - 16.0) <= (14 - x) * 1.2:
                img_fish.putpixel((x, y), (20, 45, 60, 140))
    img_fish.save(os.path.join(TEXTURE_DIR, "fish_shadow.png"))

    # 5. Radial Lantern Light Glow (128x128)
    img_light = Image.new("RGBA", (128, 128), (0, 0, 0, 0))
    for y in range(128):
        for x in range(128):
            dx = (x - 64.0) / 64.0
            dy = (y - 64.0) / 64.0
            dist = math.sqrt(dx*dx + dy*dy)
            if dist <= 1.0:
                falloff = math.pow(1.0 - dist, 2.2)
                alpha = int(220 * falloff)
                r = int(255)
                g = int(210 - dist * 70)
                b = int(120 - dist * 80)
                img_light.putpixel((x, y), (r, g, b, alpha))
    img_light.save(os.path.join(TEXTURE_DIR, "lantern_light.png"))

    # 6. Sparkle Star (24x24)
    img_star = Image.new("RGBA", (24, 24), (0, 0, 0, 0))
    for y in range(24):
        for x in range(24):
            dx = abs(x - 12.0)
            dy = abs(y - 12.0)
            if dx == 0 and dy <= 10:
                alpha = int(255 * (1.0 - dy / 11.0))
                img_star.putpixel((x, y), (255, 255, 230, alpha))
            elif dy == 0 and dx <= 10:
                alpha = int(255 * (1.0 - dx / 11.0))
                img_star.putpixel((x, y), (255, 255, 230, alpha))
            elif dx <= 3 and dy <= 3:
                img_star.putpixel((x, y), (255, 230, 140, 220))
    img_star.save(os.path.join(TEXTURE_DIR, "sparkle_star.png"))

    # 7. Sakura Leaf Petal (16x16)
    img_petal = Image.new("RGBA", (16, 16), (0, 0, 0, 0))
    for y in range(16):
        for x in range(16):
            dx = (x - 8.0) / 6.0
            dy = (y - 8.0) / 4.0
            if dx*dx + dy*dy <= 1.0:
                c = (255, 185, 200, 220) if y < 9 else (240, 150, 175, 240)
                img_petal.putpixel((x, y), c)
    img_petal.save(os.path.join(TEXTURE_DIR, "sakura_petal.png"))

    # 8. Shiny Gold Coin (24x24)
    img_coin = Image.new("RGBA", (24, 24), (0, 0, 0, 0))
    for y in range(24):
        for x in range(24):
            dx = (x - 12.0) / 10.0
            dy = (y - 12.0) / 10.0
            dist = math.sqrt(dx*dx + dy*dy)
            if dist <= 1.0:
                if dist >= 0.85:
                    img_coin.putpixel((x, y), (180, 120, 20, 255)) # Dark rim
                elif dist >= 0.7:
                    img_coin.putpixel((x, y), (255, 235, 110, 255)) # Highlight rim
                else:
                    # Faceted star or inner coin face
                    c = (255, 200, 40, 255)
                    if (abs(x - 12.0) <= 1 and abs(y - 12.0) <= 4) or (abs(y - 12.0) <= 1 and abs(x - 12.0) <= 4):
                        c = (255, 245, 160, 255) # Inner star
                    img_coin.putpixel((x, y), c)
    img_coin.save(os.path.join(TEXTURE_DIR, "ui_gold_coin.png"))

    print("[Asset] All procedural FX & UI pixel textures created successfully!")

if __name__ == "__main__":
    create_boat_sprite()
    create_angler_sprites()
    create_cat_mochi()
    create_fx_textures()
    print("[Pipeline] Complete pixel asset generation finished!")
