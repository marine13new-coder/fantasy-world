import os
import shutil
import subprocess
from PIL import Image, ImageDraw, ImageFont

WORKSPACE = r"c:\Users\임종서\Desktop\auto gnimag"
BUILD_DIR = os.path.join(WORKSPACE, "apk_build")
JAVA_HOME = r"C:\Program Files\Microsoft\jdk-21.0.12.101-hotspot"
JAVAC = os.path.join(JAVA_HOME, "bin", "javac.exe")
KEYTOOL = os.path.join(JAVA_HOME, "bin", "keytool.exe")

SDK_DIR = r"C:\Program Files\Unity\Hub\Editor\6000.6.7f1\Editor\Data\PlaybackEngines\AndroidPlayer\SDK"
BUILD_TOOLS = os.path.join(SDK_DIR, "build-tools", "36.0.0")
AAPT2 = os.path.join(BUILD_TOOLS, "aapt2.exe")
D8 = os.path.join(BUILD_TOOLS, "d8.bat")
ZIPALIGN = os.path.join(BUILD_TOOLS, "zipalign.exe")
APKSIGNER = os.path.join(BUILD_TOOLS, "apksigner.bat")
ANDROID_JAR = os.path.join(SDK_DIR, "platforms", "android-34", "android.jar")

OUTPUT_APK = os.path.join(WORKSPACE, "AbyssRoll-BloodCasino.apk")

def setup_dirs():
    if os.path.exists(BUILD_DIR):
        shutil.rmtree(BUILD_DIR)
    os.makedirs(os.path.join(BUILD_DIR, "src", "com", "abyssroll", "bloodcasino"), exist_ok=True)
    os.makedirs(os.path.join(BUILD_DIR, "res", "values"), exist_ok=True)
    os.makedirs(os.path.join(BUILD_DIR, "res", "mipmap-hdpi"), exist_ok=True)
    os.makedirs(os.path.join(BUILD_DIR, "res", "mipmap-xxhdpi"), exist_ok=True)
    os.makedirs(os.path.join(BUILD_DIR, "assets"), exist_ok=True)
    os.makedirs(os.path.join(BUILD_DIR, "obj"), exist_ok=True)
    os.makedirs(os.path.join(BUILD_DIR, "gen"), exist_ok=True)
    os.makedirs(os.path.join(BUILD_DIR, "classes"), exist_ok=True)

def generate_icon():
    for size, folder in [(72, "mipmap-hdpi"), (144, "mipmap-xxhdpi")]:
        img = Image.new('RGBA', (size, size), (9, 10, 15, 255))
        draw = ImageDraw.Draw(img)
        # Border
        draw.rectangle([2, 2, size-3, size-3], outline=(197, 160, 89, 255), width=3)
        # Inner circle
        draw.ellipse([size*0.15, size*0.15, size*0.85, size*0.85], fill=(139, 0, 0, 255), outline=(255, 215, 0, 255), width=2)
        out_path = os.path.join(BUILD_DIR, "res", folder, "ic_launcher.png")
        img.save(out_path)

def generate_manifest():
    manifest_content = """<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.abyssroll.bloodcasino"
    android:versionCode="1"
    android:versionName="1.0.0">

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.VIBRATE" />
    <uses-permission android:name="android.permission.WAKE_LOCK" />

    <application
        android:label="@string/app_name"
        android:icon="@mipmap/ic_launcher"
        android:hardwareAccelerated="true"
        android:theme="@android:style/Theme.NoTitleBar.Fullscreen">
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:screenOrientation="portrait"
            android:configChanges="orientation|screenSize|keyboardHidden">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
"""
    with open(os.path.join(BUILD_DIR, "AndroidManifest.xml"), "w", encoding="utf-8") as f:
        f.write(manifest_content)

def generate_resources():
    strings_content = """<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">어비스 롤: 피의 카지노</string>
</resources>
"""
    with open(os.path.join(BUILD_DIR, "res", "values", "strings.xml"), "w", encoding="utf-8") as f:
        f.write(strings_content)

def copy_assets():
    src_html = os.path.join(WORKSPACE, "abyss_roll.html")
    dst_html = os.path.join(BUILD_DIR, "assets", "index.html")
    shutil.copyfile(src_html, dst_html)

