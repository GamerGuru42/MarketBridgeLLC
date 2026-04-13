'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import {
    Users as UsersIcon, Search, MoreVertical,
    CheckCircle2, ShieldAlert,
    Mail, ShieldCheck, Briefcase
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2 } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';

interface UserProfile {
    id: string;
    email: string;
    display_name: string;
    role: string;
    is_verified: boolean;
    created_at: string;
    phone_number?: string;
    business_name?: string;
    photo_url?: string;
    coins_balance?: number;
}

export default function AdminUsersPage() {
    const { user: currentUser, loading: authLoading } = useAuth();
    const router = useRouter();
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState<string | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        const ADMIN_ROLES = ['admin', 'technical_admin', 'operations_admin', 'marketing_admin', 'ceo', 'cofounder'];
        if (!authLoading && (!currentUser || !ADMIN_ROLES.includes(currentUser.role))) {
            router.replace('/portal/login');
        }
    }, [currentUser, authLoading, router]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            let query = supabase.from('users').select('*').order('created_at', { ascending: false });
            if (filterRole) {
                query = query.eq('role', filterRole);
            }
            const { data, error } = await query;
            if (error) throw error;
            setUsers(data || []);
        } catch (error) {
            console.error('Error fetching users:', error);
            toast('Failed to sync user database', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [filterRole]);

    const handleAction = async (userId: string, action: 'verify' | 'unverify' | 'make_dealer' | 'ban' | 'manage_coins') => {
        try {
            let updates: any = {};
            let message = '';

            if (action === 'manage_coins') {
                const input = window.prompt("Enter amount to add or subtract (e.g., '100' or '-50'):", "0");
                if (input === null || isNaN(Number(input))) return;

                const user = users.find(u => u.id === userId);
                if (!user) return;

                const currentBalance = user.coins_balance || 0;
                updates = { coins_balance: Math.max(0, currentBalance + Number(input)) };
                message = `MarketCoins adjusted by ${Number(input)}`;
            } else {
                switch (action) {
                    case 'verify':
                        updates = { is_verified: true };
                        message = 'Identity Verified';
                        break;
                    case 'unverify':
                        updates = { is_verified: false };
                        message = 'Verification Revoked';
                        break;
                    case 'make_dealer':
                        updates = { role: 'dealer' };
                        message = 'Promoted to Dealer Status';
                        break;
                    case 'ban':
                        toast('Ban System not fully implemented in UI', 'info');
                        return;
                }
            }

            const { error } = await supabase.from('users').update(updates).eq('id', userId);
            if (error) throw error;
            toast(message, 'success');
            fetchUsers();
        } catch (err) {
            console.error('Action failed:', err);
            toast('Command failed execution', 'error');
        }
    };

    const filteredUsers = users.filter(u =>
        (u.display_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (u.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (u.business_name?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'admin': return <Badge className="bg-primary/10 text-primary border-primary/20 font-mono uppercase tracking-widest text-[10px]">Admin</Badge>;
            case 'ceo': return <Badge className="bg-[#FF6200]/10 text-[#FF6200] border-[#FF6200]/20 font-mono uppercase tracking-widest text-[10px]">CEO</Badge>;
            case 'dealer': return <Badge className="bg-primary/20 text-primary border-primary/30 font-mono uppercase tracking-widest text-[10px]">Dealer</Badge>;
            case 'student_seller': return <Badge className="bg-muted text-muted-foreground border-border font-mono uppercase tracking-widest text-[10px]">Seller</Badge>;
            default: return <Badge variant="outline" className="text-muted-foreground border-border font-mono uppercase tracking-widest text-[10px]">{role}</Badge>;
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground p-4 md:p-10 font-sans selection:bg-primary selection:text-primary-foreground transition-colors duration-300">
            <div className="fixed inset-0 bg-[url('/grid-pattern.svg')] opacity-[0.03] pointer-events-none z-0" />
            <div className="max-w-7xl mx-auto relative z-10 space-y-8">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border pb-8">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <UsersIcon className="h-5 w-5 text-primary" />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground font-heading">Network Administration</span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter italic font-heading">
                            Identity <span className="text-primary">Nexus</span>
                        </h2>
                    </div>
                </div>

                <div className="bg-card border border-border rounded-[2rem] shadow-sm overflow-hidden transition-colors duration-300">
                    <div className="flex flex-col md:flex-row gap-4 justify-between p-6 bg-muted/20 border-b border-border">
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Scan for identity signatures..."
                                className="pl-10 bg-background border-border text-foreground placeholder:text-muted-foreground/30 h-11 focus:ring-1 focus:ring-primary/30 rounded-xl"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
                            {['All', 'Dealer', 'Admin', 'Seller'].map((role) => {
                                const roleValue = role === 'All' ? null : (role === 'Seller' ? 'student_seller' : role.toLowerCase());
                                return (
                                    <Button
                                        key={role}
                                        variant={filterRole === roleValue ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => setFilterRole(roleValue)}
                                        className={`text-[10px] font-black uppercase tracking-widest h-11 px-6 rounded-xl transition-all ${filterRole === roleValue
                                            ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                                            : 'border-border text-muted-foreground hover:text-foreground hover:bg-muted/50'
                                            }`}
                                    >
                                        {role}s
                                    </Button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-muted/30">
                                <TableRow className="border-border hover:bg-transparent">
                                    <TableHead className="w-[300px] text-muted-foreground uppercase text-[10px] font-black tracking-widest font-heading py-6 px-8">Identified Entity</TableHead>
                                    <TableHead className="text-muted-foreground uppercase text-[10px] font-black tracking-widest font-heading py-6 px-4">Clearance</TableHead>
                                    <TableHead className="text-muted-foreground uppercase text-[10px] font-black tracking-widest font-heading py-6 px-4">Coins</TableHead>
                                    <TableHead className="text-muted-foreground uppercase text-[10px] font-black tracking-widest font-heading py-6 px-4">Status</TableHead>
                                    <TableHead className="text-muted-foreground uppercase text-[10px] font-black tracking-widest font-heading py-6 px-4">Inception</TableHead>
                                    <TableHead className="text-right text-muted-foreground uppercase text-[10px] font-black tracking-widest font-heading py-6 px-8">Controls</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-64 text-center">
                                            <div className="flex flex-col items-center gap-4">
                                                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                                                <p className="text-muted-foreground font-black text-[10px] uppercase tracking-[0.3em] animate-pulse">Establishing Uplink...</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : filteredUsers.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-64 text-center">
                                            <div className="flex flex-col items-center gap-4">
                                                <ShieldAlert className="h-12 w-12 text-muted-foreground/10" />
                                                <p className="text-muted-foreground font-black text-[10px] uppercase tracking-widest italic opacity-40">No entities detected in sector.</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredUsers.map((u) => (
                                        <TableRow key={u.id} className="border-border hover:bg-muted/10 transition-colors group">
                                            <TableCell className="px-8">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-12 w-12 rounded-2xl bg-muted border border-border flex items-center justify-center text-primary font-black shrink-0 shadow-sm group-hover:scale-110 transition-transform">
                                                        {u.display_name?.[0]?.toUpperCase() || '?'}
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="font-black text-foreground group-hover:text-primary transition-colors text-base truncate uppercase tracking-tighter italic">
                                                            {u.display_name || 'Anonymous User'}
                                                        </span>
                                                        <span className="text-[10px] text-muted-foreground font-bold truncate opacity-60">{u.email}</span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-4">{getRoleBadge(u.role)}</TableCell>
                                            <TableCell className="px-4">
                                                <div className="flex items-center gap-1">
                                                    <span className="text-primary font-black text-lg">{u.coins_balance || 0}</span>
                                                    <span className="text-[9px] uppercase font-black text-muted-foreground">MC</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-4">
                                                {u.is_verified ? (
                                                    <div className="flex items-center gap-2 text-foreground">
                                                        <div className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                                                        <span className="text-[10px] uppercase font-black tracking-widest text-green-500">Verified</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2 text-muted-foreground">
                                                        <div className="h-2 w-2 rounded-full bg-muted-foreground/30" />
                                                        <span className="text-[10px] uppercase font-black tracking-widest opacity-40">Unverified</span>
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell className="px-4">
                                                <span className="text-[10px] font-bold text-muted-foreground font-mono">
                                                    {new Date(u.created_at).toLocaleDateString().split('/').join(' / ')}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right px-8">
                                                <div className="flex items-center justify-end gap-3">
                                                    {!u.is_verified && (
                                                        <Button
                                                            onClick={() => handleAction(u.id, 'verify')}
                                                            size="sm"
                                                            className="h-9 px-4 bg-primary text-primary-foreground hover:opacity-90 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-primary/10 border-none"
                                                        >
                                                            <ShieldCheck className="h-3.5 w-3.5 mr-2" />
                                                            Verify
                                                        </Button>
                                                    )}
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-colors">
                                                                <MoreVertical className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="w-64 bg-card border-border shadow-2xl p-2 rounded-2xl">
                                                            <DropdownMenuLabel className="text-[10px] font-black uppercase text-muted-foreground font-heading px-3 py-2">Entity Control</DropdownMenuLabel>
                                                            <DropdownMenuSeparator className="bg-border my-1" />
                                                            <DropdownMenuItem onClick={() => handleAction(u.id, 'manage_coins')} className="gap-3 cursor-pointer py-3 rounded-xl focus:bg-primary/10 focus:text-primary transition-colors">
                                                                <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center font-black text-xs">MC</div>
                                                                <div className="flex flex-col">
                                                                    <span className="font-bold text-xs">Budget Adjustment</span>
                                                                    <span className="text-[10px] opacity-40">Current: {u.coins_balance || 0} MC</span>
                                                                </div>
                                                            </DropdownMenuItem>

                                                            {u.is_verified ? (
                                                                <DropdownMenuItem onClick={() => handleAction(u.id, 'unverify')} className="gap-3 cursor-pointer py-3 rounded-xl focus:bg-red-500/10 focus:text-red-500 transition-colors">
                                                                    <div className="h-8 w-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500"><ShieldAlert className="h-4 w-4" /></div>
                                                                    <div className="flex flex-col">
                                                                        <span className="font-bold text-xs uppercase">Revoke Access</span>
                                                                        <span className="text-[10px] opacity-40">Demote to unverified</span>
                                                                    </div>
                                                                </DropdownMenuItem>
                                                            ) : (
                                                                <DropdownMenuItem onClick={() => handleAction(u.id, 'verify')} className="gap-3 cursor-pointer py-3 rounded-xl focus:bg-green-500/10 focus:text-green-500 transition-colors">
                                                                    <div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center text-green-500"><ShieldCheck className="h-4 w-4" /></div>
                                                                    <div className="flex flex-col">
                                                                        <span className="font-bold text-xs uppercase">Elevate Clearance</span>
                                                                        <span className="text-[10px] opacity-40">Grant verified status</span>
                                                                    </div>
                                                                </DropdownMenuItem>
                                                            )}

                                                            {u.role !== 'dealer' && u.role !== 'admin' && (
                                                                <DropdownMenuItem onClick={() => handleAction(u.id, 'make_dealer')} className="gap-3 cursor-pointer py-3 rounded-xl focus:bg-primary/10 focus:text-primary transition-colors">
                                                                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary"><Briefcase className="h-4 w-4" /></div>
                                                                    <div className="flex flex-col">
                                                                        <span className="font-bold text-xs uppercase">Grant License</span>
                                                                        <span className="text-[10px] opacity-40">Promote to dealer</span>
                                                                    </div>
                                                                </DropdownMenuItem>
                                                            )}

                                                            <DropdownMenuSeparator className="bg-border my-1" />
                                                            <DropdownMenuItem className="gap-3 cursor-pointer py-3 rounded-xl focus:bg-muted transition-colors opacity-50">
                                                                <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center"><Mail className="h-4 w-4" /></div>
                                                                <div className="flex flex-col">
                                                                    <span className="font-bold text-xs uppercase">Dispatch Ping</span>
                                                                    <span className="text-[10px] opacity-40">Send email notification</span>
                                                                </div>
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>

                <div className="text-center py-10 opacity-20 hover:opacity-100 transition-opacity">
                    <p className="text-[9px] font-black uppercase tracking-[0.5em] text-muted-foreground">End of Transmission // Secure Identity Uplink 0.9.4</p>
                </div>
            </div>
        </div>
    );
}