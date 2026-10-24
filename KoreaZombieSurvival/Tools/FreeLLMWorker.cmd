@echo off
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0FreeLLMWorker.ps1" %*
pause
