'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, UserCheck, ShieldCheck, Crown, Banknote, MessageSquare, ShieldAlert, Scale, Inbox, Activity, ChevronRight, Eye, Users, Flag, Zap, AlertTriangle, Lock, Unlock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function OperationsAdminPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);

    const [pendingSellers, setPendingSellers] = useState<any[]>([]);
    const [allSellers, setAllSellers] = useState<any[]>([]);
    const [ambassadorApps, setAmbassadorApps] = useState<any[]>([]);
    const [disputes, setDisputes] = useState<any[]>([]);
    const [escrowTransactions, setEscrowTransactions] = useState<any[]>([]);
    const [supportTickets, setSupportTickets] = useState<any[]>([]);
    const [feedback, setFeedback] = useState<any[]>([]);
    const [revenue, setRevenue] = useState<{ transactions: any[], totalVolume: number, totalCommission: number }>({
        transactions: [], totalVolume: 0, totalCommission: 0
    });

    // Filters
    const [sellerUniFilter, setSellerUniFilter] = useState('all');
    const [sellerPlanFilter, setSellerPlanFilter] = useState('all');

    useEffect(() => {
        const ALLOWED = ['admin', 'operations_admin', 'ceo', 'cofounder'];
        if (!authLoading && (!user || !ALLOWED.includes(user.role))) {
            router.replace('/portal/login');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (user) fetchOpsData();
    }, [user]);

    const fetchOpsData = async () => {
        try {
            // Pending sellers
            const { data: sellers } = await supabase
                .from('seller_applications')
                .select('*')
                .eq('status', 'pending')
                .order('created_at', { ascending: false });
            if (sellers) setPendingSellers(sellers);

            // All sellers
            const { data: allS } = await supabase
                .from('users')
                .select('*, subscriptions(plan_id, status)')
                .in('role', ['seller', 'student_seller', 'dealer'])
                .order('created_at', { ascending: false });
            if (allS) setAllSellers(allS);

            // Ambassador applications
            const { data: ambApps } = await supabase
                .from('ambassador_applications')
                .select('*')
                .order('created_at', { ascending: false });
            if (ambApps) setAmbassadorApps(ambApps);

            // Escrow / transactions
            const { data: txns } = await supabase
                .from('sales_transactions')
                .select('*, buyer:users!sales_transactions_buyer_id_fkey(email), seller:users!sales_transactions_seller_id_fkey(display_name)')
                .order('created_at', { ascending: false });
            if (txns) {
                const totalVolume = txns.reduce((sum, t) => sum + Number(t.amount_total || 0), 0);
                const totalCommission = txns.reduce((sum, t) => sum + Number(t.amount_platform || 0), 0);
                setRevenue({ transactions: txns, totalVolume, totalCommission });
                setEscrowTransactions(txns.filter(t => t.status === 'escrow_held' || t.status === 'pending'));
            }

            // Support tickets
            const { data: tickets } = await supabase
                .from('support_tickets')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(20);
            if (tickets) setSupportTickets(tickets);

            // Feedback
            const { data: fb } = await supabase
                .from('feedbacks')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(30);
            if (fb) setFeedback(fb);

        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (applicationId: string) => {
        try {
            const res = await fetch('/api/admin/approve-seller', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ applicationId })
            });
            if (res.ok) {
                toast('Seller approved successfully!', 'success');
                fetchOpsData();
            } else {
                toast('Approval failed', 'error');
            }
        } catch (e) {
            toast('Operation error', 'error');
        }
    };

    // Filter sellers
    const filteredSellers = allSellers.filter(s => {
        if (sellerUniFilter !== 'all') {
            const email = s.email?.toLowerCase() || '';
            if (sellerUniFilter === 'baze' && !email.includes('baze')) return false;
            if (sellerUniFilter === 'nile' && !email.includes('nile')) return false;
            if (sellerUniFilter === 'veritas' && !email.includes('veritas')) return false;
            if (sellerUniFilter === 'cosmopolitan' && !email.includes('cosmopolitan')) return false;
        }
        return true;
    });

    if (authLoading || loading) return (
        <div className="flex justify-center items-center h-screen bg-background">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
    );

    return (
        <div className="min-h-screen bg-background text-foreground p-4 md:p-10 space-y-12 relative overflow-x-hidden">
            {/* Header */}
            <div className="relative z-10 flex flex-col gap-6">
                <div className="flex items-center gap-3">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground">Operations Dashboard</span>
                </div>
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                    <div className="space-y-4">
                        <h1 className="text-4xl md:text-7xl font-black uppercase tracking-tighter italic font-heading leading-none">
                            Verification & <span className="text-primary">Logistics</span>
                        </h1>
                        <p className="text-muted-foreground text-xs font-black uppercase tracking-widest opacity-60 max-w-2xl">
                            Disputes // Seller management // Ambassadors // Escrow oversight // Support tickets
                        </p>
                    </div>
                    <Badge variant="outline" className="h-14 px-6 rounded-2xl border-border bg-card shadow-sm flex items-center gap-4">
                        <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-widest">ADMIN-OPS-{user?.id?.slice(0, 4).toUpperCase()}</span>
                    </Badge>
                </div>
            </div>

            <Tabs defaultValue="disputes" className="space-y-12 relative z-10 w-full">
                <TabsList className="bg-card border border-border rounded-3xl p-2 h-auto md:h-20 w-full overflow-x-auto no-scrollbar shadow-sm flex flex-wrap md:flex-nowrap gap-1">
                    {[
                        { val: 'disputes', label: 'Disputes', icon: Scale },
                        { val: 'sellers', label: 'Sellers', icon: Users },
                        { val: 'ambassadors', label: 'Ambassadors', icon: Crown },
                        { val: 'pending', label: 'Approvals', count: pendingSellers.length, icon: UserCheck },
                        { val: 'godmode', label: 'God Mode', icon: Zap },
                        { val: 'tickets', label: 'Tickets', icon: MessageSquare },
                        { val: 'escrow', label: 'Escrow', icon: Banknote },
                        { val: 'flags', label: 'Flags', icon: Flag },
                    ].map((tab) => (
                        <TabsTrigger
                            key={tab.val}
                            value={tab.val}
                            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-muted-foreground uppercase font-black text-[9px] tracking-widest h-16 rounded-2xl transition-all px-4 md:px-6 flex items-center gap-2 border-none"
                        >
                            <tab.icon className="h-4 w-4" />
                            {tab.label} {tab.count !== undefined && <span className="opacity-50">({tab.count})</span>}
                        </TabsTrigger>
                    ))}
                </TabsList>

                {/* Dispute Resolution Centre */}
                <TabsContent value="disputes" className="space-y-6">
                    <Card className="bg-card border-border rounded-[2.5rem] overflow-hidden">
                        <CardHeader className="bg-muted/10 py-10 px-10 border-b border-border">
                            <CardTitle className="text-2xl font-black uppercase italic tracking-tighter">Dispute <span className="text-primary">Resolution Centre</span></CardTitle>
                            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-1 opacity-60">Freeze/release escrow, review Terms Builder evidence</p>
                        </CardHeader>
                        <CardContent className="p-6 md:p-10">
                            {escrowTransactions.length === 0 ? (
                                <div className="text-center py-20 opacity-20">
                                    <Scale className="h-12 w-12 mx-auto mb-4" />
                                    <p className="text-[10px] font-black uppercase tracking-widest">No active disputes</p>
                                </div>
                            ) : escrowTransactions.map(txn => (
                                <div key={txn.id} className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 bg-muted/30 rounded-2xl border border-border/50 mb-4 gap-4">
                                    <div>
                                        <p className="font-black text-sm">{txn.paystack_reference || 'TX-' + txn.id?.slice(0, 8)}</p>
                                        <p className="text-[10px] text-muted-foreground font-bold mt-1">₦{Number(txn.amount_total || 0).toLocaleString()} • {txn.seller?.display_name || 'Seller'}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button size="sm" className="bg-red-500/10 text-red-500 border border-red-500/20 rounded-lg h-9 px-4 text-[9px] font-black uppercase">
                                            <Lock className="h-3 w-3 mr-1" /> Freeze Escrow
                                        </Button>
                                        <Button size="sm" className="bg-green-500/10 text-green-500 border border-green-500/20 rounded-lg h-9 px-4 text-[9px] font-black uppercase">
                                            <Unlock className="h-3 w-3 mr-1" /> Release
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Seller Management */}
                <TabsContent value="sellers" className="space-y-6">
                    <div className="flex flex-wrap gap-3 mb-4">
                        <select value={sellerUniFilter} onChange={e => setSellerUniFilter(e.target.value)} className="h-10 px-4 rounded-xl bg-secondary border border-border text-sm font-bold">
                            <option value="all">All Universities</option>
                            <option value="baze">Baze University</option>
                            <option value="nile">Nile University</option>
                            <option value="veritas">Veritas University</option>
                            <option value="cosmopolitan">Cosmopolitan University</option>
                        </select>
                    </div>
                    <Card className="bg-card border-border rounded-[2.5rem] overflow-hidden">
                        <CardHeader className="bg-muted/10 py-10 px-10 border-b border-border">
                            <CardTitle className="text-2xl font-black uppercase italic tracking-tighter">Seller <span className="text-primary">Management</span></CardTitle>
                            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-1 opacity-60">{filteredSellers.length} sellers found</p>
                        </CardHeader>
                        <CardContent className="p-6 md:p-10 space-y-4">
                            {filteredSellers.length === 0 ? (
                                <div className="text-center py-20 opacity-20">
                                    <Users className="h-12 w-12 mx-auto mb-4" />
                                    <p className="text-[10px] font-black uppercase tracking-widest">No sellers match filters</p>
                                </div>
                            ) : filteredSellers.slice(0, 20).map(seller => (
                                <div key={seller.id} className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 bg-muted/30 rounded-2xl border border-border/50 gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black text-xs">
                                            {(seller.email?.[0] || '?').toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-black text-sm">{seller.display_name || seller.email}</p>
                                            <p className="text-[10px] text-muted-foreground font-bold">{seller.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button size="sm" variant="outline" className="text-green-500 border-green-500/20 text-[9px] font-black uppercase rounded-lg h-9 px-4">Approve</Button>
                                        <Button size="sm" variant="outline" className="text-yellow-500 border-yellow-500/20 text-[9px] font-black uppercase rounded-lg h-9 px-4">Suspend</Button>
                                        <Button size="sm" variant="outline" className="text-red-500 border-red-500/20 text-[9px] font-black uppercase rounded-lg h-9 px-4">Revoke</Button>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Ambassador Management */}
                <TabsContent value="ambassadors" className="space-y-6">
                    <Card className="bg-card border-border rounded-[2.5rem] overflow-hidden">
                        <CardHeader className="bg-muted/10 py-10 px-10 border-b border-border">
                            <CardTitle className="text-2xl font-black uppercase italic tracking-tighter">Ambassador <span className="text-primary">Management</span></CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 md:p-10 space-y-4">
                            {ambassadorApps.length === 0 ? (
                                <div className="text-center py-20 opacity-20">
                                    <Crown className="h-12 w-12 mx-auto mb-4" />
                                    <p className="text-[10px] font-black uppercase tracking-widest">No ambassador applications</p>
                                </div>
                            ) : ambassadorApps.map(app => (
                                <div key={app.id} className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 bg-muted/30 rounded-2xl border border-border/50 gap-4">
                                    <div className="flex items-center gap-4">
                                        <Crown className="h-6 w-6 text-primary" />
                                        <div>
                                            <p className="font-black text-sm">{app.full_name}</p>
                                            <p className="text-[10px] text-muted-foreground font-bold">{app.university} • {app.student_id}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Badge variant="outline" className="text-[9px] font-black uppercase px-3 py-1 rounded-lg">{app.status}</Badge>
                                        {app.status === 'pending' && (
                                            <div className="flex gap-2">
                                                <Button size="sm" className="bg-primary h-9 px-4 rounded-lg font-black uppercase text-[9px]">Approve</Button>
                                                <Button size="sm" variant="outline" className="border-red-500/20 text-red-500 h-9 px-4 rounded-lg font-black uppercase text-[9px]">Reject</Button>
                                            </div>
                                        )}
                                        {(app.status === 'approved' || app.status === 'active') && (
                                            <Button size="sm" variant="outline" className="border-red-500/20 text-red-500 h-9 px-4 rounded-lg font-black uppercase text-[9px]">Revoke</Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Pending Approvals */}
                <TabsContent value="pending" className="space-y-6">
                    <Card className="bg-card border-border rounded-[2.5rem] overflow-hidden">
                        <CardHeader className="bg-muted/10 py-10 px-10 border-b border-border">
                            <CardTitle className="text-2xl font-black uppercase italic tracking-tighter">Pending <span className="text-primary">Verifications</span></CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 md:p-10 space-y-4">
                            {pendingSellers.length === 0 ? (
                                <div className="text-center py-20 opacity-20">
                                    <Inbox className="h-12 w-12 mx-auto mb-4" />
                                    <p className="text-[10px] font-black uppercase tracking-widest">No pending verifications</p>
                                </div>
                            ) : pendingSellers.map(seller => (
                                <div key={seller.id} className="flex flex-col lg:flex-row lg:items-center justify-between bg-muted/30 p-8 rounded-[2rem] border border-border/50 gap-6">
                                    <div className="flex items-center gap-6">
                                        <div className="h-16 w-16 bg-card rounded-2xl flex items-center justify-center border border-border">
                                            <UserCheck className="h-8 w-8 text-primary" />
                                        </div>
                                        <div>
                                            <p className="text-xl font-black italic uppercase tracking-tighter">{seller.full_name}</p>
                                            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-1 opacity-60">{seller.student_email} • {seller.university}</p>
                                            <Badge variant="outline" className="mt-2 text-[9px] font-black uppercase px-3 py-1 rounded-lg">{seller.business_type}</Badge>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <Button onClick={() => handleVerify(seller.id)} className="bg-primary text-primary-foreground font-black uppercase text-[9px] h-12 px-6 rounded-xl">Approve</Button>
                                        <Button variant="outline" className="border-red-500/20 text-red-500 font-black uppercase text-[9px] h-12 px-6 rounded-xl">Reject</Button>
                                        {seller.id_card_url && (
                                            <a href={seller.id_card_url} target="_blank" rel="noreferrer">
                                                <Button variant="outline" className="font-black uppercase text-[9px] h-12 px-6 rounded-xl"><Eye className="h-4 w-4 mr-2" /> View ID</Button>
                                            </a>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* God Mode Controls */}
                <TabsContent value="godmode" className="space-y-6">
                    <Card className="bg-card border-border rounded-[2.5rem] p-10">
                        <div className="flex items-center gap-3 mb-6">
                            <Zap className="h-6 w-6 text-primary" />
                            <h3 className="text-2xl font-black uppercase italic tracking-tighter">God Mode <span className="text-primary">Controls</span></h3>
                        </div>
                        <p className="text-muted-foreground text-sm italic mb-8">Override transaction states, listing statuses, and user account statuses. Use with caution.</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-6 bg-muted/30 rounded-2xl border border-border/50 space-y-3">
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Transaction Override</p>
                                <p className="text-sm font-bold">Freeze or release escrow on any transaction, override payment states.</p>
                                <Button variant="outline" className="h-10 rounded-xl font-black uppercase text-[9px] tracking-widest w-full">Open Transaction Manager</Button>
                            </div>
                            <div className="p-6 bg-muted/30 rounded-2xl border border-border/50 space-y-3">
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Listing Override</p>
                                <p className="text-sm font-bold">Force-activate, deactivate, or remove any listing on the platform.</p>
                                <Link href="/admin/listings"><Button variant="outline" className="h-10 rounded-xl font-black uppercase text-[9px] tracking-widest w-full">Open Product Registry</Button></Link>
                            </div>
                            <div className="p-6 bg-muted/30 rounded-2xl border border-border/50 space-y-3">
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">User Status Override</p>
                                <p className="text-sm font-bold">Approve, suspend, or permanently revoke any seller or buyer account.</p>
                                <Link href="/admin/users"><Button variant="outline" className="h-10 rounded-xl font-black uppercase text-[9px] tracking-widest w-full">Open User Registry</Button></Link>
                            </div>
                            <div className="p-6 bg-muted/30 rounded-2xl border border-border/50 space-y-3">
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Ambassador Override</p>
                                <p className="text-sm font-bold">Approve or revoke Ambassador status. Revoking removes badge and Pro access.</p>
                                <Button variant="outline" className="h-10 rounded-xl font-black uppercase text-[9px] tracking-widest w-full">Manage Ambassadors</Button>
                            </div>
                        </div>
                        <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl flex items-start gap-3">
                            <AlertTriangle className="h-5 w-5 text-yellow-500 shrink-0" />
                            <p className="text-xs text-yellow-600 dark:text-yellow-400 font-bold">God Mode actions are restricted to transaction and user status overrides. Database manipulation requires Systems Admin authorization.</p>
                        </div>
                    </Card>
                </TabsContent>

                {/* Support Tickets */}
                <TabsContent value="tickets" className="space-y-6">
                    <Card className="bg-card border-border rounded-[2.5rem] overflow-hidden">
                        <CardHeader className="bg-muted/10 py-10 px-10 border-b border-border">
                            <CardTitle className="text-2xl font-black uppercase italic tracking-tighter">Support <span className="text-primary">Tickets</span></CardTitle>
                            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-1 opacity-60">Escalated by Sage AI</p>
                        </CardHeader>
                        <CardContent className="p-6 md:p-10 space-y-4">
                            {supportTickets.length === 0 ? (
                                <div className="text-center py-20 opacity-20">
                                    <MessageSquare className="h-12 w-12 mx-auto mb-4" />
                                    <p className="text-[10px] font-black uppercase tracking-widest">No support tickets</p>
                                </div>
                            ) : supportTickets.map(ticket => (
                                <div key={ticket.id} className="p-6 bg-muted/30 rounded-2xl border border-border/50 flex justify-between items-center">
                                    <div>
                                        <p className="font-black text-sm">Ticket #{ticket.id?.slice(0, 8)}</p>
                                        <p className="text-[10px] text-muted-foreground font-bold">{ticket.priority} priority • {ticket.status}</p>
                                    </div>
                                    <Badge variant="outline" className="text-[9px] font-black uppercase px-3 py-1 rounded-lg">{ticket.status}</Badge>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Escrow Overview */}
                <TabsContent value="escrow" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
                        <Card className="bg-card border-border rounded-[3rem] p-10">
                            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.3em] mb-4">Total Transaction Volume</p>
                            <p className="text-5xl font-black italic tracking-tighter">₦{revenue.totalVolume.toLocaleString()}</p>
                        </Card>
                        <Card className="bg-primary text-primary-foreground rounded-[3rem] p-10 border-none">
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] mb-4 opacity-60">Platform Revenue</p>
                            <p className="text-5xl font-black italic tracking-tighter">₦{revenue.totalCommission.toLocaleString()}</p>
                        </Card>
                    </div>
                    <Card className="bg-card border-border rounded-[2.5rem] overflow-hidden">
                        <CardHeader className="bg-muted/10 py-10 px-10 border-b border-border">
                            <CardTitle className="text-xl font-black uppercase italic tracking-tighter">Transaction <span className="text-primary">History</span></CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 md:p-10 space-y-4">
                            {revenue.transactions.slice(0, 15).map(txn => (
                                <div key={txn.id} className="flex flex-col md:flex-row justify-between items-start md:items-center p-5 bg-muted/30 rounded-2xl border border-border/50 gap-4">
                                    <div>
                                        <p className="font-black text-sm font-mono">{txn.paystack_reference || 'LEGACY'}</p>
                                        <p className="text-[10px] text-muted-foreground font-bold">{txn.seller?.display_name || 'Seller'}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-black">₦{Number(txn.amount_total || 0).toLocaleString()}</p>
                                        <Badge className="bg-primary/10 text-primary text-[8px] rounded-lg px-2 py-0.5 font-black">{txn.status || 'completed'}</Badge>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Buyer Dispute Flags */}
                <TabsContent value="flags" className="space-y-6">
                    <Card className="bg-card border-border rounded-[2.5rem] p-10">
                        <h3 className="text-2xl font-black italic uppercase tracking-tighter mb-6">Buyer Dispute <span className="text-primary">Flags</span></h3>
                        <p className="text-muted-foreground text-sm italic mb-6">Transactions flagged by buyers as problematic, with full transaction history and Terms Builder evidence.</p>
                        <div className="text-center py-16 opacity-20">
                            <Flag className="h-12 w-12 mx-auto mb-4" />
                            <p className="text-[10px] font-black uppercase tracking-widest">No flagged transactions</p>
                        </div>
                    </Card>
                </TabsContent>
            </Tabs>

            <div className="text-center py-20 opacity-20">
                <p className="text-[9px] font-black uppercase tracking-[0.8em] text-muted-foreground italic">MarketBridge Operations Hub // Nigeria 2026</p>
            </div>
        </div>
    );
}