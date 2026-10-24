@echo off
cd /d "%~dp0\KoreaZombieSurvival"
echo ========================================================
echo  [Abyss Roll: Darkest Vertical Roguelike] Unity Launcher
echo ========================================================
echo Launching Unity 6 with Abyss Roll Main Scene...
start "" "C:\Program Files\Unity\Hub\Editor\6000.6.7f1\Editor\Unity.exe" -projectPath "%cd%"
