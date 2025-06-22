@echo off
REM ScanCard Complete App Backup Script for Windows
REM This script creates a comprehensive backup of your entire application

setlocal enabledelayedexpansion

REM Configuration
set BACKUP_DIR=.\app_backups
set TIMESTAMP=%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set TIMESTAMP=%TIMESTAMP: =0%
set BACKUP_NAME=scancard_app_backup_%TIMESTAMP%

echo ========================================
echo ScanCard Complete App Backup
echo ========================================
echo Backup will be saved to: %BACKUP_DIR%\%BACKUP_NAME%
echo.

REM Create backup directory if it doesn't exist
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

REM Create backup directory for this specific backup
set BACKUP_PATH=%BACKUP_DIR%\%BACKUP_NAME%
if not exist "%BACKUP_PATH%" mkdir "%BACKUP_PATH%"

echo Step 1: Creating backup manifest...
(
echo ScanCard Complete App Backup
echo =============================
echo Generated: %date% %time%
echo Backup ID: %BACKUP_NAME%
echo.
echo This backup contains the complete application state including:
echo - All source code files
echo - Configuration files
echo - Database schema and migrations
echo - Dependencies and package files
echo - Documentation
echo - Assets and resources
echo.
echo To restore this backup:
echo 1. Extract the backup archive
echo 2. Run: npm install ^(to restore dependencies^)
echo 3. Run database setup scripts if needed
echo 4. Configure environment variables
echo.
echo Backup completed successfully!
) > "%BACKUP_PATH%\backup_manifest.txt"

echo Step 2: Copying source code files...
REM Copy all important source files and directories
xcopy /E /I /Y "app" "%BACKUP_PATH%\app\"
xcopy /E /I /Y "components" "%BACKUP_PATH%\components\"
xcopy /E /I /Y "constants" "%BACKUP_PATH%\constants\"
xcopy /E /I /Y "contexts" "%BACKUP_PATH%\contexts\"
xcopy /E /I /Y "data" "%BACKUP_PATH%\data\"
xcopy /E /I /Y "database" "%BACKUP_PATH%\database\"
xcopy /E /I /Y "hooks" "%BACKUP_PATH%\hooks\"
xcopy /E /I /Y "lib" "%BACKUP_PATH%\lib\"
xcopy /E /I /Y "screens" "%BACKUP_PATH%\screens\"
xcopy /E /I /Y "store" "%BACKUP_PATH%\store\"
xcopy /E /I /Y "types" "%BACKUP_PATH%\types\"
xcopy /E /I /Y "utils" "%BACKUP_PATH%\utils\"
xcopy /E /I /Y "assets" "%BACKUP_PATH%\assets\"

echo Step 3: Copying configuration files...
REM Copy configuration and setup files
copy "*.json" "%BACKUP_PATH%\"
copy "*.js" "%BACKUP_PATH%\"
copy "*.ts" "%BACKUP_PATH%\"
copy "*.tsx" "%BACKUP_PATH%\"
copy "*.md" "%BACKUP_PATH%\"
copy "*.html" "%BACKUP_PATH%\"

echo Step 4: Copying Android files...
REM Copy Android configuration
xcopy /E /I /Y "android" "%BACKUP_PATH%\android\"

echo Step 5: Creating file inventory...
REM Create a detailed file inventory
echo Creating file inventory...
dir /s /b "%BACKUP_PATH%" > "%BACKUP_PATH%\file_inventory.txt"

echo Step 6: Creating compressed archive...
REM Create a compressed archive using PowerShell
powershell -command "Compress-Archive -Path '%BACKUP_PATH%' -DestinationPath '%BACKUP_DIR%\%BACKUP_NAME%.zip' -Force"

REM Remove uncompressed directory
rmdir /s /q "%BACKUP_PATH%"

echo.
echo ========================================
echo Backup completed successfully!
echo ========================================
echo Backup file: %BACKUP_DIR%\%BACKUP_NAME%.zip
echo.

REM Get file size
for %%A in ("%BACKUP_DIR%\%BACKUP_NAME%.zip") do set SIZE=%%~zA
set /a SIZE_MB=%SIZE%/1024/1024
echo Backup size: %SIZE_MB% MB

echo.
echo Backup includes:
echo - All source code ^(app, components, etc.^)
echo - Configuration files ^(package.json, tsconfig.json, etc.^)
echo - Database files ^(setup.sql, migrations^)
echo - Documentation ^(README, setup guides^)
echo - Android configuration
echo - Assets and resources
echo.

echo To restore this backup:
echo 1. Extract %BACKUP_NAME%.zip to a new directory
echo 2. Run 'npm install' to restore dependencies
echo 3. Configure your environment variables
echo 4. Run database setup if needed
echo.

pause 