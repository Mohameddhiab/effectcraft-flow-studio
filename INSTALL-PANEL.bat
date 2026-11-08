@echo off
setlocal EnableExtensions
cd /d "%~dp0"
echo === Installing the Flow Studio panel only (EffectCraft is not built or modified) ===
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0flow-install\install.ps1"
if errorlevel 1 goto :fail
echo.
pause
exit /b 0
:fail
echo.
echo The panel could not be installed. Read the message above.
pause
exit /b 1
