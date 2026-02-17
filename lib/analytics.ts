
import { createClient } from '@/lib/supabase/client';

export type CEOStats = {
    gmv: number;
    activeDealers: number;
    totalUsers: number;
    activeListings: number;
    trustScore: number;
};

export type Proposal = {
    id: string;
    title: string;
    description: string;
    category: string;
    priority: string;
    status: 'pending' | 'approved' | 'declined';
    author_id: string;
    created_at: string;
    impact?: string;
    admin_name?: string; // joined or fetched
};

export async function fetchCEOStats(): Promise<CEOStats> {
    const supabase = createClient();

    // 1. GMV: Sum of completed orders
    const { data: orders } = await supabase
        .from('orders')
        .select('total_amount, status')
        .eq('status', 'completed');

    const gmv = orders?.reduce((sum, order) => sum + (Number(order.total_amount) || 0), 0) || 0;

    // 2. Active Dealers
    const { count: activeDealers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'dealer')
        .eq('is_verified', true);

    // 3. Total Users
    const { count: totalUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

    // 4. Active Listings
    const { count: activeListings } = await supabase
        .from('listings')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

    // 5. Trust Score (Mocked logic based on disputes vs orders for now, as dispute table might be empty)
    // If disputes table exists:
    const { count: disputesCount } = await supabase
        .from('disputes')
        .select('*', { count: 'exact', head: true });

    const { count: totalOrders } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true });

    let trustScore = 100;
    if (totalOrders && totalOrders > 0) {
        const disputeRate = (disputesCount || 0) / totalOrders;
        trustScore = Math.max(0, 100 - (disputeRate * 100));
    }

    return {
        gmv,
        activeDealers: activeDealers || 0,
        totalUsers: totalUsers || 0,
        activeListings: activeListings || 0,
        trustScore
    };
}

export async function fetchProposals(): Promise<Proposal[]> {
    const supabase = createClient();

    // We try to fetch from 'proposals' table.
    // If it doesn't exist, this will throw/return error, which the caller should handle.
    const { data, error } = await supabase
        .from('proposals')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching proposals (Table might be missing):", error);
        return [];
    }

    return data as Proposal[];
}

export async function createProposal(proposalData: Omit<Proposal, 'id' | 'created_at' | 'status'>) {
    const supabase = createClient();

    // admin_name is for UI only, remove it before DB insert
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { admin_name, ...dbPayload } = proposalData;

    const { data, error } = await supabase
        .from('proposals')
        .insert([{
            ...dbPayload,
            status: 'pending'
        }])
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function updateProposalStatus(id: string, status: 'approved' | 'declined') {
    const supabase = createClient();
    const { error } = await supabase
        .from('proposals')
        .update({ status })
        .eq('id', id);

    if (error) throw error;
}
