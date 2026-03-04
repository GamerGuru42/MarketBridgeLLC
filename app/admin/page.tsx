'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Loader2, ShieldCheck, XCircle, Search, UserCheck, Check, AlertTriangle, ChevronRight, Activity
} from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import Image from 'next/image';

interface Application {
    id: string;
    user_id: string;
    name: string;
    email: string;
    phone: string;
    campus: string;
    business_type: string;
    categories: string[];
    id_card_url: string;
    bio: string;
    status: string;
    created_at: string;
}

export default function AdminOperationsPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const supabase = createClient();
    const { toast } = useToast();

    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const [actioningId, setActioningId] = useState<string | null>(null);
    const [search, setSearch] = useState('');

    useEffect(() => {
        if (!authLoading && (!user || (user.role !== 'admin' && user.role !== 'ceo' && user.role !== 'cofounder' && user.role !== 'operations_admin'))) {
            router.replace('/login');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (user) fetchApplications();
    }, [user]);

    const fetchApplications = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('seller_applications')
            .select('*')
            .eq('status', 'pending')
            .order('created_at', { ascending: false });

        if (!error && data) {
            setApplications(data);
        }
        setLoading(false);
    };

    const handleAction = async (app: Application, act: 'approve' | 'reject') => {
        if (act === 'reject') {
            const reason = prompt("Enter reason for rejection:");
            if (reason === null) return; // cancelled
        }

        setActioningId(app.id);

        try {
            // Update application status
            await supabase
                .from('seller_applications')
                .update({ status: act === 'approve' ? 'approved' : 'rejected' })
                .eq('id', app.id);

            // If approved, update user role
            if (act === 'approve') {
                await supabase
                    .from('users')
                    .update({ is_verified: true, role: 'seller' })
                    .eq('id', app.user_id);
            }

            // Remove from local state
            setApplications(prev => prev.filter(a => a.id !== app.id));
        } catch (error) {
            toast('Action failed. Please check your connection and try again.', 'error');
        } finally {
            setActioningId(null);
        }
    };

    if (authLoading || loading) return (
        <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-[#FF6200]" />
        </div>
    );

    const filtered = applications.filter(a =>
        (a.name?.toLowerCase().includes(search.toLowerCase())) ||
        (a.email?.toLowerCase().includes(search.toLowerCase())) ||
        (a.campus?.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <div className="min-h-screen bg-[#FAFAFA] text-zinc-900 selection:bg-[#FF6200] selection:text-white pt-28 pb-20">
            <div className="container px-6 mx-auto max-w-7xl space-y-12">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-zinc-200 pb-8">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <span className="h-2 w-2 rounded-full bg-[#FF6200] animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500">Operations Node</span>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter italic">
                            Pending <span className="text-[#FF6200]">Approvals</span>
                        </h1>
                        <p className="text-zinc-500 font-medium italic">
                            {applications.length} applications requiring manual review.
                        </p>
                    </div>
                </div>

                {/* Main Operations Block */}
                <div className="bg-white border border-zinc-200 rounded-[2rem] shadow-sm p-4 md:p-8">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
                        <h3 className="text-lg font-black uppercase tracking-widest text-zinc-900 flex items-center gap-2">
                            <Activity className="h-4 w-4 text-[#FF6200]" /> Verification Queue
                        </h3>
                        <div className="relative w-full sm:w-auto">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                            <input
                                type="text"
                                placeholder="Search by name, email, or campus..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full sm:w-80 h-12 bg-zinc-50 border border-zinc-200 rounded-full pl-12 pr-4 text-sm font-medium focus:outline-none focus:border-[#FF6200]/50"
                            />
                        </div>
                    </div>

                    {filtered.length === 0 ? (
                        <div className="text-center py-20 border-2 border-dashed border-zinc-100 rounded-[2rem]">
                            <UserCheck className="h-12 w-12 text-zinc-300 mx-auto mb-4" />
                            <h4 className="text-zinc-500 font-black uppercase tracking-widest">Zero Pending Applications</h4>
                        </div>
                    ) : (
                        <div className="overflow-x-auto rounded-2xl border border-zinc-100">
                            <table className="w-full text-left border-collapse min-w-[800px]">
                                <thead>
                                    <tr className="bg-zinc-50 border-b border-zinc-100 text-[10px] uppercase font-black tracking-widest text-zinc-500">
                                        <th className="p-4">Applicant Data</th>
                                        <th className="p-4">Campus / Biz Type</th>
                                        <th className="p-4">Categories</th>
                                        <th className="p-4">ID Card</th>
                                        <th className="p-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map(app => (
                                        <tr key={app.id} className="border-b border-zinc-100 hover:bg-zinc-50/50 transition-colors">
                                            <td className="p-4">
                                                <div className="font-bold text-sm text-zinc-900">{app.name}</div>
                                                <div className="text-xs text-zinc-500">{app.email}</div>
                                                <div className="text-xs text-zinc-500 mt-1">{app.phone}</div>
                                            </td>
                                            <td className="p-4">
                                                <Badge className="bg-[#FF6200]/10 text-[#FF6200] border-none mb-1 shadow-none">{app.campus}</Badge>
                                                <div className="text-xs text-zinc-600 font-medium capitalize">{app.business_type}</div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex flex-wrap gap-1">
                                                    {(app.categories || []).map(c => (
                                                        <span key={c} className="text-[9px] bg-zinc-100 text-zinc-600 px-2 py-1 rounded-md font-bold uppercase tracking-wider">{c}</span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                {app.id_card_url ? (
                                                    <a href={app.id_card_url} target="_blank" rel="noopener noreferrer" aria-label="View uploaded ID card" className="block relative w-20 h-12 bg-zinc-100 rounded-lg overflow-hidden border border-zinc-200 hover:border-[#FF6200] transition-colors group">
                                                        <Image src={app.id_card_url} alt="ID" fill className="object-cover opacity-80 group-hover:opacity-100" />
                                                    </a>
                                                ) : <span className="text-xs text-zinc-400 italic">No Upload</span>}
                                            </td>
                                            <td className="p-4 text-right space-x-2 whitespace-nowrap">
                                                <Button
                                                    size="sm"
                                                    disabled={actioningId === app.id}
                                                    onClick={() => handleAction(app, 'approve')}
                                                    className="bg-green-600 hover:bg-green-700 text-white font-black uppercase text-[10px] tracking-widest h-9"
                                                >
                                                    {actioningId === app.id ? <Loader2 className="h-3 w-3 animate-spin mx-4" /> : 'Approve'}
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    disabled={actioningId === app.id}
                                                    onClick={() => handleAction(app, 'reject')}
                                                    className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 font-black uppercase text-[10px] tracking-widest h-9"
                                                >
                                                    {actioningId === app.id ? <Loader2 className="h-3 w-3 animate-spin mx-4" /> : 'Reject'}
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
