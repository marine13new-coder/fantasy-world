import urllib.request
import json
import os

apk_path = r'c:\Users\임종서\Desktop\auto gnimag\AbyssRoll-BloodCasino.apk'
boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW'
with open(apk_path, 'rb') as f:
    apk_data = f.read()

body = (
    f'--{boundary}\r\n'
    f'Content-Disposition: form-data; name="file"; filename="AbyssRoll-BloodCasino.apk"\r\n'
    f'Content-Type: application/vnd.android.package-archive\r\n\r\n'
).encode('utf-8') + apk_data + f'\r\n--{boundary}--\r\n'.encode('utf-8')

# Try tmpfiles.org
try:
    req = urllib.request.Request(
        'https://tmpfiles.org/api/v1/upload',
        data=body,
        headers={'Content-Type': f'multipart/form-data; boundary={boundary}'}
    )
    with urllib.request.urlopen(req, timeout=15) as res:
        resp = json.loads(res.read().decode())
        url = resp.get('data', {}).get('url')
        if url:
            # direct download link replaces tmpfiles.org/ with tmpfiles.org/dl/
            direct_url = url.replace('tmpfiles.org/', 'tmpfiles.org/dl/')
            print(f"TMPFILES_DIRECT_URL: {direct_url}")
            print(f"TMPFILES_PAGE_URL: {url}")
except Exception as e:
    print(f"tmpfiles failed: {e}")

# Try catbox / litterbox
try:
    litter_boundary = '----WebKitFormBoundaryX99281'
    litter_body = (
        f'--{litter_boundary}\r\n'
        f'Content-Disposition: form-data; name="reqtype"\r\n\r\n'
        f'fileupload\r\n'
        f'--{litter_boundary}\r\n'
        f'Content-Disposition: form-data; name="time"\r\n\r\n'
        f'72h\r\n'
        f'--{litter_boundary}\r\n'
        f'Content-Disposition: form-data; name="fileToUpload"; filename="AbyssRoll-BloodCasino.apk"\r\n'
        f'Content-Type: application/vnd.android.package-archive\r\n\r\n'
    ).encode('utf-8') + apk_data + f'\r\n--{litter_boundary}--\r\n'.encode('utf-8')

    req_lit = urllib.request.Request(
        'https://litterbox.catbox.moe/resources/internals/api.php',
        data=litter_body,
        headers={
            'Content-Type': f'multipart/form-data; boundary={litter_boundary}',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
        }
    )
    with urllib.request.urlopen(req_lit, timeout=20) as r:
        link = r.read().decode().strip()
        print(f"LITTERBOX_DOWNLOAD_URL: {link}")
except Exception as e:
    print(f"litterbox failed: {e}")

