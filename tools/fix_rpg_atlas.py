with open('SeamlessPixelRPG/build_commercial_launch.js', 'r', encoding='utf-8') as f:
    text = f.read()

target = 'atlasImage.src = "data:image/png;base64," + atlasB64;'
replacement = 'atlasImage.src = "data:image/png;base64,${atlasB64}";'

if target in text:
    text = text.replace(target, replacement)
    with open('SeamlessPixelRPG/build_commercial_launch.js', 'w', encoding='utf-8') as f:
        f.write(text)
    print("Fixed build_commercial_launch.js successfully!")
else:
    print("Target not found!")
