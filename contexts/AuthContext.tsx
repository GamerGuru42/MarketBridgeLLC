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
    signInWithGoogle: () => Promise<void>;
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

    const fetchUserProfile = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) {
                console.error('Error fetching user profile:', error);
                // If profile doesn't exist yet (e.g. just signed up), we might want to create it or wait
                // For now, we'll just set loading to false
            } else {
                // Map Supabase user to our User type (include both id and _id for compatibility)
                const mappedUser = {
                    ...data,
                    _id: data.id, // Map id to _id for backwards compatibility
                    displayName: data.display_name,
                    phone_number: data.phone_number,
                    photoURL: data.photo_url,
                    isVerified: data.is_verified,
                    storeType: data.store_type,
                    businessName: data.business_name,
                    subscriptionPlan: data.subscription_plan,
                    subscriptionStatus: data.subscription_status,
                    subscriptionStartDate: data.subscription_start_date,
                    subscriptionEndDate: data.subscription_end_date,
                    subscription_expires_at: data.subscription_expires_at,
                    trial_start_date: data.trial_start_date,
                    listingLimit: data.listing_limit,
                };
                setUser(mappedUser as User);
            }
        } catch (error) {
            console.error('Unexpected error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const signInWithGoogle = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent',
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
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        setUser(null);
        setSessionUser(null);
        window.location.href = '/'; // Redirect to home
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
