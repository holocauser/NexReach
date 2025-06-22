# ScanCard Database Backup Guide

This guide explains how to create and restore backups of your ScanCard database.

## Backup Files

The following files are included in this backup:

1. **`backup.sql`** - Complete database schema backup
2. **`storage_policies.sql`** - Storage bucket configuration
3. **`migration_fix_referrals.sql`** - Migration fixes for referrals table
4. **`setup.sql`** - Original setup script

## Creating a Backup

### Option 1: Using Supabase Dashboard (Recommended)

1. **Schema Backup**: The `backup.sql` file contains your complete schema
2. **Data Export**: 
   - Go to your Supabase project dashboard
   - Navigate to **Database** → **Tables**
   - Use the **Export** feature for each table
   - Or use **Database** → **Backups** for automatic backups

3. **Storage Backup**:
   - Go to **Storage** → **Buckets**
   - Note your bucket configurations
   - Export any important files manually

### Option 2: Using Supabase CLI

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref YOUR_PROJECT_REF

# Create a backup
supabase db dump --data-only > data_backup.sql
supabase db dump --schema-only > schema_backup.sql
```

### Option 3: Using pg_dump (Advanced)

```bash
# Export schema only
pg_dump --schema-only --table=public.* YOUR_DATABASE_URL > schema_backup.sql

# Export data only
pg_dump --data-only --table=public.* YOUR_DATABASE_URL > data_backup.sql

# Export everything
pg_dump --table=public.* YOUR_DATABASE_URL > full_backup.sql
```

## Restoring a Backup

### Option 1: Using Supabase Dashboard

1. **Schema Restore**:
   - Go to **SQL Editor** in your Supabase dashboard
   - Run the `backup.sql` file
   - Run the `storage_policies.sql` file (if needed)

2. **Data Restore**:
   - Use the **Import** feature in the dashboard
   - Or run data INSERT statements in the SQL Editor

### Option 2: Using Supabase CLI

```bash
# Restore schema
supabase db reset --linked

# Or restore specific files
psql YOUR_DATABASE_URL < backup.sql
psql YOUR_DATABASE_URL < storage_policies.sql
```

### Option 3: Using psql (Advanced)

```bash
# Restore full backup
psql YOUR_DATABASE_URL < full_backup.sql

# Restore schema only
psql YOUR_DATABASE_URL < schema_backup.sql

# Restore data only
psql YOUR_DATABASE_URL < data_backup.sql
```

## Backup Schedule Recommendations

### Development Environment
- **Schema**: Before each major change
- **Data**: Weekly or before important changes

### Production Environment
- **Schema**: Before each deployment
- **Data**: Daily automated backups
- **Storage**: Weekly manual verification

## Important Notes

1. **Always test restores** in a development environment first
2. **Keep multiple backup versions** for safety
3. **Store backups securely** (encrypted, off-site)
4. **Document any manual changes** made to the database
5. **Verify backup integrity** by testing restores periodically

## Emergency Recovery

If you need to restore from a backup:

1. **Stop all applications** using the database
2. **Create a backup** of the current state (if possible)
3. **Restore the backup** using one of the methods above
4. **Verify the restore** by checking key tables and data
5. **Restart applications** and test functionality

## Backup Verification

After creating a backup, verify it contains:

- [ ] All tables (`profiles`, `cards`, `files`, `voice_notes`, `referrals`)
- [ ] All indexes
- [ ] All RLS policies
- [ ] All permissions
- [ ] Storage bucket configurations (if applicable)
- [ ] Sample data (if testing)

## Troubleshooting

### Common Issues

1. **Permission Errors**: Use service role key for admin operations
2. **Foreign Key Constraints**: Restore tables in the correct order
3. **RLS Policies**: Ensure policies are recreated after data restore
4. **Storage Issues**: Verify bucket exists before restoring storage policies

### Getting Help

- Check Supabase documentation: https://supabase.com/docs
- Review PostgreSQL backup documentation
- Contact Supabase support if needed 