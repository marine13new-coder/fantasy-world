# -*- coding: utf-8 -*-
import http.server
import socketserver
import socket
import webbrowser
import os
import sys

PORT = 8000

def get_local_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"

class CustomHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # CORS & Cache-Control for real-time live updates
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def guess_type(self, path):
        if path.endswith(".glb"):
            return "model/gltf-binary"
        if path.endswith(".gltf"):
            return "model/gltf+json"
        return super().guess_type(path)

if __name__ == '__main__':
    root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    os.chdir(root_dir)

    ip = get_local_ip()
    local_url = f"http://localhost:{PORT}/site/souls-borne/index.html"
    lan_url = f"http://{ip}:{PORT}/site/souls-borne/index.html"
    portal_url = f"http://{ip}:{PORT}/site/index.html"

    print("=" * 68)
    print("   🩸 [BLOOD SOULS] 실시간 다른 컴퓨터 웹 플레이 서버 가동")
    print("=" * 68)
    print()
    print(f"  [1] 내 컴퓨터 로컬 접속 주소:")
    print(f"      👉 {local_url}")
    print()
    print(f"  [2] 다른 컴퓨터 / 노트북 / 스마트폰 접속 주소 (같은 Wi-Fi):")
    print(f"      👉 {lan_url}")
    print()
    print(f"  [3] 16종 통합 아케이드 허브 포털 주소:")
    print(f"      👉 {portal_url}")
    print()
    print("=" * 68)
    print("  ※ 다른 컴퓨터 브라우저(크롬, 엣지 등)에서 [2]번 주소를 입력하세요!")
    print("  ※ 실시간으로 코드를 수정하면 새로고침(F5) 시 즉시 반영됩니다.")
    print("  ※ 서버 종료: 이 창을 닫거나 Ctrl + C")
    print("=" * 68)

    # 로컬 브라우저 자동 오픈
    webbrowser.open(local_url)

    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), CustomHandler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n서버가 종료되었습니다.")
