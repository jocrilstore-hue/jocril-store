# User Management System - Jocril Store

## Overview

The Jocril Store uses a dual-layer authentication and authorization system that allows both regular customers and administrators to access the platform with different permission levels.

## System Architecture

### Authentication Layer (Supabase Auth)
All users (customers and admins) use the same authentication system:
- Email/password authentication
- Email verification
- Session management
- Password reset functionality

### Authorization Layer (Admin Access Control)
Admin access is determined through **three independent methods** (any one grants access):

1. **Environment Variables** (Primary Bootstrap Method)
2. **Database Roles** (User-Friendly Management)
3. **Supabase User Metadata** (Advanced/Legacy)

## User Types

### 1. Regular Customers
- **Registration**: `/auth/registar` - public signup page
- **Access**:
  - Browse store (public)
  - View account: `/conta`
  - Place orders: `/encomendas`
  - View order history
- **Permissions**: Read-only access to products, can create orders

### 2. Administrators
- **Registration**: Same as customers - `/auth/registar`
- **Access Upgrade**: Must be granted admin permissions (see methods below)
- **Access**:
  - Everything customers can do
  - Admin panel: `/admin`
  - Product management
  - Variant management
  - User management (can grant/revoke admin access)
  - Bulk operations and tools
- **Permissions**: Full CRUD on all resources

## Admin Access Methods

### Method 1: Environment Variables ⚡ (Fastest, Requires Restart)

**File**: `.env.local`

```bash
# Add admin emails separated by commas
ADMIN_EMAILS=jocrilstore@gmail.com,boss@jocril.pt,another-admin@jocril.pt
```

**When to use**:
- Initial setup (bootstrap first admin)
- Permanent admins that never change
- Development/testing

**Pros**:
- Simple configuration
- No database needed
- Works immediately after restart

**Cons**:
- Requires server restart to take effect
- Not user-friendly for non-technical users
- Harder to audit changes

**Implementation**: `lib/auth/permissions.ts:6-17`

### Method 2: Database Roles 🎯 (User-Friendly, Recommended)

**Table**: `public.user_roles`

**Schema**:
```sql
CREATE TABLE user_roles (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'customer')),
  granted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
```

**When to use**:
- Normal operations (day-to-day admin management)
- When you want to grant access via UI
- For your boss or non-technical team members

**Pros**:
- User-friendly UI in admin panel (`/admin/users`)
- No server restart needed
- Instant changes
- Audit trail (who granted access, when)
- Can be managed by any existing admin

**Cons**:
- Requires database migration
- Slightly slower than env variables (database query)

**Implementation**:
- `lib/auth/permissions.ts:71-96` - Database check
- `app/(admin)/admin/users/page.tsx` - UI page
- `components/admin/users/users-management.tsx` - Management interface

### Method 3: Supabase User Metadata 🔧 (Advanced)

**Location**: Supabase Dashboard → Authentication → Users → User Metadata

**Metadata Fields Checked**:
```json
{
  "role": "admin",
  // OR
  "roles": ["admin", "customer"],
  // OR in app_metadata
  "app_metadata": {
    "role": "admin"
  }
}
```

**Recognized Admin Roles**:
- `admin`
- `super_admin`
- `superadmin`
- `owner`

**When to use**:
- Migration from legacy systems
- Integration with external auth providers
- Complex multi-role setups

**Pros**:
- Flexible
- Integrates with OAuth providers
- Can be set programmatically

**Cons**:
- Requires Supabase dashboard access
- More complex
- Less visible to other admins

**Implementation**: `lib/auth/permissions.ts:24-64`

## How Admin Access is Checked

### In Middleware (Fast Check)
**File**: `lib/supabase/middleware.ts:44-49`

```typescript
if (pathname.startsWith("/admin") && user && !userHasAdminAccess(user)) {
  // Redirect to homepage
  return NextResponse.redirect("/")
}
```

**Checks**: Environment variables + User metadata (synchronous)
**Does NOT check**: Database (too slow for middleware)

### In Server Components (Full Check)
**File**: `app/(admin)/admin/layout.tsx:18-21`

```typescript
const isAdmin = await userIsAdmin(supabase, user)
if (!isAdmin) {
  redirect("/")
}
```

