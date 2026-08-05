```bat
@echo off
cd /d "%~dp0"

echo Meowseum server starting...
echo Local:     http://127.0.0.1:8094/
echo Tailscale: http://YOUR-TAILSCALE-IP:8094/
echo.
echo Press Ctrl+C to stop.
echo.

python -m http.server 8094 --bind 0.0.0.0
pause
```
