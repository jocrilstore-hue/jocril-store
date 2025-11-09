# Admin Panel Testing & Implementation Guide
## Jocril Store - Product Management System

**Generated**: 2025-11-09
**Server**: http://localhost:3000
**Admin URL**: http://localhost:3000/admin

---

## 📋 Table of Contents

1. [Access Control & Security](#1-access-control--security)
2. [Admin Navigation Flow](#2-admin-navigation-flow)
3. [Templates Listing & Filtering](#3-templates-listing--filtering)
4. [Template CRUD Operations](#4-template-crud-operations)
5. [Variant Management](#5-variant-management)
6. [Tools Dashboard](#6-tools-dashboard)
7. [Testing Checklist](#7-testing-checklist)
8. [Implementation Roadmap](#8-implementation-roadmap)

---

## 1. Access Control & Security

### ✅ **Current Implementation**

#### Middleware Protection (`lib/supabase/middleware.ts`)
- ✅ Checks authentication for `/admin` routes
- ✅ Redirects unauthenticated users to `/auth/login?redirectTo=/admin`
- ✅ Verifies admin access via `userHasAdminAccess()`
- ✅ Redirects non-admin authenticated users to `/` with error message

#### Layout-Level Protection (`app/(admin)/admin/layout.tsx`)
- ✅ Double-checks authentication
- ✅ Verifies admin permissions
- ✅ Extracts user profile from metadata

#### Permission Logic (`lib/auth/permissions.ts`)
Admin access granted if user has:
- **Role-based**: `admin`, `super_admin`, `superadmin`, or `owner` role in:
  - `user.role`
  - `user.app_metadata.role/roles`
  - `user.user_metadata.role/roles`
  - `user.app_metadata.claims.role`
- **Email-based**: Email matches env variables:
  - `ADMIN_EMAILS`
  - `NEXT_PUBLIC_ADMIN_EMAILS`
  - `NEXT_PUBLIC_SUPER_ADMINS`

### 🧪 **Testing Scenarios**

#### Test 1: Anonymous User Access
```bash
# Expected: Redirect to login
# URL: http://localhost:3000/admin
# Result: Should redirect to /auth/login?redirectTo=/admin
```

#### Test 2: Authenticated Non-Admin
```bash
# Expected: Redirect to home with error
# Steps:
1. Login as regular user
2. Navigate to /admin
3. Should redirect to /?erro=sem-acesso
```

#### Test 3: Admin User Access
```bash
# Expected: Full access to admin panel
# Setup: Add your email to .env.local
ADMIN_EMAILS=your-email@example.com
# Result: Should access admin dashboard
```

---

## 2. Admin Navigation Flow

### Current Routes Structure

```
/admin                          → Dashboard/Overview
/admin/products                 → Templates listing
/admin/products/new             → Create new template
/admin/products/[id]/edit       → Edit template
/admin/products/[id]/variants   → Variant board view
/admin/products/[id]/variants/new              → Create variant
/admin/products/[id]/variants/[variantId]/edit → Edit variant
/admin/products/tools           → Tools dashboard
```

### 🧪 **Navigation Testing**

```bash
# Test Flow:
1. Access /admin/products
2. Click "Novo template" → should navigate to /admin/products/new
3. Create template → should redirect to /admin/products/[id]/edit
4. Navigate through tabs (details, content, FAQs, SEO, etc.)
5. Click "Gerenciar variantes" → should go to /admin/products/[id]/variants
6. Add variant → test /admin/products/[id]/variants/new
7. Edit variant → test /admin/products/[id]/variants/[variantId]/edit
8. Access tools → /admin/products/tools
```

---

## 3. Templates Listing & Filtering

### ✅ **Implemented Features**

#### Server-Side Filtering (`app/(admin)/admin/products/page.tsx`)
```typescript
interface ProductTemplateFilters {
  search?: string           // Search by name/description
  categoryId?: number       // Filter by category
  materialId?: number       // Filter by material
  status: 'all' | 'active' | 'inactive' | 'draft'
  sort: 'order-asc' | 'order-desc' | 'name-asc' | 'name-desc' | 'updated-desc'
  page?: number
  pageSize?: number
}
```

#### Statistics Display
- Total templates in current filter
- Active templates on page
- Featured templates on page

### 🧪 **Testing Checklist**

- [ ] **Search Filter**
  - Type product name → verify results update
  - Search partial name → verify fuzzy matching
  - Clear search → verify all products return

- [ ] **Category Filter**
  - Select category from dropdown
  - Verify only products in that category show
  - Select "All" → verify all products return

- [ ] **Material Filter**
  - Select material type
  - Verify filtering works
  - Combine with category filter

- [ ] **Status Filter**
  - Filter by Active → only active templates
  - Filter by Inactive → only inactive templates
  - Filter by Draft → only draft templates
  - Filter "All" → all templates

- [ ] **Sorting**
  - Sort by Order (ascending/descending)
  - Sort by Name (A-Z / Z-A)
  - Sort by Last Updated

- [ ] **Pagination**
  - Navigate between pages
  - Change page size (10, 25, 50, 100)
  - Verify URL params update
  - Verify direct URL access with page params works

- [ ] **Bulk Selection**
  - Select individual items
  - Select all on page
  - Deselect all
  - Perform bulk actions (if implemented)

- [ ] **Console/Network Monitoring**
  - Open browser DevTools (F12)
  - Check Console for errors
  - Monitor Network tab for:
    - Supabase query errors
    - Failed API calls
    - Slow queries (>1s)

---

## 4. Template CRUD Operations

### Create Template Flow

#### Test Steps:
```bash
1. Navigate to /admin/products
2. Click "Novo template"
3. Fill required fields:
   - Template name
   - Short description
   - Category
   - Material
4. Save as Draft → verify saved
5. Publish → verify status changes
```

### Edit Template - Tab Testing

#### **Tab 1: Details**
- [ ] Edit template name
- [ ] Edit short description
- [ ] Change category
- [ ] Change material
- [ ] Toggle active status
- [ ] Toggle featured status
- [ ] Update custom dimensions option
- [ ] Save changes → verify persistence

#### **Tab 2: Content (Rich Text)**
- [ ] Edit long description with rich text editor
- [ ] Add formatting (bold, italic, lists)
- [ ] Insert links
- [ ] Add images (if supported)
- [ ] Preview content
- [ ] Save → verify HTML persists correctly

#### **Tab 3: FAQs**
- [ ] Add new FAQ item
- [ ] Edit existing FAQ
- [ ] Reorder FAQs (drag & drop if supported)
- [ ] Delete FAQ
- [ ] Save → verify order maintained

#### **Tab 4: SEO**
- [ ] Edit meta title
- [ ] Edit meta description
- [ ] Edit slug
- [ ] Check character counts
- [ ] Preview how it looks in search results
- [ ] Save → verify SEO data

#### **Tab 5: Applications**
- [ ] Add application examples
- [ ] Edit existing applications
- [ ] Delete applications
- [ ] Save changes

### Delete Template

#### Test Scenarios:
- [ ] **With NO variants**: Delete should succeed
- [ ] **With variants**: Delete should fail gracefully with error message
- [ ] Verify database integrity after deletion
- [ ] Check if soft delete or hard delete is used

### 🧪 **Data Persistence Testing**

```bash
# After each save operation:
1. Refresh page → verify data persists
2. Navigate away and back → verify data persists
3. Check browser Network tab → verify Supabase queries succeed
4. Check console → no errors
```

---

## 5. Variant Management

### Board View (`/admin/products/[id]/variants`)

#### Expected Features:
- [ ] List all variants for template
- [ ] Display variant details:
  - SKU
  - Size format
  - Price
  - Stock quantity
  - Active status
- [ ] Visual indicators:
  - Active/Inactive badge
  - Low stock warning
  - Out of stock indicator

### Create Variant

#### Test Flow:
```bash
1. Click "Nova variante"
2. Fill required fields:
   - Size format (select or create new)
   - SKU (auto-generate or manual)
   - Base price (including VAT)
   - Stock quantity
   - Custom dimensions (if applicable)
3. Upload images:
   - Main image
   - Gallery images (if supported)
4. Set pricing tiers (if implemented)
5. Generate URL slug (auto or manual)
6. Save → verify variant appears in list
```

### Edit Variant

#### Test Checklist:
- [ ] Edit SKU
- [ ] Update price
- [ ] Change stock quantity
- [ ] Toggle active status
- [ ] Update dimensions
- [ ] Change URL slug
- [ ] Upload/replace images
- [ ] Save → verify changes persist

### Variant Actions

- [ ] **Toggle Active/Inactive**
  - Click toggle → verify status changes
  - Check if reflected on frontend immediately

- [ ] **Delete Variant**
  - Click delete
  - Confirm deletion
  - Verify removed from list
  - Check database cleanup

### Input Validation

- [ ] **Price**:
  - Accept positive decimals only
  - Show validation error for negative/zero
  - Format correctly (€ symbol, 2 decimals)

- [ ] **Stock**:
  - Accept positive integers only
  - Show warning for low stock (<10)
  - Show error indicator for 0 stock

- [ ] **SKU**:
  - Check for uniqueness
  - Show error if duplicate
  - Auto-generate if empty

- [ ] **URL Slug**:
  - Auto-generate from template + size
  - Check for uniqueness
  - Allow manual override
  - Validate format (lowercase, hyphens)

### Board View Updates

- [ ] Verify optimistic UI updates (immediate feedback)
- [ ] Verify server sync after optimistic update
- [ ] Handle update failures gracefully
- [ ] No full page refresh needed

---

## 6. Tools Dashboard

### Current Stubs (`/admin/products/tools`)

#### Bulk Price Adjustment
**Status**: 🟡 Stub (UI only)

Test UI:
- [ ] Select price adjustment type (percentage/fixed)
- [ ] Enter adjustment value
- [ ] Select target variants/templates
- [ ] Click submit → verify toast notification
- [ ] **TODO**: Implement backend RPC/API

#### Image Scan & Audit
**Status**: 🟡 Stub (UI only)

Test UI:
- [ ] Click "Scan Images" button
- [ ] Verify progress indicator shows
- [ ] Check toast notification
- [ ] **TODO**: Implement image validation logic
  - Missing images
  - Broken links
  - Oversized files
  - Wrong formats

#### SEO Checklist
**Status**: 🟡 Stub (UI only)

Test UI:
- [ ] Click "Run SEO Audit"
- [ ] Verify checklist displays
- [ ] **TODO**: Implement SEO rules
  - Missing meta titles
  - Missing meta descriptions
  - Duplicate slugs
  - Missing alt tags

#### Export/Import

**Export CSV**:
- [ ] Click export button
- [ ] Verify CSV downloads
- [ ] **TODO**: Implement CSV generation
  - All templates
  - Filtered templates
  - All variants
  - Selected variants

**Import CSV**:
- [ ] Upload CSV file
- [ ] Verify file validation
- [ ] Show preview of changes
- [ ] **TODO**: Implement import logic
  - Data validation
  - Duplicate handling
  - Error reporting
  - Rollback on failure

---

## 7. Testing Checklist

### Pre-Testing Setup

```bash
# 1. Ensure dev server is running
pnpm dev

# 2. Verify database connection
# Check .env.local for Supabase credentials

# 3. Create admin user
# Add your email to .env.local:
ADMIN_EMAILS=your-email@example.com

# 4. Open browser DevTools (F12)
# - Console tab (watch for errors)
# - Network tab (monitor Supabase calls)
```

### System-Wide Tests

- [ ] **Browser Compatibility**
  - Chrome/Edge
  - Firefox
  - Safari

- [ ] **Responsive Design**
  - Desktop (1920x1080)
  - Tablet (768x1024)
  - Mobile (375x667)

- [ ] **Performance**
  - Initial page load < 3s
  - Filter/sort operations < 500ms
  - No memory leaks on long sessions

- [ ] **Error Handling**
  - Network errors show user-friendly messages
  - Supabase errors logged to console
  - Invalid form inputs prevented
  - 404s handled gracefully

### Data Integrity

- [ ] **Concurrent Edits**
  - Open same template in 2 tabs
  - Edit in tab 1 → save
  - Edit in tab 2 → save
  - Verify conflict handling

- [ ] **Database Constraints**
  - Try to violate unique constraints (SKU, slug)
  - Verify foreign key integrity
  - Test cascade deletes

---

## 8. Implementation Roadmap

### 🔴 **Priority 1: Critical Backend Wiring**

#### 1.1 Variant Pricing & Media
```typescript
// TODO: Implement
- [ ] Price tiers table & mutations
- [ ] Image upload to Supabase Storage
- [ ] Gallery drag-and-drop ordering
- [ ] Image optimization on upload
```

#### 1.2 Stock Management
```typescript
// TODO: Implement
- [ ] Low stock alerts (< 10 items)
- [ ] Out of stock indicators
- [ ] Stock history tracking
- [ ] Automatic low-stock notifications
```

#### 1.3 Validation & Error Handling
```typescript
// TODO: Implement
- [ ] Slug uniqueness validation
- [ ] SKU uniqueness validation
- [ ] Supabase error mapping to user messages
- [ ] Form validation schemas (Zod)
```

### 🟡 **Priority 2: Tools Dashboard Backend**

#### 2.1 Bulk Operations
```sql
-- TODO: Create Supabase RPCs

-- Bulk price update
CREATE OR REPLACE FUNCTION bulk_update_prices(
  variant_ids INTEGER[],
  adjustment_type TEXT, -- 'percentage' or 'fixed'
  adjustment_value DECIMAL
) RETURNS TABLE(...);

-- Bulk status toggle
CREATE OR REPLACE FUNCTION bulk_toggle_active(
  variant_ids INTEGER[],
  new_status BOOLEAN
) RETURNS TABLE(...);
```

#### 2.2 Image Audit
```typescript
// TODO: Implement
- [ ] Scan all product images
- [ ] Check for:
  - Missing images (broken URLs)
  - Oversized files (>2MB)
  - Wrong formats (not .webp/.jpg/.png)
  - Missing alt text
- [ ] Generate audit report
- [ ] Auto-fix suggestions
```

#### 2.3 SEO Audit
```typescript
// TODO: Implement
- [ ] Check all templates for:
  - Missing meta title
  - Missing meta description
  - Meta title too long (>60 chars)
  - Meta description too long (>160 chars)
  - Duplicate slugs
  - Missing OpenGraph tags
- [ ] Generate SEO score
- [ ] Export SEO report CSV
```

#### 2.4 CSV Import/Export
```typescript
// TODO: Implement

// Export features:
- [ ] Export templates to CSV
- [ ] Export variants to CSV
- [ ] Export with filters applied
- [ ] Include/exclude specific columns

// Import features:
- [ ] Parse CSV file
- [ ] Validate data format
- [ ] Show preview before import
- [ ] Handle duplicates (skip/update)
- [ ] Batch insert with progress indicator
- [ ] Rollback on error
- [ ] Export error log
```

### 🟢 **Priority 3: Enhanced UX**

#### 3.1 Rich Text Editor
```bash
# Replace simple editor with:
Option 1: Tiptap (recommended)
- Full-featured WYSIWYG
- Markdown support
- Image embeds
- Video embeds
- Code blocks

Option 2: Slate
- Highly customizable
- Better for complex formatting

TODO:
- [ ] Install & configure editor
- [ ] Add toolbar (bold, italic, headings, lists, links)
- [ ] Localize toolbar to Portuguese
- [ ] Sanitize HTML on save (prevent XSS)
- [ ] Image upload integration
```

#### 3.2 Variant Gallery Management
```typescript
// TODO: Implement
- [ ] Drag & drop image upload
- [ ] Multiple image selection
- [ ] Reorder images (drag & drop)
- [ ] Set main image (primary)
- [ ] Image cropping/editing
- [ ] Alt text for each image
- [ ] Delete with confirmation
```

#### 3.3 UI Polish
```typescript
// TODO: Enhance
- [ ] Loading skeletons for async operations
- [ ] Optimistic UI updates (immediate feedback)
- [ ] Undo/redo for bulk operations
- [ ] Keyboard shortcuts (e.g., Ctrl+S to save)
- [ ] Breadcrumb navigation
- [ ] Recently viewed templates
- [ ] Search history
```

### 🔵 **Priority 4: Testing & CI**

#### 4.1 Unit Tests
```bash
# React Testing Library
- [ ] Component rendering tests
- [ ] User interaction tests
- [ ] Form validation tests
- [ ] API mock tests
```

#### 4.2 Integration Tests
```bash
# Playwright
- [ ] End-to-end admin flows
- [ ] Authentication tests
- [ ] CRUD operation tests
- [ ] Multi-browser testing
```

#### 4.3 CI/CD Pipeline
```yaml
# GitHub Actions / Vercel
- [ ] Run tests on PR
- [ ] Type checking
- [ ] Linting
- [ ] Build verification
- [ ] Deploy preview on PR
```

#### 4.4 Test Data & Mocks
```typescript
// TODO: Setup
- [ ] Supabase seed data script
- [ ] Mock auth helpers
- [ ] Factory functions for test data
- [ ] E2E test database (separate from prod)
```

---

## 🚀 Next Steps

### Immediate Actions:

1. **Run Manual Tests** (1-2 hours)
   - Follow testing checklists above
   - Document bugs in GitHub Issues
   - Note missing features

2. **Set Up Admin User** (5 min)
   ```bash
   # Add to .env.local
   ADMIN_EMAILS=your-email@example.com

   # Restart server
   pnpm dev
   ```

3. **Create Test Data** (15 min)
   - Create 5 test templates
   - Add 3-5 variants per template
   - Test all CRUD operations

4. **Monitor Console** (ongoing)
   - Check for Supabase errors
   - Watch network requests
   - Note slow queries

### Prioritize Implementation:

**Week 1**: Priority 1 tasks (Backend wiring)
**Week 2**: Priority 2 tasks (Tools dashboard)
**Week 3**: Priority 3 tasks (UX enhancements)
**Week 4**: Priority 4 tasks (Testing & CI)

---

## 📝 Bug Report Template

When you find issues, document them like this:

```markdown
### Bug: [Short description]

**Severity**: Critical / High / Medium / Low
**Page**: /admin/products/[id]/edit
**Browser**: Chrome 120
**User**: admin@example.com

**Steps to Reproduce**:
1. Navigate to...
2. Click on...
3. Observe that...

**Expected Behavior**:
Should do X

**Actual Behavior**:
Does Y instead

**Console Errors**:
```
[Paste error logs]
```

**Network Errors**:
```
[Paste failed API calls]
```

**Screenshots**:
[Attach if relevant]

**Suggested Fix**:
[If you have ideas]
```

---

## 📞 Need Help?

- **Supabase Docs**: https://supabase.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Shadcn UI**: https://ui.shadcn.com

---

**Happy Testing! 🧪**