**Checks**: Environment variables + User metadata + Database
**Performance**: Cached by user session

### Priority Order
1. Environment variables (fastest)
2. User metadata (fast)
3. Database roles (slower, but still fast)

**If ANY method returns true, user is granted admin access.**

## User Management UI

### Location
`/admin/users` - Accessible only to existing admins

### Features

#### Dashboard Cards
- **Total Users**: Count of all registered users
- **Administrators**: Count of users with admin access
- **Customers**: Count of regular users

#### User Table
Displays for each user:
- Email address
- Status badge (Administrador / Cliente)
- Registration date
- Last login date
- **Admin toggle switch** (ON/OFF)

#### Toggle Switch Functionality
- **Toggle ON**:
  - Inserts record into `user_roles` table
  - Sets `role = 'admin'`
  - Records who granted access (`granted_by`)
  - Records timestamp (`granted_at`)
  - Shows success toast
  - Change is instant

- **Toggle OFF**:
  - Deletes record from `user_roles` table
  - Removes admin access
  - Shows success toast
  - Change is instant

#### Error Handling
- Uses Portuguese error messages
- Optimistic UI updates (instant feedback)
- Reverts on failure
- Clear error toasts

### Implementation Details

**Server Component**: `app/(admin)/admin/users/page.tsx`
- Fetches all users from `auth.users` (requires Service Role Key)
- Fetches all roles from `user_roles`
- Combines data and passes to client component

**Client Component**: `components/admin/users/users-management.tsx`
- Renders UI
- Handles toggle switch interactions
- Makes database mutations
- Shows toasts

## Security

### Row Level Security (RLS)

**Users can view own roles**:
```sql
CREATE POLICY "Users can view own roles"
  ON public.user_roles
  FOR SELECT
  USING (auth.uid() = user_id);
```

**Only admins can manage roles**:
```sql
CREATE POLICY "Admins can manage all roles"
  ON public.user_roles
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
```

### Helper Function
```sql
CREATE FUNCTION check_user_is_admin(check_user_id UUID)
RETURNS BOOLEAN
```

Can be called from anywhere to verify admin status.

## Complete User Flow Examples

### Example 1: Onboarding Your Boss

**Step 1: Boss Registers**
1. Boss visits `https://yourstore.com/auth/registar`
2. Enters email: `boss@jocril.pt`
3. Creates password (min 6 characters)
4. Submits form
5. Receives verification email
6. Clicks verification link
7. Account is created ✅

**Step 2: You Grant Admin Access**
1. You log in to `https://yourstore.com/admin`
2. Click "Utilizadores" in sidebar
3. See list of all users
4. Find row with `boss@jocril.pt`
5. Toggle "Admin" switch to **ON**
6. See success message: "boss@jocril.pt agora é administrador"
7. Done ✅

**Step 3: Boss Accesses Admin Panel**
1. Boss logs in with their credentials
2. Navigates to `https://yourstore.com/admin`
3. Has full admin access ✅

### Example 2: Removing Admin Access

**Scenario**: Employee leaves company

1. You log in to `/admin/users`
2. Find employee's email
3. Toggle "Admin" switch to **OFF**
4. Employee immediately loses admin access
5. Employee can still use customer features

### Example 3: Bootstrap First Admin (You)

**Initial Setup** (when database is empty):

1. You register normally at `/auth/registar`
2. Verify your email
3. Add to `.env.local`:
   ```bash
   ADMIN_EMAILS=jocrilstore@gmail.com
   ```
4. Restart dev server
5. You can now access `/admin`
6. Navigate to `/admin/users`
7. Toggle your own switch to **ON** (now in database too)
8. Optionally remove from `.env.local` (database role is enough)

## Database Schema

### Table: `user_roles`

| Column | Type | Description |
|--------|------|-------------|
| `id` | BIGSERIAL | Primary key |
| `user_id` | UUID | References auth.users(id), ON DELETE CASCADE |
| `role` | TEXT | 'admin' or 'customer' (CHECK constraint) |
| `granted_by` | UUID | Who granted this role (nullable) |
| `granted_at` | TIMESTAMPTZ | When role was granted (default now()) |

**Indexes**:
- `idx_user_roles_user_id` on `user_id`
- `idx_user_roles_role` on `role`

