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
            const { data: referrals } = await supabase
                .from('referrals')
                .select('referrer_id');

            let leaderData: any[] = [];

            if (referrals && referrals.length > 0) {
                const counts: Record<string, number> = {};
                referrals.forEach((r: any) => {
                    if (r.referrer_id) counts[r.referrer_id] = (counts[r.referrer_id] || 0) + 1;
                });

                const board = Object.entries(counts)
                    .map(([id, count]) => ({ id, count }))
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 5);

                if (board.length > 0) {
                    const { data: users } = await supabase
                        .from('users')
                        .select('id, display_name')
                        .in('id', board.map(b => b.id));

                    leaderData = board.map(b => ({
                        name: users?.find(u => u.id === b.id)?.display_name || 'Unknown Agent',
                        refCount: b.count,
                        tier: b.count >= 15 ? 'Gold' : b.count >= 5 ? 'Silver' : 'Bronze'
                    }));
                }
            }

            setLeaderboard(leaderData);

            const { count: totalReferrals } = await supabase.from('referrals').select('*', { count: 'exact', head: true });
            const { count: activeSellers } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'dealer');

            setStats({
                totalReferrals: totalReferrals || 0,
                activeSellers: activeSellers || 0,
                conversionRate: 'N/A'
            });

        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center h-screen bg-black text-white">
            <Loader2 className="h-8 w-8 animate-spin text-[#FF6200]" />
        </div>
    );

    return (
        <div className="min-h-screen bg-black text-white p-8 space-y-8 relative">
            <div className="fixed inset-0 bg-[url('/grid-pattern.svg')] opacity-10 pointer-events-none z-0" />

            <div className="relative z-10 flex flex-col gap-2">
                <h1 className="text-4xl font-black uppercase tracking-tighter italic">
                    Marketing <span className="text-[#FF6200]">Vector</span>
                </h1>
                <p className="text-white/40 text-xs font-bold uppercase tracking-widest">
                    Ambassadors & Growth Metrics
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
                <Card className="bg-zinc-900/50 border-white/5 backdrop-blur-sm group hover:border-[#FF6200]/20 transition-all">
                    <CardContent className="p-6 flex items-center justify-between">
                        <div>
                            <p className="text-white/40 text-[10px] uppercase font-black tracking-widest">Total Referrals</p>
                            <p className="text-4xl font-black text-white font-heading italic">{stats.totalReferrals}</p>
                        </div>
                        <Users className="h-8 w-8 text-white/20 group-hover:text-[#FF6200] transition-colors" />
                    </CardContent>
                </Card>

                <Card className="bg-zinc-900/50 border-white/5 backdrop-blur-sm group hover:border-[#FF6200]/20 transition-all">
                    <CardContent className="p-6 flex items-center justify-between">
                        <div>
                            <p className="text-white/40 text-[10px] uppercase font-black tracking-widest">Active Campuss</p>
                            <p className="text-4xl font-black text-[#FF6200] font-heading italic">{stats.activeSellers}</p>
                        </div>
                        <Target className="h-8 w-8 text-white/20 group-hover:text-[#FF6200] transition-colors" />
                    </CardContent>
                </Card>

                <Card className="bg-zinc-900/50 border-white/5 backdrop-blur-sm group hover:border-[#FF6200]/20 transition-all">
                    <CardContent className="p-6 flex items-center justify-between">
                        <div>
                            <p className="text-white/40 text-[10px] uppercase font-black tracking-widest">Waitlist Velocity</p>
                            <p className="text-4xl font-black text-white font-heading italic">+24%</p>
                        </div>
                        <Rocket className="h-8 w-8 text-white/20 group-hover:text-[#FF6200] transition-colors" />
                    </CardContent>
                </Card>
            </div>

            <Card className="bg-zinc-900/50 border-white/5 backdrop-blur-sm relative z-10">
                <CardHeader>
                    <CardTitle className="text-lg font-black uppercase italic tracking-widest text-[#FF6200]">Ambassador Leaderboard</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow className="border-white/5 hover:bg-white/5">
                                <TableHead className="text-white/40 uppercase font-black text-[10px] w-12">Rank</TableHead>
                                <TableHead className="text-white/40 uppercase font-black text-[10px]">Name</TableHead>
                                <TableHead className="text-white/40 uppercase font-black text-[10px]">Referrals</TableHead>
                                <TableHead className="text-white/40 uppercase font-black text-[10px]">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {leaderboard.map((user, idx) => (
                                <TableRow key={idx} className="border-white/5 hover:bg-white/5">
                                    <TableCell className="text-white/40 font-black italic">#{idx + 1}</TableCell>
                                    <TableCell className="text-white font-bold">{user.name}</TableCell>
                                    <TableCell className="text-[#FF6200] font-black">{user.refCount}</TableCell>
                                    <TableCell>
                                        <Badge className={`uppercase text-[8px] font-black tracking-widest border-none ${user.tier === 'Gold' ? 'bg-[#FF6200] text-black' :
                                            user.tier === 'Silver' ? 'bg-zinc-400 text-black' :
                                                'bg-zinc-800 text-white/60'
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