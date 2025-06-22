@echo off
REM ScanCard Database Backup Script for Windows
REM This script creates a comprehensive backup of your database

setlocal enabledelayedexpansion

REM Configuration
set BACKUP_DIR=.\backups
set TIMESTAMP=%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set TIMESTAMP=%TIMESTAMP: =0%
set BACKUP_NAME=scancard_backup_%TIMESTAMP%

echo Starting ScanCard Database Backup...
echo Backup will be saved to: %BACKUP_DIR%\%BACKUP_NAME%

REM Create backup directory if it doesn't exist
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

REM Create backup directory for this specific backup
set BACKUP_PATH=%BACKUP_DIR%\%BACKUP_NAME%
if not exist "%BACKUP_PATH%" mkdir "%BACKUP_PATH%"

echo Step 1: Copying schema files...

REM Copy all SQL files
copy *.sql "%BACKUP_PATH%\"

echo Step 2: Creating backup manifest...

REM Create a manifest file with backup information
(
echo ScanCard Database Backup
echo Generated: %date% %time%
echo Backup ID: %BACKUP_NAME%
echo.
echo Files included:
echo - backup.sql ^(Complete schema backup^)
echo - setup.sql ^(Original setup script^)
echo - storage_policies.sql ^(Storage configuration^)
echo - migration_fix_referrals.sql ^(Migration fixes^)
echo - backup_manifest.txt ^(This file^)
echo.
echo Database Tables:
echo - profiles
echo - cards
echo - files
echo - voice_notes
echo - referrals
echo.
echo To restore this backup:
echo 1. Run: psql YOUR_DATABASE_URL ^< backup.sql
echo 2. Run: psql YOUR_DATABASE_URL ^< storage_policies.sql ^(if needed^)
echo 3. Import any data exports manually
echo.
echo Backup completed successfully!
) > "%BACKUP_PATH%\backup_manifest.txt"

echo Step 3: Creating compressed archive...

REM Create a compressed archive using PowerShell
powershell -command "Compress-Archive -Path '%BACKUP_PATH%' -DestinationPath '%BACKUP_DIR%\%BACKUP_NAME%.zip' -Force"

REM Remove uncompressed directory
rmdir /s /q "%BACKUP_PATH%"

echo Backup completed successfully!
echo Backup file: %BACKUP_DIR%\%BACKUP_NAME%.zip

REM Optional: Create a data export if DATABASE_URL is provided
if defined DATABASE_URL (
    echo Step 4: Creating data export...
    
    REM Create data export directory
    set DATA_PATH=%BACKUP_DIR%\%BACKUP_NAME%_data
    if not exist "%DATA_PATH%" mkdir "%DATA_PATH%"
    
    REM Export data for each table
    for %%t in (profiles cards files voice_notes referrals) do (
        echo Exporting %%t...
        pg_dump --data-only --table=public.%%t "%DATABASE_URL%" > "%DATA_PATH%\%%t_data.sql" 2>nul || echo Warning: Could not export %%t data
    )
    
    echo Data export completed!
    echo Data files saved to: %DATA_PATH%
) else (
    echo Note: Set DATABASE_URL environment variable to include data export
    echo Example: set DATABASE_URL=postgresql://user:pass@host:port/db
)

echo.
echo Backup process completed!
echo Files saved to: %BACKUP_DIR%\%BACKUP_NAME%.zip

pause 