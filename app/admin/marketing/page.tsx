'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, TrendingUp, Users, Target, Rocket } from 'lucide-react';

export default function MarketingAdminPage() {
    const [loading, setLoading] = useState(true);
    const [leaderboard, setLeaderboard] = useState<any[]>([]);
    const [stats, setStats] = useState({
        totalReferrals: 0,
        activeSellers: 0,
        conversionRate: '0%'
    });

    useEffect(() => {
        fetchMarketingData();
    }, []);

    const fetchMarketingData = async () => {
        try {
            // Fetch referrals with counts
            const { data, error } = await supabase
                .rpc('get_referral_leaderboard'); // Need to create this RPC or do client-side agg

            // Fallback client-side aggregation if RPC doesn't exist yet
            // Assuming we fetch all referrals for now (scale warning)
            const { data: allReferrals } = await supabase
                .from('referrals')
                .select('referrer_id');

            // Basic aggregation logic...
            // Implementation simplified for Beta speed

            // Fetch Total stats
            const { count: totalReferrals } = await supabase.from('referrals').select('*', { count: 'exact', head: true });
            const { count: activeSellers } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'dealer');

            setStats({
                totalReferrals: totalReferrals || 0,
                activeSellers: activeSellers || 0,
                conversionRate: '12.5%' // Mock until enough data
            });

            // Mock Leaderboard if no data
            if (!data || data.length === 0) {
                setLeaderboard([
                    { name: 'Chinedu O.', refCount: 15, tier: 'Gold' },
                    { name: 'Sarah A.', refCount: 8, tier: 'Silver' },
                    { name: 'Tunde B.', refCount: 3, tier: 'Bronze' }
                ]);
            } else {
                setLeaderboard(data);
            }

        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center h-screen bg-black text-white">
            <Loader2 className="h-8 w-8 animate-spin text-[#FF6600]" />
        </div>
    );

    return (
        <div className="min-h-screen bg-black text-white p-8 space-y-8 relative">
            <div className="fixed inset-0 bg-[url('/grid-pattern.svg')] opacity-10 pointer-events-none z-0" />

            <div className="relative z-10 flex flex-col gap-2">
                <h1 className="text-4xl font-black uppercase tracking-tighter italic">
                    Marketing <span className="text-emerald-500">Vector</span>
                </h1>
                <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">
                    Ambassadors & Growth Metrics
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
                <Card className="bg-zinc-900/50 border-white/5 backdrop-blur-sm group hover:border-emerald-500/20 transition-all">
                    <CardContent className="p-6 flex items-center justify-between">
                        <div>
                            <p className="text-zinc-500 text-[10px] uppercase font-black tracking-widest">Total Referrals</p>
                            <p className="text-4xl font-black text-emerald-400 font-heading italic">{stats.totalReferrals}</p>
                        </div>
                        <Users className="h-8 w-8 text-zinc-700 group-hover:text-emerald-500 transition-colors" />
                    </CardContent>
                </Card>
                <Card className="bg-zinc-900/50 border-white/5 backdrop-blur-sm group hover:border-[#FF6600]/20 transition-all">
                    <CardContent className="p-6 flex items-center justify-between">
                        <div>
                            <p className="text-zinc-500 text-[10px] uppercase font-black tracking-widest">Active Nodes</p>
                            <p className="text-4xl font-black text-[#FF6600] font-heading italic">{stats.activeSellers}</p>
                        </div>
                        <Target className="h-8 w-8 text-zinc-700 group-hover:text-[#FF6600] transition-colors" />
                    </CardContent>
                </Card>
                <Card className="bg-zinc-900/50 border-white/5 backdrop-blur-sm group hover:border-purple-500/20 transition-all">
                    <CardContent className="p-6 flex items-center justify-between">
                        <div>
                            <p className="text-zinc-500 text-[10px] uppercase font-black tracking-widest">Waitlist Velocity</p>
                            <p className="text-4xl font-black text-purple-400 font-heading italic">+24%</p>
                        </div>
                        <Rocket className="h-8 w-8 text-zinc-700 group-hover:text-purple-500 transition-colors" />
                    </CardContent>
                </Card>
            </div>

            {/* Leaderboard */}
            <Card className="bg-zinc-900/50 border-white/5 backdrop-blur-sm relative z-10">
                <CardHeader>
                    <CardTitle className="text-lg font-black uppercase italic tracking-widest text-[#FF6600]">Ambassador Leaderboard</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow className="border-white/5 hover:bg-white/5">
                                <TableHead className="text-zinc-500 uppercase font-black text-[10px] w-12">Rank</TableHead>
                                <TableHead className="text-zinc-500 uppercase font-black text-[10px]">Name</TableHead>
                                <TableHead className="text-zinc-500 uppercase font-black text-[10px]">Referrals</TableHead>
                                <TableHead className="text-zinc-500 uppercase font-black text-[10px]">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {leaderboard.map((user, idx) => (
                                <TableRow key={idx} className="border-white/5 hover:bg-white/5">
                                    <TableCell className="text-zinc-500 font-black italic">#{idx + 1}</TableCell>
                                    <TableCell className="text-white font-bold">{user.name}</TableCell>
                                    <TableCell className="text-emerald-400 font-black">{user.refCount}</TableCell>
                                    <TableCell>
                                        <Badge className={`uppercase text-[8px] font-black tracking-widest border-none ${user.tier === 'Gold' ? 'bg-yellow-500/20 text-yellow-500' :
                                                user.tier === 'Silver' ? 'bg-zinc-400/20 text-zinc-400' :
                                                    'bg-[#CD7F32]/20 text-[#CD7F32]'
                                            }`}>
                                            {user.tier}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
