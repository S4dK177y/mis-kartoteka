@echo off
chcp 65001 > nul
echo ==================================================
echo   Медицинская Информационная Система (МИС)
echo ==================================================
echo.

set ROOT_DIR=%~dp0
cd /d "%ROOT_DIR%"

echo [1/3] Проверка Frontend (Клиентская часть)...
cd frontend
if not exist node_modules (
    echo Установка зависимостей Frontend...
    call npm install
)
echo Сборка Frontend...
call npm run build
cd ..

echo.
echo [2/3] Проверка Backend (Серверная часть)...
cd backend
if not exist node_modules (
    echo Установка зависимостей Backend...
    call npm install
)

echo Обновление базы данных (если требуется)...
call npx prisma db push

echo.
echo [3/3] Запуск Сервера...
echo Сервер будет доступен по адресу: http://localhost:8080
echo Открываю браузер...
start http://localhost:8080
echo Нажмите Ctrl+C в этом окне для остановки сервера.
echo.

node index.js
pause
