@echo off
chcp 65001 > nul
title VULPI 2.0 - GitHub Sync

echo ==========================================
echo      VULPI 2.0 - GITHUB AKTUALIZACE
echo ==========================================
echo.

echo 1. Stahuji aktualizace ze serveru (git pull)...
git pull
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [CHYBA] Nepodarilo se stahnout zmeny. Zkontrolujte konflikty.
    echo Skript bude ukoncen.
    pause
    exit /b
)

echo.
echo 2. Pridavam zmenene soubory (git add)...
git add .

echo.
echo 3. Kontrola zmen ke commitu:
git status --short

echo.
set "commit_msg="
set /p commit_msg="Zadejte popis zmen (commit message) [stisknete ENTER pro automaticky datum]: "

if not defined commit_msg set commit_msg=Update %date% %time%

echo.
echo 4. Ukladam zmeny (git commit)...
git commit -m "%commit_msg%"

echo.
echo 5. Odesilam na GitHub (git push)...
git push
if %ERRORLEVEL% EQU 0 (
    echo.
    echo ==========================================
    echo    USPESNE DOKONCENO
    echo    Vase zmeny jsou nyni na GitHubu.
    echo ==========================================
) else (
    echo.
    echo ==========================================
    echo    [CHYBA] Odeslani selhalo.
    echo ==========================================
)

echo.
pause