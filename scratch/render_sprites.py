import os
from PIL import Image, ImageDraw, ImageFont

PALETTE = {
    '.': None,
    '#': (15, 23, 42, 255),    # dark contour outline #0f172a
    'k': (30, 41, 59, 255),    # deepest shadow #1e293b
    's': (71, 85, 105, 255),   # dark steel #475569
    'm': (148, 163, 184, 255), # mid steel #94a3b8
    'h': (226, 232, 240, 255), # highlight steel #e2e8f0
    'w': (255, 255, 255, 255), # pure white shine
    'f': (254, 215, 170, 255), # flesh #fed7aa
    'F': (234, 88, 12, 255),   # flesh shadow #ea580c
    'd': (154, 52, 18, 255),   # deep shadow flesh #9a3412
    'r': (220, 38, 38, 255),   # ruby red #dc2626
    'R': (239, 68, 68, 255),   # bright red #ef4444
    'g': (202, 138, 4, 255),   # gold shadow #ca8a04
    'G': (250, 204, 21, 255),  # gold bright #facc15
    'y': (254, 240, 138, 255), # pale yellow #fef08a
    'b': (29, 78, 216, 255),   # blue cloth #1d4ed8
    'B': (59, 130, 246, 255),  # bright blue #3b82f6
    'c': (2, 132, 199, 255),   # cyan #0284c7
    'C': (56, 189, 248, 255),  # light cyan #38bdf8
    'p': (126, 34, 206, 255),  # purple #7e22ce
    'P': (192, 132, 252, 255), # light purple #c084fc
    'e': (21, 128, 61, 255),   # emerald green / goblin skin #15803d
    'E': (34, 197, 94, 255),   # bright green #22c55e
    'L': (134, 239, 172, 255), # lime highlight #86efac
    'o': (120, 53, 15, 255),   # leather brown #78350f
    'O': (180, 83, 9, 255),    # light brown #b45309
    'x': (69, 26, 3, 255)      # wood dark #451a03
}

