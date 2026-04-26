'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
const supabase = createClient();
import { User as SupabaseUser } from '@supabase/supabase-js';
import { User } from '@/types/user';

interface AuthContextType {
    user: User | null; // My application user
    sessionUser: SupabaseUser | null; // Supabase auth user
    loading: boolean;
    signInWithGoogle: (redirectTo?: string) => Promise<void>;
    signInWithFacebook: () => Promise<void>;
    logout: () => Promise<void>; // Renamed from signOut to match existing usage
    refreshUser: (userId?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [sessionUser, setSessionUser] = useState<SupabaseUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check active session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSessionUser(session?.user ?? null);
            if (session?.user) {
                fetchUserProfile(session.user.id);
            } else {
                setLoading(false);
            }
        });

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSessionUser(session?.user ?? null);
            if (session?.user) {
                fetchUserProfile(session.user.id);
            } else {
                setUser(null);
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchUserProfile = async (userId: string, retryCount = 0) => {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();

            const ADMIN_ROLES = ['admin', 'technical_admin', 'operations_admin', 'marketing_admin', 'ceo', 'cofounder', 'cto', 'coo', 'systems_admin', 'it_support'];
            
            // Check for Admin Intent via cookies (client-side)
            const getCookie = (name: string) => {
                const value = `; ${document.cookie}`;
                const parts = value.split(`; ${name}=`);
                if (parts.length === 2) return parts.pop()?.split(';').shift();
                return null;
            };

            const hasAdminIntent = getCookie('mb_oauth_role') || getCookie('mb-admin-session');

            if (error) {
                // If record not found and we have retries left, wait and retry
                // PGRST116 is Supabase/PostgREST code for "No rows found"
                if (error.code === 'PGRST116' && retryCount < 5) {
                    console.log(`Profile search retry ${retryCount + 1} (Missing Record)...`);
                    await new Promise(resolve => setTimeout(resolve, 800)); 
                    return fetchUserProfile(userId, retryCount + 1);
                }

                console.error('Error fetching user profile:', error);
                setUser(null);
            } else {
                // RACE CONDITION PROTECTION:
                // If the user has Admin intent but the DB returns 'buyer', 
                // the profile update hasn't propagated yet. We MUST re-check.
                const dbRole = data?.role;
                if (hasAdminIntent && (!dbRole || !ADMIN_ROLES.includes(dbRole)) && retryCount < 4) {
                    console.warn(`Race Condition Detected: User has Admin Intent but DB role is "${dbRole}". Retrying sync ${retryCount + 1}/4...`);
                    await new Promise(resolve => setTimeout(resolve, 1200)); // Wait 1.2s for DB consistency
                    return fetchUserProfile(userId, retryCount + 1);
                }

                // Map Supabase user to our User type (include both id and _id for compatibility)
                const mappedUser = {
                    ...data,
                    _id: data.id,
                    displayName: data.display_name,
                    phone_number: data.phone_number,
                    photoURL: data.photo_url,
                    isVerified: data.is_verified,
                    storeType: data.store_type,
                    businessName: data.business_name,
                    subscriptionPlan: data.subscription_plan_id,
                    subscriptionStatus: data.subscription_status,
                    subscriptionStartDate: data.subscription_start_date,
                    subscriptionEndDate: data.subscription_end_date,
                    subscription_expires_at: data.subscription_expires_at,
                    trial_start_date: data.trial_start_date,
                    listingLimit: data.listing_limit,
                    university: data.university,
                    email_verified: data.email_verified,
                    last_otp_sent: data.last_otp_sent,
                    otp_attempts: data.otp_attempts,
                    coins_balance: data.coins_balance,
                    referral_link_code: data.referral_link_code,
                };
                setUser(mappedUser as User);
            }
        } catch (error) {
            console.error('Unexpected error fetching profile:', error);
        } finally {
            // Only stop loading if we have mapped a user or exhausted retries
            // Use retryCount check to ensure we don't flash 'buyer' layout during sync
            if (retryCount === 0 || user) {
                setLoading(false);
            }
        }
    };

    const signInWithGoogle = async (redirectTo?: string) => {
        if (redirectTo) {
            try {
                const url = new URL(redirectTo);
                const roleParam = url.searchParams.get('role');
                const nextParam = url.searchParams.get('next');
                const domainSuffix = window.location.hostname.includes('marketbridge.com.ng') 
                    ? '; domain=.marketbridge.com.ng' 
                    : '';
                
                if (roleParam) {
                    document.cookie = `mb_oauth_role=${roleParam}; path=/; max-age=600${domainSuffix}`;
                }
                if (nextParam) {
                    document.cookie = `mb_oauth_next=${encodeURIComponent(nextParam)}; path=/; max-age=600${domainSuffix}`;
                }
            } catch (e) { /* ignore */ }
        }
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: redirectTo || `${window.location.origin}/auth/callback`,
                queryParams: {
                    access_type: 'offline',
                    prompt: 'select_account',
                },
            },
        });
        if (error) throw error;
    };

    const signInWithFacebook = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'facebook',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        });
        if (error) throw error;
    };

    const logout = async () => {
        // 1. Forcibly destroy custom admin session cookies across all possible domains
        document.cookie = 'mb-admin-session=; path=/; max-age=0';
        document.cookie = 'mb-admin-session=; path=/; domain=.marketbridge.com.ng; max-age=0';

        // 2. Forcibly target and destroy Supabase Auth ghost cookies 
        // (@supabase/ssr sometimes fails to clear wildcard domain cookies properly)
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.startsWith('sb-')) {
                const name = cookie.split('=')[0];
                document.cookie = `${name}=; path=/; max-age=0`;
                document.cookie = `${name}=; path=/; domain=.marketbridge.com.ng; max-age=0`;
                document.cookie = `${name}=; path=/; domain=${window.location.hostname}; max-age=0`;
            }
        }
        
        // 3. Clear Supabase local memory
        try {
            await supabase.auth.signOut();
        } catch (error) {
            console.warn('Supabase soft signout error (cookies already dropped):', error);
        }

        // 4. Reset React Context
        setUser(null);
        setSessionUser(null);

        // 5. Intelligent Redirect (HQ Portal vs Public Root)
        if (typeof window !== 'undefined' && window.location.hostname.startsWith('hq.')) {
            window.location.href = '/portal/login';
        } else {
            window.location.href = '/'; 
        }
    };

    const refreshUser = async (userId?: string) => {
        const id = userId || sessionUser?.id;
        if (id) {
            await fetchUserProfile(id);
        }
    };

    return (
        <AuthContext.Provider value={{ user, sessionUser, loading, signInWithGoogle, signInWithFacebook, logout, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
