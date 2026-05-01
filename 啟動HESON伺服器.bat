@echo off
chcp 65001 >nul
title HESON 赫頌 伺服器

echo ================================
echo   HESON 赫頌家事管理 後台啟動
echo ================================
echo.

cd /d "%~dp0"

echo [1/2] 啟動後台伺服器...
start "HESON-Backend" cmd /k "cd /d "%~dp0server" && node --no-warnings index.js"

echo [2/2] 等待伺服器啟動...
timeout /t 3 /nobreak >nul

echo.
echo 正在開啟瀏覽器...
start "" "http://localhost:4001"

echo.
echo ✅ 完成！
echo    本機網址：http://localhost:4001
echo    夥伴網址：http://100.99.26.30:4001  (Tailscale)
echo    公網網址：http://61.220.214.118:4001 (需設定 Port Forwarding)
echo.
echo 按任意鍵關閉此視窗（後台伺服器仍在執行）
pause >nul
