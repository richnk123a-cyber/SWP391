@echo off
chcp 65001 >nul
title [CareerFit] Khoi Dong He Thong Tu Dong

set "ROOT_DIR=%~dp0"
if "%ROOT_DIR:~-1%"=="\" set "ROOT_DIR=%ROOT_DIR:~0,-1%"

echo ===============================================================================
echo                HE THONG CAREERFIT - FULL-STACK AUTO LAUNCHER
echo ===============================================================================
echo.

echo [1/4] Kiem tra ket noi va khoi tao co so du lieu SQL Server...

:: Tim duong dan sqlcmd neu chua co trong PATH
where sqlcmd >nul 2>&1
if errorlevel 1 (
    if exist "C:\Program Files\Microsoft SQL Server\Client SDK\ODBC\170\Tools\Binn\sqlcmd.exe" set "PATH=C:\Program Files\Microsoft SQL Server\Client SDK\ODBC\170\Tools\Binn;%PATH%"
    if exist "C:\Program Files\Microsoft SQL Server\Client SDK\ODBC\180\Tools\Binn\sqlcmd.exe" set "PATH=C:\Program Files\Microsoft SQL Server\Client SDK\ODBC\180\Tools\Binn;%PATH%"
    if exist "C:\Program Files\Microsoft SQL Server\160\Tools\Binn\sqlcmd.exe" set "PATH=C:\Program Files\Microsoft SQL Server\160\Tools\Binn;%PATH%"
    if exist "C:\Program Files\Microsoft SQL Server\150\Tools\Binn\sqlcmd.exe" set "PATH=C:\Program Files\Microsoft SQL Server\150\Tools\Binn;%PATH%"
    if exist "C:\Program Files\Microsoft SQL Server\140\Tools\Binn\sqlcmd.exe" set "PATH=C:\Program Files\Microsoft SQL Server\140\Tools\Binn;%PATH%"
    if exist "C:\Program Files\Microsoft SQL Server\130\Tools\Binn\sqlcmd.exe" set "PATH=C:\Program Files\Microsoft SQL Server\130\Tools\Binn;%PATH%"
)

:: Xac dinh instance SQL Server (mac dinh localhost hoac .\SQLEXPRESS)
set "SQL_SERVER_INSTANCE=localhost"
sqlcmd -E -S localhost -Q "SELECT 1" >nul 2>&1
if errorlevel 1 (
    sqlcmd -E -S .\SQLEXPRESS -Q "SELECT 1" >nul 2>&1
    if not errorlevel 1 (
        set "SQL_SERVER_INSTANCE=.\SQLEXPRESS"
    ) else (
        sqlcmd -E -S localhost\SQLEXPRESS -Q "SELECT 1" >nul 2>&1
        if not errorlevel 1 (
            set "SQL_SERVER_INSTANCE=localhost\SQLEXPRESS"
        )
    )
)

:: 1. Dam bao Database careerfit_db da ton tai
sqlcmd -E -S %SQL_SERVER_INSTANCE% -Q "IF db_id('careerfit_db') IS NULL CREATE DATABASE careerfit_db;" >nul 2>&1

:: 2. Kiem tra xem da co bang du lieu (vi du dbo.users) trong careerfit_db chua
sqlcmd -b -E -S %SQL_SERVER_INSTANCE% -d careerfit_db -Q "IF OBJECT_ID('dbo.users', 'U') IS NULL THROW 50000, 'NO_TABLES', 1;" >nul 2>&1
if errorlevel 1 (
    echo  ^=^> Phat hien Database trong [chua co cac bang table].
    echo  ^=^> Dang tu dong tao bang va nap du lieu goc tu database\careerfit_db.sql tren %SQL_SERVER_INSTANCE%...
    sqlcmd -f 65001 -E -S %SQL_SERVER_INSTANCE% -i "%ROOT_DIR%\database\careerfit_db.sql" >nul 2>&1
    if errorlevel 1 (
        echo  ^=^> [CANH BAO] Khong the chay tu dong qua sqlcmd tren may nay.
        echo  ^=^> Backend Spring Boot se tu dong khoi tao bang qua Hibernate khi bat len!
        echo  ^=^> [Luu y: Ban cung co the mo SSMS va chay file database\careerfit_db.sql].
    ) else (
        echo  ^=^> Khoi tao thanh cong toan bo 13 bang table va du lieu mau cho CareerFit!
    )
) else (
    echo  ^=^> SQL Server [%SQL_SERVER_INSTANCE%] va Database careerfit_db da san sang [day du 13 bang table].
)

:: Set Java SDK
if "%JAVA_HOME%"=="" (
    if exist "C:\Program Files\Java\jdk-22" set "JAVA_HOME=C:\Program Files\Java\jdk-22"
    if exist "C:\Program Files\Java\jdk-21" set "JAVA_HOME=C:\Program Files\Java\jdk-21"
    if exist "C:\Program Files\Java\jdk-17" set "JAVA_HOME=C:\Program Files\Java\jdk-17"
)
if not "%JAVA_HOME%"=="" (
    set "PATH=%JAVA_HOME%\bin;%PATH%"
)
:: Don dep tien trinh cu dang chay ngam tren cong 8080 va 5173
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8080 ^| findstr LISTENING') do taskkill /f /pid %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173 ^| findstr LISTENING') do taskkill /f /pid %%a >nul 2>&1

echo.
echo [2/4] Khoi dong Backend Spring Boot (Port 8080)...
start "CareerFit Backend (Port 8080)" cmd /k "cd /d "%ROOT_DIR%\backend" && title CareerFit Backend [Port 8080] && mvnw.cmd spring-boot:run"

echo.
echo [3/4] Khoi dong Frontend React Web (Port 5173)...
if not exist "%ROOT_DIR%\frontend\node_modules" (
    echo  ^=^> Phat hien chua cai thu vien Frontend [chua co node_modules].
    echo  ^=^> Dang tu dong chay npm install...
    cd /d "%ROOT_DIR%\frontend" && call npm install && cd /d "%ROOT_DIR%"
)
start "CareerFit Frontend (Port 5173)" cmd /k "cd /d "%ROOT_DIR%\frontend" && title CareerFit Frontend [Port 5173] && npm run dev"

echo.
echo [4/4] Dang cho Backend Spring Boot (Port 8080) khoi dong hoan tat...
set /a _wait_count=0
:WAIT_BACKEND_READY
set /a _wait_count+=1
netstat -ano | findstr :8080 | findstr LISTENING >nul 2>&1
if errorlevel 1 (
    if %_wait_count% lss 35 (
        ping -n 2 127.0.0.1 >nul
        <nul set /p=". "
        goto WAIT_BACKEND_READY
    )
)
echo.
echo  ^=^> He thong da san sang tai http://localhost:8080 va http://localhost:5173!

start http://localhost:5173

echo.
echo ===============================================================================
echo   KHOI DONG THANH CONG!
echo   - Web Frontend : http://localhost:5173
echo   - REST API      : http://localhost:8080
echo   - Swagger UI    : http://localhost:8080/swagger-ui.html
echo ===============================================================================
echo.
pause