import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders
import os

sender = 'noreply@abyssroll.com'
recipient = 'marine13new@naver.com'

msg = MIMEMultipart()
msg['From'] = 'Abyss Roll <noreply@abyssroll.com>'
msg['To'] = recipient
msg['Subject'] = '[어비스 롤: 피의 카지노] 안드로이드 테스트 APK 빌드 파일 전달'

body = """안녕하세요!

요청하신 [어비스 롤: 피의 카지노 (Abyss Roll: Blood Casino)] 모바일 테스트용 APK 빌드가 성공적으로 완료되어 전달드립니다.

- 첨부 파일: AbyssRoll-BloodCasino.apk
- 패키지명: com.abyssroll.bloodcasino
- 버전: 1.0.0
- 주요 기능:
  1. 발라트로식 8대 포커 족보 감지 (야추, 포카드, 풀하우스, 스트레이트, 트리플 등)
  2. 5대 조커 렐릭 (블러드 칩스, 황금 배율, 불사조 보험, 네거티브 슬롯 확장)
  3. 묻고 더블로! (X2~X16) 푸시 유어 럭 배율 폭발 & 자멸(BUST) 긴장감
  4. 3대 부스터 팩 (광대 조커 팩, 천체 행성 팩, 점술 타로 팩)
  5. ANTE 1~8 보스 블라인드 저주 기믹 & 무한 심연 모드 (Endless Mode)
  6. 모바일 햅틱 진동, Web Audio 다크 판타지 신디사이저, 타격 컷인 역경직 연출

안드로이드 폰에서 첨부파일을 다운로드하신 후 [알 수 없는 출처의 앱 설치 허용]을 통해 즉시 설치하여 플레이 테스트하실 수 있습니다.

감사합니다!
"""
msg.attach(MIMEText(body, 'plain', 'utf-8'))

apk_path = r'c:\Users\임종서\Desktop\auto gnimag\AbyssRoll-BloodCasino.apk'
with open(apk_path, 'rb') as f:
    part = MIMEBase('application', 'vnd.android.package-archive')
    part.set_payload(f.read())
    encoders.encode_base64(part)
    part.add_header('Content-Disposition', f'attachment; filename="{os.path.basename(apk_path)}"')
    msg.attach(part)

for mx_host in ['mx1.naver.com', 'mx2.naver.com', 'mx3.naver.com']:
    try:
        print(f"Connecting to {mx_host}:25...")
        server = smtplib.SMTP(mx_host, 25, timeout=15)
        server.set_debuglevel(1)
        server.ehlo('abyssroll.com')
        res = server.sendmail(sender, [recipient], msg.as_string())
        server.quit()
        print(f"SUCCESS: Email sent to {recipient} via {mx_host}! Result: {res}")
        break
    except Exception as e:
        print(f"Attempt on {mx_host} failed: {e}")
