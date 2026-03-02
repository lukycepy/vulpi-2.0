@echo off
chcp 65001 > nul
echo ==========================================
echo      VULPI 2.0 - GITHUB AKTUALIZACE
echo ==========================================
echo.

echo 1. Pridavam zmenene soubory (git add)...
git add .

echo.
set /p commit_msg="Zadejte popis zmen (commit message) [stisknete ENTER pro 'Update']: "
if "%commit_msg%"=="" set commit_msg=Update %date%

echo.
echo 2. Ukladam zmeny (git commit)...
git commit -m "%commit_msg%"

echo.
echo 3. Odesilam na GitHub (git push)...
git push origin main

echo.
echo ==========================================
if %ERRORLEVEL% EQU 0 (
    echo    USPESNE DOKONCENO
) else (
    echo    DOSLO K CHYBE
)
echo ==========================================
echo.
pause
