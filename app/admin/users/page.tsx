'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import {
    Users,
    Search,
    UserPlus,
    MoreVertical,
    CheckCircle2,
    ShieldAlert,
    Ban,
    ExternalLink,
    Mail,
    ShieldCheck,
    Briefcase
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
}

export default function AdminUsersPage() {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState<string | null>(null);
    const { toast } = useToast();

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

    const handleAction = async (userId: string, action: 'verify' | 'unverify' | 'make_dealer' | 'ban') => {
        try {
            let updates: any = {};
            let message = '';

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
                    // Just a flag for now, or auth admin delete.
                    // For safety, we just mark metadata or similar. 
                    // But schema might not support 'banned' column?
                    // Let's assume we toggle 'is_verified' to false and add note?
                    // Or actually, Supabase Auth Ban is separate.
                    // Let's skip BAN for now unless we added a 'status' column.
                    toast('Ban protocol not fully implemented in UI', 'info');
                    return;
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
            case 'admin': return <Badge className="bg-red-500/10 text-red-500 border-red-500/20 font-mono uppercase tracking-widest text-[10px]">Admin</Badge>;
            case 'ceo': return <Badge className="bg-[#FF6600]/10 text-[#FF6600] border-[#FF6600]/20 font-mono uppercase tracking-widest text-[10px]">CEO</Badge>;
            case 'dealer': return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 font-mono uppercase tracking-widest text-[10px]">Dealer</Badge>;
            default: return <Badge variant="outline" className="text-zinc-500 border-zinc-800 font-mono uppercase tracking-widest text-[10px]">{role}</Badge>;
        }
    };

    return (
        <div className="min-h-screen bg-black text-white p-6 md:p-12 font-sans selection:bg-[#FF6600] selection:text-black">
            {/* Background Grid */}
            <div className="fixed inset-0 bg-[url('/grid-pattern.svg')] opacity-10 pointer-events-none z-0" />

            <div className="max-w-7xl mx-auto relative z-10 space-y-8">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/10 pb-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <Users className="h-5 w-5 text-[#FF6600]" />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 font-heading">Network Administration</span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter italic font-heading">
                            Identity <span className="text-[#00FF85]">Nexus</span>
                        </h2>
                    </div>

                </div>

                <div className="glass-card border border-white/10 bg-zinc-900/30 p-1 rounded-xl">
                    <div className="flex flex-col md:flex-row gap-4 justify-between p-4">
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                            <Input
                                placeholder="Scan for identity signatures..."
                                className="pl-10 bg-black border-white/10 text-white placeholder:text-zinc-700 h-10 focus:border-[#FF6600]/50"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            {['All', 'Dealer', 'Admin'].map((role) => (
                                <Button
                                    key={role}
                                    variant={filterRole === (role === 'All' ? null : role.toLowerCase()) ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setFilterRole(role === 'All' ? null : role.toLowerCase())}
                                    className={`text-[10px] font-black uppercase tracking-widest h-10 ${filterRole === (role === 'All' ? null : role.toLowerCase())
                                        ? 'bg-[#FF6600] text-black hover:bg-[#FF6600]/90'
                                        : 'border-white/10 text-zinc-400 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    {role}s
                                </Button>
                            ))}
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-lg border-t border-white/5">
                        <Table>
                            <TableHeader className="bg-black/50">
                                <TableRow className="border-white/5 hover:bg-transparent">
                                    <TableHead className="w-[300px] text-zinc-500 uppercase text-[10px] font-black tracking-widest font-heading">Identified Entity</TableHead>
                                    <TableHead className="text-zinc-500 uppercase text-[10px] font-black tracking-widest font-heading">Clearance</TableHead>
                                    <TableHead className="text-zinc-500 uppercase text-[10px] font-black tracking-widest font-heading">Status</TableHead>
                                    <TableHead className="text-zinc-500 uppercase text-[10px] font-black tracking-widest font-heading">Inception</TableHead>
                                    <TableHead className="text-right text-zinc-500 uppercase text-[10px] font-black tracking-widest font-heading px-6">Controls</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-64 text-center">
                                            <Loader2 className="h-8 w-8 animate-spin mx-auto text-[#FF6600]" />
                                            <p className="mt-2 text-zinc-500 font-mono text-xs uppercase tracking-widest">Establishing Uplink...</p>
                                        </TableCell>
                                    </TableRow>
                                ) : filteredUsers.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-64 text-center">
                                            <ShieldAlert className="h-10 w-10 mx-auto text-zinc-800 mb-2" />
                                            <p className="text-zinc-500 font-mono text-xs uppercase tracking-widest italic">No entities detected in sector.</p>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredUsers.map((user) => (
                                        <TableRow key={user.id} className="border-white/5 hover:bg-white/5 transition-colors group">
                                            <TableCell>
                                                <div className="flex items-center gap-4">
                                                    <div className="h-10 w-10 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center text-[#FF6600] font-bold shrink-0">
                                                        {user.display_name?.[0]?.toUpperCase() || '?'}
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="font-bold text-white group-hover:text-[#FF6600] transition-colors text-sm truncate">
                                                            {user.display_name || 'Anonymous User'}
                                                        </span>
                                                        <span className="text-xs text-zinc-600 font-mono italic truncate">{user.email}</span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>{getRoleBadge(user.role)}</TableCell>
                                            <TableCell>
                                                {user.is_verified ? (
                                                    <div className="flex items-center gap-1.5 text-[#00FF85]">
                                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                                        <span className="text-[10px] uppercase font-black tracking-tighter font-heading">Verified</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-1.5 text-zinc-600">
                                                        <ShieldAlert className="h-3.5 w-3.5" />
                                                        <span className="text-[10px] uppercase font-black tracking-tighter font-heading">Unverified</span>
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-xs font-mono text-zinc-500">
                                                    {new Date(user.created_at).toLocaleDateString()}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right px-6">
                                                <div className="flex items-center justify-end gap-2">
                                                    {/* Quick Action: Verify/Unverify Button */}
                                                    {!user.is_verified && (
                                                        <Button
                                                            onClick={() => handleAction(user.id, 'verify')}
                                                            size="sm"
                                                            className="h-7 px-3 bg-[#00FF85]/10 text-[#00FF85] border border-[#00FF85]/20 hover:bg-[#00FF85]/20 text-[9px] font-black uppercase tracking-wider"
                                                        >
                                                            <ShieldCheck className="h-3 w-3 mr-1" />
                                                            Verify
                                                        </Button>
                                                    )}

                                                    {/* Dropdown Menu */}
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-white hover:bg-white/10">
                                                                <MoreVertical className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="w-56 bg-zinc-950 border-white/10 text-zinc-300">
                                                            <DropdownMenuLabel className="text-[10px] font-black uppercase text-zinc-600 font-heading">Entity Control</DropdownMenuLabel>

                                                            {user.is_verified ? (
                                                                <DropdownMenuItem onClick={() => handleAction(user.id, 'unverify')} className="gap-2 cursor-pointer focus:bg-red-500/10 focus:text-red-500">
                                                                    <ShieldAlert className="h-4 w-4" /> Revoke Verification
                                                                </DropdownMenuItem>
                                                            ) : (
                                                                <DropdownMenuItem onClick={() => handleAction(user.id, 'verify')} className="gap-2 cursor-pointer focus:bg-[#00FF85]/10 focus:text-[#00FF85]">
                                                                    <ShieldCheck className="h-4 w-4" /> Verify Identity
                                                                </DropdownMenuItem>
                                                            )}

                                                            {user.role !== 'dealer' && user.role !== 'admin' && (
                                                                <DropdownMenuItem onClick={() => handleAction(user.id, 'make_dealer')} className="gap-2 cursor-pointer focus:bg-[#FF6600]/10 focus:text-[#FF6600]">
                                                                    <Briefcase className="h-4 w-4" /> Grant Dealer License
                                                                </DropdownMenuItem>
                                                            )}

                                                            <DropdownMenuSeparator className="bg-white/10" />

                                                            <DropdownMenuItem className="gap-2 cursor-pointer focus:bg-white/10">
                                                                <Mail className="h-4 w-4" /> Send Transmission
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
            </div>
        </div>
    );
}
