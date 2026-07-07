@echo off
cd /d "%~dp0"
echo Creating folders in %CD%
mkdir src 2>nul
mkdir src\styles 2>nul
mkdir src\config 2>nul
mkdir src\core 2>nul
mkdir src\world 2>nul
mkdir src\entities 2>nul
mkdir src\systems 2>nul
mkdir src\rendering 2>nul
mkdir src\input 2>nul
mkdir src\ui 2>nul
mkdir src\utils 2>nul
mkdir public 2>nul
echo Done.
dir src
pause
