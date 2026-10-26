@echo off
chcp 65001 > nul
cls
python "%~dp0Tools\start_lan_server.py"
pause