**Constraints**:
- `UNIQUE(user_id, role)` - Prevents duplicate role assignments

**RLS**: Enabled with policies for view/manage access

## Migration File

**Location**: `supabase/migrations/20250109_create_user_roles.sql`

**To Apply**:

Option A - Supabase CLI:
```bash
supabase db push
```

Option B - Dashboard:
1. Go to Supabase Dashboard
2. SQL Editor
3. Copy/paste migration file contents
4. Run

## Troubleshooting

### Problem: Can't access `/admin` even though I'm in .env

**Solution**:
1. Check `.env.local` has `ADMIN_EMAILS=your-email@example.com`
2. Restart dev server (required for env changes)
3. Clear browser cache/cookies
4. Log out and log back in

### Problem: Toggle switch doesn't work

**Possible Causes**:
1. Migration not run → Run the SQL migration
2. RLS policy blocking → Check you're logged in as admin
3. Network error → Check browser console for errors

**Check**:
```sql
-- In Supabase SQL Editor
SELECT * FROM user_roles;
```

### Problem: User can't see admin panel after toggle ON

**Solution**:
1. User must log out and log back in
2. Check middleware is checking database: `lib/supabase/middleware.ts`
3. Verify role exists in database:
   ```sql
   SELECT * FROM user_roles WHERE user_id = 'their-uuid';
   ```

### Problem: "Error loading users" on `/admin/users` page

**Cause**: Service Role Key not set or insufficient permissions

**Solution**:
1. Verify `.env.local` has `SUPABASE_SERVICE_ROLE_KEY`
2. Check key in Supabase Dashboard → Settings → API
3. Restart server after adding key

## Best Practices

### DO ✅
- Keep at least 2 admins at all times (redundancy)
- Use database roles for normal operations
- Use env variables only for bootstrap/permanent admins
- Grant admin access sparingly
- Review admin list regularly in `/admin/users`

### DON'T ❌
- Don't remove last admin from system
- Don't share admin credentials
- Don't grant admin to untrusted users
- Don't forget to remove admin when employees leave

## File Reference

### Core Files

| File | Purpose |
|------|---------|
| `lib/auth/permissions.ts` | Permission checking logic |
| `lib/supabase/middleware.ts` | Route protection middleware |
| `app/(admin)/admin/layout.tsx` | Admin layout with double-check |
| `app/(admin)/admin/users/page.tsx` | User management page (server) |
| `components/admin/users/users-management.tsx` | User management UI (client) |
| `supabase/migrations/20250109_create_user_roles.sql` | Database migration |
| `.env.local` | Environment configuration |

### Key Functions

| Function | File | Purpose |
|----------|------|---------|
| `userHasAdminAccess()` | `lib/auth/permissions.ts:24` | Check env + metadata (sync) |
| `userHasAdminAccessDB()` | `lib/auth/permissions.ts:71` | Check database (async) |
| `userIsAdmin()` | `lib/auth/permissions.ts:102` | Check all methods (async) |
| `check_user_is_admin()` | SQL function | Database helper for RLS |

## Future Enhancements

Potential improvements to consider:

1. **Role Types**: Add more granular roles (editor, viewer, super_admin)
2. **Permissions**: Fine-grained permissions (can_edit_products, can_manage_users)
3. **Audit Log**: Track all permission changes with details
4. **Bulk Operations**: Grant/revoke admin to multiple users at once
5. **Invitations**: Send admin invitation emails instead of manual toggle
6. **Expiry**: Time-limited admin access
7. **2FA**: Two-factor authentication for admin accounts

## Summary

The Jocril Store user management system provides:
- **Simple registration** for all users (customers and admins use the same flow)
- **Flexible admin access** via env variables, database, or metadata
- **User-friendly UI** at `/admin/users` for granting admin access
- **Instant changes** with database-backed roles
- **Security** with RLS policies and audit trails
- **No technical knowledge required** for your boss to use the system

**Current Status**:
- ✅ Configured with `ADMIN_EMAILS=jocrilstore@gmail.com` in `.env.local`
- ✅ Admin panel accessible at `/admin` after logging in
- ✅ User management UI available at `/admin/users`
- ⏳ Database migration ready to apply (run SQL file)

After applying the migration, you can use the UI to grant admin access to anyone without editing config files!