SPRITES = {
    # 1. Knight (Full plate, red plume, visor slit, heater shield, broadsword)
    'knight': [
        "......####......",
        ".....#RRrr#.....",
        "....#Rkddrr#....",
        "...#hhmhhhh#....",
        "..#h#m#h#m##....",
        "..#hhsmhhhsh#...",
        "...#ssssss#.....",
        "..#bbGssGbb#....",
        ".#bb#GssG#bb#...",
        ".#f#ssssss#f#h..",
        "..#hssssssh#wh#.",
        "..#hh#ss#hh#wh#.",
        "...##ssss##.wh#.",
        "...#kk##kk#.wh#.",
        "..#hh#..#hh#G##.",
        "..####..####.##."
    ],
    # 2. Wizard (Pointed blue hat with gold star, long beard, robes, orb staff)
    'wizard': [
        "......##........",
        ".....#bb#.......",
        "....#bbbb#......",
        "...#bGGbbb#.....",
        "..#bbbbbbbb#....",
        ".############...",
        "...#FffffF#..y..",
        "...#f#ff#f#.yCy.",
        "...#wwwwww#..y..",
        "...#wwwwww#..x..",
        "..#bbbbbbbb#GxG.",
        ".#b#bbbbbb#b#x..",
        ".#b#bbbbbb#b#x..",
        "..#bbbbbbbb#x...",
        "...#kk##kk#.x...",
        "..####..####x..."
    ],
    # 3. Priestess (Nun wimple with gold cross, blue robe, healer staff)
    'priestess': [
        "....######......",
        "...#wwwwww#.....",
        "..#wwwGGwww#....",
        "..#wwGGGGww#....",
        "..#wwwGGwww#....",
        "..#w#FffF#w#....",
        "..#w#f##f#w#....",
        "..#w#ffff#w#....",
        "...#wwwwww#..O..",
        "..#bbwwwwbb#.OxO",
        ".#bb#wwww#bb#.x.",
        ".#f#bbwwbb#f#.x.",
        "..#bbbbbbbb#..x.",
        "..#bbbbbbbb#..x.",
        "...#kk##kk#...x.",
        "..####..####..x."
    ],
    # 4. Paladin (Great Helm with cross visor, red heraldry shield, spear)
    'paladin': [
        ".....######.....",
        "....#hhhhhh#....",
        "...#hhGGGGhh#...",
        "...#hh#GG#hh#...",
        "...#GGGGGGGG#...",
        "...#hh#GG#hh#...",
        "....#hhhhhh#....",
        "..#h#hhhhhh#h#h.",
        ".#Rh#hhmmhh#hR#h",
        ".#Rh#hhsshh#hR#h",
        ".#Rh#hhhhhh#hR#h",
        "..#G#hhsshh#G##.",
        "...##hhhhhh##.x.",
        "...#kk##kk#...x.",
        "..#hh#..#hh#..x.",
        "..####..####..x."
    ],
    # 5. Axe Knight (Plate mail with horned visor and giant battleaxe)
    'axe_knight': [
        "......####......",
        ".....#hhhh#.....",
        "....#hskksh#....",
        "...#hhmhhhh#....",
        "..#h#m#h#m##.hh.",
        "..#hhsmhhhsh#whh",
        "...#ssssss#.#wwh",
        "..#ssGssGss##msh",
        ".#ss#GssG#ss#x##",
        ".#f#ssssss#f#x..",
        "..#hssssssh#xx..",
        "..#hh#ss#hh#xx..",
        "...##ssss##.xx..",
        "...#kk##kk#.xx..",
        "..#hh#..#hh#xx..",
        "..####..####....",
    ],
    # 6. Goblin (Pointy green ears, glowing red eyes, loincloth, hand axe)
    'goblin': [
        "................",
        "..##........##..",
        ".#EE#..##..#EE#.",
        "#EEEE##ee##EEEE#",
        "#EEEEeeeeeeEEEE#",
        ".#eERRReeRRRe#..",
        "..#ee##ee##e#...",
        "...#eeeeee#.....",
        "....#eeee#...hh.",
        "...#oooooo#.#mh#",
        "..#e#oooo#e#xm##",
        "..#e#oooo#e#xx..",
        "...#ee##ee#.xx..",
        "...#ee##ee#.xx..",
        "..#ee#..#ee#xx..",
        "..####..####...."
    ],
    # 7. Skeleton (White skull, black hollow eyes, bone ribs, iron sword & shield)
    'skeleton': [
        ".....####.......",
        "....#wwww#......",
        "...#w#ww#w#.....",
        "...#k#ww#k#.....",
        "...#wwwwww#.....",
        "....#w#w#w#.....",
        ".....####.......",
        "..#h#wwww#h#....",
        ".#hh#w##w#hh#...",
        ".#hh#wwww#hh#h..",
        "..#h#w##w#h#wh#.",
        "...#wwwwww#.wh#.",
        "....#w##w#..wh#.",
        "....#w##w#..G##.",
        "...#ww##ww#..##.",
        "...###..###....."
    ],
    # 8. Grim Reaper (Tattered black cowl, red skull eye sockets, death scythe)
    'reaper': [
        "......####......",
        ".....#kkkk#.....",
        "....#kRRkk#.....",
        "...#kR##Rkk#....",
        "...#kkkkkkk#.hh.",
        "...#w#ww#w##hhhh",
        "....#w##w#..#sh#",
        "...#kkkkkk#..x..",
        "..#p#kkkk#p#.x..",
        ".#pp#kkkk#pp#x..",
        ".#pp#kkkk#pp#x..",
        "..#p#kkkk#p#.x..",
        "...#kk##kk#..x..",
        "...#kk##kk#..x..",
        "..#kk#..#kk#.x..",
        "..####..####.x.."
    ],
    # 9. Slime (Translucent green bouncy blob with highlight and eyes)
    'slime': [
        "................",
        "................",
        "......####......",
        "....##LLLE##....",
        "...#LLLEEEEE#...",
        "..#LLEEEEEEEE#..",
        ".#LEEE##EE##EE#.",
        "#LEEEE##EE##EEE#",
        "#LEEEEEEEEEEEEE#",
        "#LEEEEEEEEEEEEE#",
        "#EEEEEEEEEEEEEE#",
        "#EEEEEEEEEEEEEE#",
        ".#eeeeeeeeeeee#.",
        "..#eeeeeeeeee#..",
        "...##########...",
        "................"
    ],
    # 10. Orc Berserker (Heavy tusk jaw, horned helm, studded armor, spiked mace)
    'orc_berserker': [
        ".....######.....",
        "....#EEkkEE#....",
        "...#EEEEEEEE#...",
        "..#kkEEeeEEkk#..",
        "..#k#EEeeEE#k#..",
        "..#E#RReeRR#E#..",
        "...#EewwwweE#...",
        "...#EEwwwwEE#.hh",
        "..#ooEeeeeEoo#hh",
        ".#oo#oooooo#o#hh",
        ".#EE#oooooo#E#hh",
        "..#E#oooooo#E#xx",
        "...##oooooo##.xx",
        "...#kk####kk#.xx",
        "..#EE#....#EE#xx",
        "..####....####xx"
    ]
}

