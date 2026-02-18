import { SubscriptionPlanId, SubscriptionStatus } from './subscription';

export interface User {
    id: string; // Supabase UUID
    _id: string; // Legacy MongoDB ID (for backwards compatibility)
    email: string;
    displayName: string;
    role: 'customer' | 'dealer' | 'admin' | 'ceo' | 'cofounder' | 'cto' | 'coo' | 'technical_admin' | 'operations_admin' | 'marketing_admin' | 'student_buyer' | 'student_seller';
    phone_number?: string;
    photoURL?: string;
    location?: string;
    isVerified?: boolean;
    storeType?: string;
    businessName?: string;
    cacNumber?: string;
    wishlist?: string[];
    subscriptionPlan?: SubscriptionPlanId;
    subscriptionStatus?: SubscriptionStatus;
    subscriptionStartDate?: string;
    subscriptionEndDate?: string;
    subscription_expires_at?: string;
    trial_start_date?: string;
    listingLimit?: number;
    university?: string;
    email_verified?: boolean;
    last_otp_sent?: string;
    otp_attempts?: number;
}

export interface FirestoreUser {
    id: string;
    email: string;
    password: string;
    displayName: string;
    role: string;
    location: string;
    photoURL: string;
    isVerified: boolean;
    storeType: string | null;
    businessName: string | null;
    flutterwaveId: string | null;
    verificationDocuments: string[];
    googleId: string | null;
    wishlist: string[];
    createdAt: string;
    subscriptionPlan: SubscriptionPlanId;
    subscriptionStatus: SubscriptionStatus;
    subscriptionStartDate: string | null;
    subscriptionEndDate: string | null;
    listingLimit: number;
}
