@echo off
title Slime LIVE - Baslatiliyor
cd /d "%~dp0"
echo Slime LIVE sahnesi baslatiliyor...
start "" powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0start-slime.ps1"
timeout /t 2 /nobreak >nul
start "" "http://127.0.0.1:8765/?obs=1"
echo.
echo Bu pencereyi kapatmayin. Slime yayini acik kaldigi surece gerekli.
echo Durdurmak icin bu pencereyi kapatin.
pause
