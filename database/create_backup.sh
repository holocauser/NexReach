#!/bin/bash

# ScanCard Database Backup Script
# This script creates a comprehensive backup of your database

set -e  # Exit on any error

# Configuration
BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="scancard_backup_${TIMESTAMP}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting ScanCard Database Backup...${NC}"
echo "Backup will be saved to: ${BACKUP_DIR}/${BACKUP_NAME}"

# Create backup directory if it doesn't exist
mkdir -p "${BACKUP_DIR}"

# Create backup directory for this specific backup
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_NAME}"
mkdir -p "${BACKUP_PATH}"

echo -e "${YELLOW}Step 1: Copying schema files...${NC}"

# Copy all SQL files
cp *.sql "${BACKUP_PATH}/"

echo -e "${YELLOW}Step 2: Creating backup manifest...${NC}"

# Create a manifest file with backup information
cat > "${BACKUP_PATH}/backup_manifest.txt" << EOF
ScanCard Database Backup
Generated: $(date)
Backup ID: ${BACKUP_NAME}

Files included:
- backup.sql (Complete schema backup)
- setup.sql (Original setup script)
- storage_policies.sql (Storage configuration)
- migration_fix_referrals.sql (Migration fixes)
- backup_manifest.txt (This file)

Database Tables:
- profiles
- cards
- files
- voice_notes
- referrals

To restore this backup:
1. Run: psql YOUR_DATABASE_URL < backup.sql
2. Run: psql YOUR_DATABASE_URL < storage_policies.sql (if needed)
3. Import any data exports manually

Backup completed successfully!
EOF

echo -e "${YELLOW}Step 3: Creating compressed archive...${NC}"

# Create a compressed archive
cd "${BACKUP_DIR}"
tar -czf "${BACKUP_NAME}.tar.gz" "${BACKUP_NAME}"
rm -rf "${BACKUP_NAME}"  # Remove uncompressed directory

echo -e "${GREEN}Backup completed successfully!${NC}"
echo -e "Backup file: ${BACKUP_DIR}/${BACKUP_NAME}.tar.gz"
echo -e "Size: $(du -h "${BACKUP_NAME}.tar.gz" | cut -f1)"

# Optional: Create a data export if DATABASE_URL is provided
if [ ! -z "$DATABASE_URL" ]; then
    echo -e "${YELLOW}Step 4: Creating data export...${NC}"
    
    # Export data for each table
    for table in profiles cards files voice_notes referrals; do
        echo "Exporting ${table}..."
        pg_dump --data-only --table=public.${table} "$DATABASE_URL" > "${BACKUP_PATH}/${table}_data.sql" 2>/dev/null || echo "Warning: Could not export ${table} data"
    done
    
    echo -e "${GREEN}Data export completed!${NC}"
else
    echo -e "${YELLOW}Note: Set DATABASE_URL environment variable to include data export${NC}"
    echo "Example: export DATABASE_URL='postgresql://user:pass@host:port/db'"
fi

echo -e "${GREEN}Backup process completed!${NC}"
echo -e "Files saved to: ${BACKUP_DIR}/${BACKUP_NAME}.tar.gz" 