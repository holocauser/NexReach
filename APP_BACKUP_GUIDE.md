# ScanCard Complete App Backup Guide

This guide explains how to create and restore complete backups of your ScanCard application.

## 🚀 Quick Start

### Create a Backup Right Now
```bash
# For a complete backup (includes everything)
create_app_backup.bat

# For a clean backup (excludes node_modules, build files)
create_app_backup_clean.bat
```

## 📁 What's Included in Each Backup

### Complete Backup (`create_app_backup.bat`)
- ✅ All source code files
- ✅ Configuration files
- ✅ Database schema and migrations
- ✅ Dependencies (node_modules)
- ✅ Build artifacts
- ✅ Documentation
- ✅ Assets and resources
- ✅ Android configuration
- ✅ IDE files and logs

### Clean Backup (`create_app_backup_clean.bat`) - **Recommended**
- ✅ All source code files
- ✅ Configuration files
- ✅ Database schema and migrations
- ✅ Documentation
- ✅ Assets and resources
- ✅ Android configuration (excluding build files)
- ❌ node_modules (will be restored with npm install)
- ❌ Build artifacts and cache files
- ❌ Temporary and log files
- ❌ IDE-specific files

## 🔄 How to Create a Backup

### Option 1: Using the Backup Scripts (Recommended)

1. **Open Command Prompt** in your project directory
2. **Run one of the backup scripts**:
   ```bash
   # For a clean backup (recommended)
   create_app_backup_clean.bat
   
   # For a complete backup
   create_app_backup.bat
   ```
3. **Wait for completion** - the script will show progress
4. **Find your backup** in the `app_backups` folder

### Option 2: Manual Backup

1. **Create a new folder** for your backup
2. **Copy these directories**:
   - `app/`
   - `components/`
   - `constants/`
   - `contexts/`
   - `data/`
   - `database/`
   - `hooks/`
   - `lib/`
   - `screens/`
   - `store/`
   - `types/`
   - `utils/`
   - `assets/`
   - `android/` (excluding build files)

3. **Copy these files**:
   - `package.json`
   - `package-lock.json`
   - `tsconfig.json`
   - `app.json`
   - `eas.json`
   - `babel.config.js`
   - `metro.config.js`
   - `*.md` files
   - Any other configuration files

4. **Compress the folder** into a ZIP file

## 🔧 How to Restore a Backup

### Step 1: Extract the Backup
```bash
# Extract the backup ZIP file to a new directory
# Example: Extract to C:\Projects\scancard_restored
```

### Step 2: Install Dependencies
```bash
cd scancard_restored
npm install
```

### Step 3: Configure Environment
1. **Set up environment variables**:
   - Create `.env` file with your Supabase credentials
   - Configure any other environment variables

2. **Update configuration files** if needed:
   - `app.json` - Update app name, bundle ID, etc.
   - `eas.json` - Update project configuration

### Step 4: Set Up Database
1. **Run database setup**:
   ```bash
   # In Supabase SQL Editor, run:
   # database/setup.sql
   # database/storage_policies.sql (if needed)
   ```

2. **Verify database connection**:
   - Test your Supabase connection
   - Check that tables are created correctly

### Step 5: Test the App
```bash
# Start the development server
npm start

# Or run on device/emulator
npm run android
npm run ios
```

## 📊 Backup Comparison

| Feature | Complete Backup | Clean Backup |
|---------|----------------|--------------|
| **Size** | Large (100MB+) | Small (10-50MB) |
| **Dependencies** | Included | Excluded |
| **Build Files** | Included | Excluded |
| **Restore Time** | Fast | Medium |
| **Storage Space** | High | Low |
| **Recommended For** | Development | Production/Sharing |

## 🗂️ Backup File Structure

```
app_backups/
├── scancard_app_clean_backup_20241201_143022.zip
├── scancard_app_backup_20241201_143022.zip
└── [other backups...]

Backup contents:
├── app/                    # Main app screens
├── components/             # Reusable components
├── constants/              # App constants
├── contexts/               # React contexts
├── data/                   # Mock data
├── database/               # Database files
├── hooks/                  # Custom hooks
├── lib/                    # Library files
├── screens/                # Screen components
├── store/                  # State management
├── types/                  # TypeScript types
├── utils/                  # Utility functions
├── assets/                 # Images and resources
├── android/                # Android configuration
├── package.json            # Dependencies
├── tsconfig.json           # TypeScript config
├── app.json                # Expo config
├── backup_manifest.txt     # Backup info
├── file_inventory.txt      # File list
└── .gitignore              # Git ignore rules
```

## 🔒 Security Considerations

1. **Environment Variables**: Never include `.env` files in backups
2. **API Keys**: Remove any hardcoded API keys before sharing
3. **Database Credentials**: Use environment variables for database connections
4. **Storage**: Store backups in a secure location

## 🚨 Emergency Recovery

If you need to restore from a backup:

1. **Stop all development** on the current project
2. **Create a backup** of the current state (if possible)
3. **Extract the backup** to a new directory
4. **Follow the restore steps** above
5. **Test thoroughly** before continuing development

## 📝 Best Practices

### When to Create Backups
- ✅ Before major feature development
- ✅ Before database schema changes
- ✅ Before dependency updates
- ✅ Before deployment
- ✅ Weekly during active development

### Backup Naming Convention
```
scancard_app_clean_backup_YYYYMMDD_HHMMSS.zip
```

### Storage Recommendations
- **Local**: Keep recent backups on your computer
- **Cloud**: Store important backups in cloud storage
- **Version Control**: Use Git for code versioning
- **Multiple Locations**: Don't rely on a single backup location

## 🛠️ Troubleshooting

### Common Issues

1. **Backup too large**: Use the clean backup script
2. **Missing dependencies**: Run `npm install` after restore
3. **Database connection errors**: Check environment variables
4. **Build errors**: Clear cache and rebuild

### Getting Help

- Check the backup manifest file for details
- Review the file inventory for missing files
- Test restore process in a separate directory first
- Contact support if issues persist

## 📞 Support

If you encounter issues with backup or restore:

1. Check this guide first
2. Review the backup manifest file
3. Test with a clean backup
4. Contact the development team

---

**Remember**: Always test your backup restore process before relying on it for important work! 