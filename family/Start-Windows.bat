@echo off
cd /d "%~dp0"
where py >nul 2>nul
if %errorlevel%==0 (
  start "" "http://localhost:8000/#voice"
  py -3 -m http.server 8000 --bind 127.0.0.1
) else (
  start "" "http://localhost:8000/#voice"
  python -m http.server 8000 --bind 127.0.0.1
)
pause
