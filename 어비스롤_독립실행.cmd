@echo off
cd /d "%~dp0\AbyssRoll"
echo ====================================================================
echo  [Abyss Roll: Eldritch Casino & Dice Roguelike] Standalone Launcher
echo ====================================================================
echo Opening Unity 6 with independent AbyssRoll Project...
start "" "C:\Program Files\Unity\Hub\Editor\6000.6.7f1\Editor\Unity.exe" -projectPath "%cd%"
