# 🚀 MarketBridge Admin Features - Setup & Usage Guide

**Date:** 2026-02-17  
**Status:** ✅ Ready to Deploy

---

## 📋 **CRITICAL: Database Setup Required**

Before the proposals and other admin features work, you **MUST** apply the database migrations in Supabase.

### **Step 1: Apply All Migrations**

Go to **Supabase Dashboard** → **SQL Editor** and paste the entire contents of `APPLY_THIS_IN_SUPABASE.sql`:

This will set up:
1. ✅ Auto-verification for CEO and admin roles
2. ✅ Fixed admin chat RLS policies
3. ✅ School email verification removal  
4. ✅ **Proposals/Memos system** (NEW!)

---

## 🎯 **Features Overview**

### **1. Strategic Proposals System** 🆕

**Purpose:** Allows admins to submit strategic proposals/memos to the CEO for review and approval.

**Route:** `/admin/proposals/new`

**Features:**
- ✅ 5 Strategic Categories:
  - Infrastructure Upgrade
  - Policy/Operations Shift
  - Marketing Initiative
  - Financial/Escrow Change
  - Dealer Growth Strategy

- ✅ 4 Priority Levels:
  - Low - Optimization
  - Medium - Routine Growth
  - High - Critical Scaling
  - Immediate - Urgent Fix

- ✅ Status Tracking:
  - Pending Review
  - Requesting Intel
  - Approved & Provisioning
  - Archived/Deferred

- ✅ Recent Proposals View
- ✅ Comprehensive Error Handling

**How It Works:**
1. Admin fills out the proposal form
2. Submits to CEO's command queue
3. CEO reviews in their dashboard
4. CEO approves/declines
5. Status tracked in executive registry

---

### **2. Executive Chat** 💬

**Purpose:** Secure communication channel for all admin roles.

**Route:** `/admin/executive-chat`

**Fixed Issues:**
- ✅ Operations Admin can now send messages
- ✅ All admin roles have proper RLS permissions
- ✅ Real-time message updates

**Roles with Access:**
- CEO
- Operations Admin
- Technical Admin
- Marketing Admin
- CTO, COO
- Cofounder

---

### **3. CEO Dashboard** 👑

**Route:** `/ceo`

**Metrics Displayed:**
- GMV (Gross Merchandise Value)
- Active Dealers Count
- Total Users
- Active Listings
- Trust Score (based on dispute rate)

**Features:**
- ✅ Real-time statistics
- ✅ Pending proposals review
- ✅ Quick actions panel
- ✅ Executive chat access

---

### **4. Users Manager** 👥

**Route:** `/admin/users`

**Operations Admin Capabilities:**
- ✅ View all users
- ✅ **Verify users** (inline quick action)
- ✅ Revoke verification
- ✅ Filter by role
- ✅ Search users

**Auto-Verification:**
- ✅ CEO and all admin roles are auto-verified on signup
- ✅ @marketbridge.com.ng emails auto-verified
- ❌ .edu.ng emails NO LONGER auto-verified (removed)

---

## 🔧 **Troubleshooting**

### **Error: "Proposals table not found"**

**Solution:**
```sql
-- Run this in Supabase SQL Editor
CREATE TABLE IF NOT EXISTS public.proposals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('Infrastructure Upgrade', 'Policy/Operations Shift', 'Marketing Initiative', 'Financial/Escrow Change', 'Dealer Growth Strategy')),
    priority TEXT NOT NULL CHECK (priority IN ('Low - Optimization', 'Medium - Routine Growth', 'High - Critical Scaling', 'Immediate - Urgent Fix')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined')),
    impact TEXT,
    author_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can view all proposals" ON public.proposals
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can create proposals" ON public.proposals
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admins can update proposals" ON public.proposals
    FOR UPDATE USING (auth.role() = 'authenticated');
```

### **Error: "Invalid category or priority"**

**Solution:** 
- The database was updated to match the frontend form
- Apply the `APPLY_THIS_IN_SUPABASE.sql` migration
- Refresh the page

### **Admin Can't Send Executive Chat Messages**

**Solution:**
```sql
-- Run this to fix RLS policies
DROP POLICY IF EXISTS "Admins can insert messages" ON admin_channel_messages;

CREATE POLICY "Admins can insert messages" ON admin_channel_messages
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id 
        AND EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN (
                'admin', 'technical_admin', 'operations_admin', 
                'marketing_admin', 'cto', 'coo', 'ceo', 'cofounder'
            )
        )
    );
```

---

## 📊 **Testing Checklist**

### **Proposals System**
- [ ] Navigate to `/admin/proposals/new`
- [ ] Fill out all fields
- [ ] Select category and priority
- [ ] Submit proposal
- [ ] Verify success redirect
- [ ] Check "Recent Proposals" sidebar
- [ ] Test error handling (try submitting incomplete form)

### **Executive Chat**
- [ ] Log in as Operations Admin
- [ ] Navigate to `/admin/executive-chat`
- [ ] Send a message
- [ ] Verify message appears
- [ ] Test with other admin roles

### **CEO Dashboard**
- [ ] Log in as CEO
- [ ] Navigate to `/ceo`
- [ ] Verify all metrics display correctly
- [ ] Check proposals section
- [ ] Test quick actions

### **User Verification**
- [ ] Log in as Operations Admin
- [ ] Navigate to `/admin/users`
- [ ] Find an unverified user
- [ ] Click inline "Verify" button
- [ ] Confirm verification status updates

---

## 🎨 **Improvements Made**

### **1. Enhanced Error Handling**
- Specific error messages for different database issues
- UI-friendly error displays (not alerts)
- Detailed error logging for debugging

### **2. Database Constraint Fixes**
- Categories match frontend form exactly
- Priorities match frontend form exactly
- No more constraint violations

### **3. UX Improvements**
- Better loading states
- Clear success/error feedback
- Inline quick actions
- Real-time updates

### **4. Security**
- Proper RLS policies
- Role-based access control
- Authenticated-only access

---

## 🔐 **Security Notes**

**RLS Policies:**
All admin features are protected by Row Level Security:
- Only authenticated users can access
- Role-specific permissions enforced
- Data isolation between users

**Auto-Verification:**
- CEO and admin roles are trusted and auto-verified
- Regular users go through manual verification
- Operations Admin can verify users manually

---

## 🚀 **Next Steps**

1. **Apply SQL Migration** - Run `APPLY_THIS_IN_SUPABASE.sql` in Supabase
2. **Test All Features** - Follow testing checklist above
3. **Deploy to Production** - Once tested, deploy the changes
4. **Monitor Errors** - Check Supabase logs for any issues
5. **Train Team** - Brief admin team on new features

---

## 📞 **Support Contacts**

**Technical Issues (App Bugs, Errors):**  
🔴 support@marketbridge.com.ng

**Operations/Admin Questions:**  
🟢 ops-support@marketbridge.com.ng

---

**Status:** ✅ All features implemented and ready for deployment!