# Image parameters
SCALE = 6  # 6x scale for high clarity inspection
SPRITE_W = 16
SPRITE_H = 16
MARGIN_X = 24
MARGIN_Y = 32
COLS = 5
ROWS = 2

WIDTH = COLS * (SPRITE_W * SCALE + MARGIN_X) + MARGIN_X
HEIGHT = ROWS * (SPRITE_H * SCALE + MARGIN_Y + 20) + MARGIN_Y + 40

img = Image.new('RGBA', (WIDTH, HEIGHT), (47, 52, 68, 255))
draw = ImageDraw.Draw(img)

# Title banner
draw.text((WIDTH // 2, 20), "TINY RPG - AETHERIA PIXEL ART SPRITES (6X SCALE)", fill=(255, 255, 255), anchor="mm")

names = list(SPRITES.keys())
for idx, name in enumerate(names):
    col = idx % COLS
    row = idx // COLS
    
    x0 = MARGIN_X + col * (SPRITE_W * SCALE + MARGIN_X)
    y0 = 50 + row * (SPRITE_H * SCALE + MARGIN_Y + 20)
    
    # Shadow ellipse
    shadow_w = SPRITE_W * SCALE * 0.8
    shadow_h = 10
    sy = y0 + SPRITE_H * SCALE - 4
    draw.ellipse([x0 + (SPRITE_W * SCALE - shadow_w) / 2, sy, x0 + (SPRITE_W * SCALE + shadow_w) / 2, sy + shadow_h], fill=(20, 24, 34, 180))
    
    matrix = SPRITES[name]
    for r in range(SPRITE_H):
        for c in range(SPRITE_W):
            ch = matrix[r][c]
            col_val = PALETTE.get(ch)
            if col_val:
                px = x0 + c * SCALE
                py = y0 + r * SCALE
                draw.rectangle([px, py, px + SCALE - 1, py + SCALE - 1], fill=col_val)
                
    # Label
    draw.text((x0 + (SPRITE_W * SCALE) // 2, y0 + SPRITE_H * SCALE + 14), name.upper(), fill=(241, 245, 249), anchor="mm")

out_dir = r"C:\Users\임종서\.gemini\antigravity\brain\32103c8c-6d2e-4837-8129-2d6bb4159505"
out_path = os.path.join(out_dir, "pixel_sprites_preview.png")
img.save(out_path)
print(f"Saved sprite preview to: {out_path}")