def generate_java():
    java_content = """package com.abyssroll.bloodcasino;

import android.app.Activity;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

public class MainActivity extends Activity {
    private WebView webView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        requestWindowFeature(Window.FEATURE_NO_TITLE);
        getWindow().setFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN, WindowManager.LayoutParams.FLAG_FULLSCREEN);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

        // Sticky Immersive Fullscreen Mode
        getWindow().getDecorView().setSystemUiVisibility(
            View.SYSTEM_UI_FLAG_LAYOUT_STABLE
            | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
            | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
            | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
            | View.SYSTEM_UI_FLAG_FULLSCREEN
            | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
        );

        webView = new WebView(this);
        setContentView(webView);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setLoadWithOverviewMode(true);
        settings.setUseWideViewPort(true);

        webView.setWebChromeClient(new WebChromeClient());
        webView.setWebViewClient(new WebViewClient());

        webView.loadUrl("file:///android_asset/index.html");
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}
"""
    with open(os.path.join(BUILD_DIR, "src", "com", "abyssroll", "bloodcasino", "MainActivity.java"), "w", encoding="utf-8") as f:
        f.write(java_content)

def build_apk():
    setup_dirs()
    generate_icon()
    generate_manifest()
    generate_resources()
    copy_assets()
    generate_java()

    print("[1/7] Compiling resources with aapt2...")
    res_zip = os.path.join(BUILD_DIR, "obj", "res.zip")
    cmd_compile = [
        AAPT2, "compile",
        "--dir", os.path.join(BUILD_DIR, "res"),
        "-o", res_zip
    ]
    subprocess.run(cmd_compile, check=True)

    print("[2/7] Linking resources with aapt2...")
    unaligned_apk = os.path.join(BUILD_DIR, "unaligned.apk")
    cmd_link = [
        AAPT2, "link",
        "-I", ANDROID_JAR,
        "--manifest", os.path.join(BUILD_DIR, "AndroidManifest.xml"),
        "--java", os.path.join(BUILD_DIR, "gen"),
        "-A", os.path.join(BUILD_DIR, "assets"),
        "-o", unaligned_apk,
        res_zip
    ]
    subprocess.run(cmd_link, check=True)

    print("[3/7] Compiling Java code with javac...")
    r_java = os.path.join(BUILD_DIR, "gen", "com", "abyssroll", "bloodcasino", "R.java")
    main_java = os.path.join(BUILD_DIR, "src", "com", "abyssroll", "bloodcasino", "MainActivity.java")
    cmd_javac = [
        JAVAC,
        "-source", "1.8",
        "-target", "1.8",
        "-bootclasspath", ANDROID_JAR,
        "-d", os.path.join(BUILD_DIR, "classes"),
        r_java, main_java
    ]
    subprocess.run(cmd_javac, check=True)

    print("[4/7] Generating classes.dex with d8...")
    class_files = []
    for root, _, files in os.walk(os.path.join(BUILD_DIR, "classes")):
        for file in files:
            if file.endswith(".class"):
                class_files.append(os.path.join(root, file))

    cmd_d8 = [D8, "--output", BUILD_DIR] + class_files
    subprocess.run(cmd_d8, shell=True, check=True)

    print("[5/7] Adding classes.dex to APK...")
    # Add classes.dex into unaligned_apk using aapt or zip
    # We can use jar/zip or aapt add
    import zipfile
    with zipfile.ZipFile(unaligned_apk, 'a') as zf:
        zf.write(os.path.join(BUILD_DIR, "classes.dex"), "classes.dex")

    print("[6/7] Zipaligning APK...")
    aligned_apk = os.path.join(BUILD_DIR, "aligned.apk")
    if os.path.exists(aligned_apk):
        os.remove(aligned_apk)
    cmd_zipalign = [ZIPALIGN, "-p", "-f", "4", unaligned_apk, aligned_apk]
    subprocess.run(cmd_zipalign, check=True)

    print("[7/7] Signing APK with apksigner...")
    keystore = os.path.join(BUILD_DIR, "debug.keystore")
    if not os.path.exists(keystore):
        cmd_key = [
            KEYTOOL, "-genkeypair",
            "-keystore", keystore,
            "-storepass", "android",
            "-alias", "androiddebugkey",
            "-keypass", "android",
            "-keyalg", "RSA",
            "-keysize", "2048",
            "-validity", "10000",
            "-dname", "CN=Android Debug,O=Android,C=US"
        ]
        subprocess.run(cmd_key, check=True)

    if os.path.exists(OUTPUT_APK):
        os.remove(OUTPUT_APK)

    cmd_sign = [
        APKSIGNER, "sign",
        "--ks", keystore,
        "--ks-pass", "pass:android",
        "--ks-key-alias", "androiddebugkey",
        "--key-pass", "pass:android",
        "--out", OUTPUT_APK,
        aligned_apk
    ]
    subprocess.run(cmd_sign, shell=True, check=True)

    print(f"SUCCESS! APK built and signed at: {OUTPUT_APK} (Size: {os.path.getsize(OUTPUT_APK):,} bytes)")

if __name__ == "__main__":
    build_apk()
