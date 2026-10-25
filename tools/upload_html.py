import urllib.request

html_path = r'c:\Users\임종서\Desktop\auto gnimag\abyss_roll.html'
with open(html_path, 'rb') as f:
    html_data = f.read()

litter_boundary = '----WebKitFormBoundaryX99281'
parts = [
    f'--{litter_boundary}\r\nContent-Disposition: form-data; name="reqtype"\r\n\r\nfileupload\r\n',
    f'--{litter_boundary}\r\nContent-Disposition: form-data; name="time"\r\n\r\n72h\r\n',
    f'--{litter_boundary}\r\nContent-Disposition: form-data; name="fileToUpload"; filename="abyss_roll.html"\r\nContent-Type: text/html\r\n\r\n',
]
litter_body = parts[0].encode('utf-8') + parts[1].encode('utf-8') + parts[2].encode('utf-8') + html_data + f'\r\n--{litter_boundary}--\r\n'.encode('utf-8')

req = urllib.request.Request(
    'https://litterbox.catbox.moe/resources/internals/api.php',
    data=litter_body,
    headers={
        'Content-Type': f'multipart/form-data; boundary={litter_boundary}',
        'User-Agent': 'Mozilla/5.0'
    }
)

with urllib.request.urlopen(req, timeout=15) as r:
    link = r.read().decode().strip()
    print('HTML_DIRECT_WEB_LINK:', link)
