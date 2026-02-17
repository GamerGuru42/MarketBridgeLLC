# 🔧 URGENT FIX: Admin Chat & CEO Verification

## Issues Fixed:
1. ✅ Operations Admin can now send messages in Executive Chat
2. ✅ CEO accounts are automatically verified on creation
3. ✅ All admin roles auto-verified
4. ✅ Verification button now visible in Users Manager

## 🚀 Quick Setup (2 Steps):

### Step 1: Apply SQL Migration
Go to your **Supabase Dashboard** → **SQL Editor**

Copy and paste this entire migration:

```sql
-- COMPREHENSIVE ADMIN & VERIFICATION FIX
-- 1. Auto-verify CEO and all admin roles on account creation
-- 2. Fix admin chat RLS policies for operations_admin
-- 3. Update auto-verification logic

-- ========================================
-- PART 1: Auto-Verify Admin & CEO Accounts
-- ========================================

-- Drop and recreate the auto-verification function
DROP TRIGGER IF EXISTS on_edu_user_created ON public.users;
DROP FUNCTION IF EXISTS public.auto_verify_edu_ng();

CREATE OR REPLACE FUNCTION public.auto_verify_accounts()
RETURNS TRIGGER AS $$
BEGIN
    -- Auto-verify:
    -- 1. .edu.ng emails
    -- 2. @marketbridge.com.ng emails
    -- 3. CEO and all admin roles
    IF NEW.email ~* '^[a-zA-Z0-9._%+-]+@([a-zA-Z0-9.-]+\.)?edu(\.ng)?$' OR 
       NEW.email ILIKE '%@marketbridge.com.ng' OR
       NEW.role IN ('ceo', 'admin', 'technical_admin', 'operations_admin', 'marketing_admin', 'cto', 'coo', 'cofounder') THEN
        
        UPDATE public.users 
        SET is_verified = TRUE, beta_status = 'approved'
        WHERE id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
CREATE TRIGGER on_auto_verify_accounts
    AFTER INSERT ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.auto_verify_accounts();

-- ========================================
-- PART 2: Fix Admin Chat RLS Policies
-- ========================================

-- Drop old restrictive insert policy
DROP POLICY IF EXISTS "Admins can insert messages" ON admin_channel_messages;

-- Create new policy that explicitly allows all admin roles
CREATE POLICY "Admins can insert messages" ON admin_channel_messages
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id 
        AND EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN (
                'admin', 
                'technical_admin', 
                'operations_admin', 
                'marketing_admin', 
                'cto', 
                'coo', 
                'ceo', 
                'cofounder'
            )
        )
    );

-- Also update the view policy to explicitly check admin roles
DROP POLICY IF EXISTS "Admins can view messages" ON admin_channel_messages;

CREATE POLICY "Admins can view messages" ON admin_channel_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN (
                'admin', 
                'technical_admin', 
                'operations_admin', 
                'marketing_admin', 
                'cto', 
                'coo', 
                'ceo', 
                'cofounder'
            )
        )
    );

-- Update channels view policy
DROP POLICY IF EXISTS "Admins can view channels" ON admin_channels;

CREATE POLICY "Admins can view channels" ON admin_channels
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN (
                'admin', 
                'technical_admin', 
                'operations_admin', 
                'marketing_admin', 
                'cto', 
                'coo', 
                'ceo', 
                'cofounder'
            )
        )
    );

-- ========================================
-- PART 3: Retroactively Verify Existing CEO/Admin Accounts
-- ========================================

-- Verify all existing CEO and admin accounts
UPDATE public.users
SET is_verified = TRUE, beta_status = 'approved'
WHERE role IN (
    'ceo', 
    'admin', 
    'technical_admin', 
    'operations_admin', 
    'marketing_admin', 
    'cto', 
    'coo', 
    'cofounder'
)
AND is_verified = FALSE;

-- Log the change
DO $$
DECLARE
    updated_count INTEGER;
BEGIN
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RAISE NOTICE 'Auto-verified % admin/executive accounts', updated_count;
END $$;
```

**Click "Run"** in the SQL Editor.

### Step 2: Refresh Your Browser
1. Close the Operations Admin page
2. Re-open it
3. The CEO account should now show as **VERIFIED** ✅
4. The "Verify" button should now be visible for unverified users
5. Operations Admin can now send messages in Executive Chat

## ✨ What Changed:

### 1. Users Manager (Identity Nexus)
- **NEW:** Green "Verify" button appears inline for unverified users
- Operations Admin can now click it directly without dropdown hunting
- CEO and all admin roles now auto-verify on account creation

### 2. Executive Chat
- Operations Admin can now send and receive messages
- All admin roles have equal chat privileges
- RLS policies updated to explicitly allow operations_admin

### 3. Auto-Verification
- **CEO accounts** → Auto-verified ✅
- **All admin roles** → Auto-verified ✅
- **.edu.ng emails** → Auto-verified ✅
- **@marketbridge.com.ng emails** → Auto-verified ✅

## Need Help?
If the CEO account still shows "UNVERIFIED" after Step 1:
- Run this manual query in Supabase SQL Editor:
```sql
UPDATE users SET is_verified = TRUE WHERE role = 'ceo';
```

---
**Created:** 2026-02-17  
**Priority:** URGENT  
**Status:** Ready to Deploy
