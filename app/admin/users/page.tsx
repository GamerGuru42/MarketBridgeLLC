'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Users,
    Search,
    UserPlus,
    Filter,
    MoreVertical,
    CheckCircle2,
    ShieldAlert,
    Ban,
    ExternalLink,
    Mail,
    Phone
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

interface UserProfile {
    id: string;
    email: string;
    display_name: string;
    role: string;
    is_verified: boolean;
    created_at: string;
    phone_number?: string;
    business_name?: string;
}

export default function AdminUsersPage() {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState<string | null>(null);

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
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [filterRole]);

    const filteredUsers = users.filter(u =>
        u.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.business_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'admin': return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">Admin</Badge>;
            case 'ceo': return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">CEO</Badge>;
            case 'dealer': return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">Dealer</Badge>;
            default: return <Badge variant="outline" className="text-slate-500">{role}</Badge>;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Identity Nexus</h2>
                    <p className="text-muted-foreground text-sm">Manage all users, dealers, and executive nodes on the network.</p>
                </div>
                <Button className="font-bold italic tracking-widest gap-2">
                    <UserPlus className="h-4 w-4" /> Provision New User
                </Button>
            </div>

            <Card className="border-slate-800 bg-slate-900/50 backdrop-blur">
                <CardHeader className="pb-3 px-6 pt-6">
                    <div className="flex flex-col md:flex-row gap-4 justify-between">
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                            <Input
                                placeholder="Search by name, email, or business..."
                                className="pl-10 bg-slate-950 border-slate-800"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant={filterRole === null ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setFilterRole(null)}
                                className="text-xs"
                            >
                                All
                            </Button>
                            <Button
                                variant={filterRole === 'dealer' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setFilterRole('dealer')}
                                className="text-xs"
                            >
                                Dealers
                            </Button>
                            <Button
                                variant={filterRole === 'admin' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setFilterRole('admin')}
                                className="text-xs"
                            >
                                Admins
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-slate-950/50">
                            <TableRow className="border-slate-800 hover:bg-transparent">
                                <TableHead className="w-[300px] text-slate-500 uppercase text-[10px] font-black tracking-widest">Identified Entity</TableHead>
                                <TableHead className="text-slate-500 uppercase text-[10px] font-black tracking-widest">Designation</TableHead>
                                <TableHead className="text-slate-500 uppercase text-[10px] font-black tracking-widest">Verification Status</TableHead>
                                <TableHead className="text-slate-500 uppercase text-[10px] font-black tracking-widest">Joined On</TableHead>
                                <TableHead className="text-right text-slate-500 uppercase text-[10px] font-black tracking-widest px-6">Terminal</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-64 text-center">
                                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                                        <p className="mt-2 text-slate-500 font-mono text-xs uppercase tracking-widest">Synchronizing Database...</p>
                                    </TableCell>
                                </TableRow>
                            ) : filteredUsers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-64 text-center">
                                        <Users className="h-10 w-10 mx-auto text-slate-800 mb-2" />
                                        <p className="text-slate-500 font-mono text-xs uppercase tracking-widest italic">No entities detected matching the signature.</p>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredUsers.map((user) => (
                                    <TableRow key={user.id} className="border-slate-800/50 hover:bg-slate-800/20 transition-colors group">
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-primary font-bold">
                                                    {user.display_name?.[0] || '?'}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-100 group-hover:text-primary transition-colors text-sm">
                                                        {user.display_name || 'Anonymous User'}
                                                    </span>
                                                    <span className="text-xs text-slate-500 font-mono italic">{user.email}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>{getRoleBadge(user.role)}</TableCell>
                                        <TableCell>
                                            {user.is_verified ? (
                                                <div className="flex items-center gap-1.5 text-green-500">
                                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                                    <span className="text-[10px] uppercase font-black tracking-tighter">Verified</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1.5 text-slate-500">
                                                    <ShieldAlert className="h-3.5 w-3.5" />
                                                    <span className="text-[10px] uppercase font-black tracking-tighter font-mono italic">Pending</span>
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-xs font-mono text-slate-400">
                                                {new Date(user.created_at).toLocaleDateString()}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right px-6">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-56 bg-slate-900 border-slate-800 text-slate-100">
                                                    <DropdownMenuLabel className="text-[10px] font-black uppercase text-slate-500">Entity Control</DropdownMenuLabel>
                                                    <DropdownMenuItem className="gap-2 cursor-pointer focus:bg-primary/20">
                                                        <ExternalLink className="h-4 w-4" /> View full profile
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="gap-2 cursor-pointer focus:bg-primary/20">
                                                        <Mail className="h-4 w-4" /> Send Transmission
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator className="bg-slate-800" />
                                                    <DropdownMenuItem className="gap-2 cursor-pointer text-red-400 focus:bg-red-500/20">
                                                        <Ban className="h-4 w-4" /> Revoke Access (Deactivate)
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
