# Admin User Management - Setup Guide

## What Was Created

A simple user management system that allows you (as an admin) to grant admin access to other users through a friendly UI - perfect for your boss!

## Setup Steps

### 1. Run the Database Migration

First, you need to create the `user_roles` table in Supabase:

**Option A: Using Supabase CLI (Recommended)**
```bash
supabase db push
```

**Option B: Using Supabase Dashboard**
1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to SQL Editor
4. Copy the contents of `supabase/migrations/20250109_create_user_roles.sql`
5. Paste and run it

### 2. Make Yourself an Admin

Since the database is new, you need to bootstrap the first admin. Add your email to `.env.local`:

```bash
# .env.local
ADMIN_EMAILS=your-email@example.com
```

Restart your dev server after adding this.

### 3. Access the User Management Page

1. Log in to your admin panel: http://localhost:3000/admin
2. Click "Utilizadores" in the sidebar
3. You'll see all registered users

## How to Grant Admin Access to Your Boss

### Step 1: Ask Your Boss to Register
1. Tell your boss to go to: http://localhost:3000/auth/registar
2. They create an account with their email and password
3. They verify their email (check spam folder)

### Step 2: Grant Admin Access
1. You log in to the admin panel
2. Go to "Utilizadores" in the sidebar
3. Find your boss's email in the list
4. Toggle the "Admin" switch to ON
5. Done! ✅

Your boss can now log in and access the admin panel.

## Features

### User Management Page Shows:
- **Total users** - How many users are registered
- **Admin count** - How many have admin access
- **Customer count** - Regular users
- **User list** with:
  - Email
  - Status badge (Admin/Cliente)
  - Registration date
  - Last login date
  - Admin toggle switch

### How It Works:
- **Toggle ON**: User becomes admin immediately
- **Toggle OFF**: User loses admin access
- Changes are instant with friendly Portuguese messages
- System tracks who granted the admin access

## Admin Access Methods

The system supports 3 ways to be an admin:

1. **Environment Variable** (`.env.local` - what you have now)
   - Fast
   - Requires restart
   - Good for initial setup

2. **Database Role** (new system - what we just created)
   - No restart needed
   - Can be managed through UI
   - Perfect for your boss

3. **Supabase Metadata** (advanced)
   - Set in Supabase dashboard
   - For complex setups

All three methods work together! If someone is admin in ANY of these, they have access.

## Security Notes

✅ **Safe**:
- Only existing admins can grant/revoke admin access
- All changes are logged with timestamps
- Uses Supabase Row Level Security

⚠️ **Important**:
- Make sure you have at least 2 admins (you + your boss) before removing your email from `.env.local`
- If you remove the last admin, you'll need to add someone back via `.env.local`

## Troubleshooting

### "Error loading users"
- Make sure you ran the migration
- Check Supabase project permissions

### "My boss can't see the admin panel"
- Verify the admin toggle is ON for their email
- Ask them to log out and log back in
- Check they're using the correct email

### "Admin toggle doesn't work"
- Make sure you ran the database migration
- Check Supabase dashboard for errors in the logs

## Files Created

1. `supabase/migrations/20250109_create_user_roles.sql` - Database table
2. `app/(admin)/admin/users/page.tsx` - Admin users page
3. `components/admin/users/users-management.tsx` - User management UI
4. `lib/auth/permissions.ts` - Updated permission checks

## Next Steps

After your boss has admin access, they can:
- Manage products
- Create variants
- Use all admin tools
- Grant admin access to others (if needed)

No more editing config files! 🎉
