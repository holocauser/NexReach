@echo off
REM ScanCard Clean App Backup Script for Windows
REM This script creates a comprehensive backup excluding unnecessary files

setlocal enabledelayedexpansion

REM Configuration
set BACKUP_DIR=.\app_backups
set TIMESTAMP=%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set TIMESTAMP=%TIMESTAMP: =0%
set BACKUP_NAME=scancard_app_clean_backup_%TIMESTAMP%

echo ========================================
echo ScanCard Clean App Backup
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
echo ScanCard Clean App Backup
echo ==========================
echo Generated: %date% %time%
echo Backup ID: %BACKUP_NAME%
echo.
echo This backup contains the complete application source code excluding:
echo - node_modules ^(dependencies^)
echo - build artifacts
echo - temporary files
echo - log files
echo - IDE-specific files
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
REM Copy Android configuration (excluding build files)
if exist "android" (
    mkdir "%BACKUP_PATH%\android"
    xcopy /E /I /Y "android\app" "%BACKUP_PATH%\android\app\"
    xcopy /E /I /Y "android\gradle" "%BACKUP_PATH%\android\gradle\"
    copy "android\*.gradle" "%BACKUP_PATH%\android\"
    copy "android\*.properties" "%BACKUP_PATH%\android\"
    copy "android\gradlew*" "%BACKUP_PATH%\android\"
    copy "android\settings.gradle" "%BACKUP_PATH%\android\"
)

echo Step 5: Creating .gitignore for backup...
REM Create a .gitignore file for the backup
(
echo # Backup-specific gitignore
echo # This backup excludes the following:
echo node_modules/
echo .expo/
echo dist/
echo build/
echo .next/
echo .nuxt/
echo .output/
echo .cache/
echo .parcel-cache/
echo .eslintcache
echo *.log
echo .DS_Store
echo Thumbs.db
echo .env.local
echo .env.development.local
echo .env.test.local
echo .env.production.local
echo npm-debug.log*
echo yarn-debug.log*
echo yarn-error.log*
echo .pnpm-debug.log*
echo .vscode/
echo .idea/
echo *.swp
echo *.swo
echo *~
) > "%BACKUP_PATH%\.gitignore"

echo Step 6: Creating file inventory...
REM Create a detailed file inventory
echo Creating file inventory...
dir /s /b "%BACKUP_PATH%" > "%BACKUP_PATH%\file_inventory.txt"

echo Step 7: Creating compressed archive...
REM Create a compressed archive using PowerShell
powershell -command "Compress-Archive -Path '%BACKUP_PATH%' -DestinationPath '%BACKUP_DIR%\%BACKUP_NAME%.zip' -Force"

REM Remove uncompressed directory
rmdir /s /q "%BACKUP_PATH%"

echo.
echo ========================================
echo Clean backup completed successfully!
echo ========================================
echo Backup file: %BACKUP_DIR%\%BACKUP_NAME%.zip
echo.

REM Get file size
for %%A in ("%BACKUP_DIR%\%BACKUP_NAME%.zip") do set SIZE=%%~zA
set /a SIZE_MB=%SIZE%/1024/1024
echo Backup size: %SIZE_MB% MB

echo.
echo Clean backup includes:
echo - All source code ^(app, components, etc.^)
echo - Configuration files ^(package.json, tsconfig.json, etc.^)
echo - Database files ^(setup.sql, migrations^)
echo - Documentation ^(README, setup guides^)
echo - Android configuration ^(excluding build files^)
echo - Assets and resources
echo.
echo Excluded from backup:
echo - node_modules ^(will be restored with npm install^)
echo - Build artifacts and cache files
echo - Temporary and log files
echo - IDE-specific files
echo.

echo To restore this backup:
echo 1. Extract %BACKUP_NAME%.zip to a new directory
echo 2. Run 'npm install' to restore dependencies
echo 3. Configure your environment variables
echo 4. Run database setup if needed
echo.

pause 