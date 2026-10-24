@echo off
cd /d "%~dp0"
if exist "Builds\Windows\SeoulLastSignal.exe" (
  start "" "Builds\Windows\SeoulLastSignal.exe"
) else (
  powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0Tools\Unity.ps1" -Mode Open
)
