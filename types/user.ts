export type SubscriptionPlan = 'starter' | 'professional' | 'enterprise';
export type SubscriptionStatus = 'active' | 'inactive' | 'trial' | 'expired';

export interface User {
    id: string; // Supabase UUID
    _id: string; // Legacy MongoDB ID (for backwards compatibility)
    email: string;
    displayName: string;
    role: string;
    photoURL?: string;
    location?: string;
    isVerified?: boolean;
    storeType?: string;
    businessName?: string;
    wishlist?: string[];
    subscriptionPlan?: SubscriptionPlan;
    subscriptionStatus?: SubscriptionStatus;
    subscriptionStartDate?: string;
    subscriptionEndDate?: string;
    listingLimit?: number;
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
    subscriptionPlan: SubscriptionPlan;
    subscriptionStatus: SubscriptionStatus;
    subscriptionStartDate: string | null;
    subscriptionEndDate: string | null;
    listingLimit: number;
}
