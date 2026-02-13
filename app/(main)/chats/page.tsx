'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';

interface Chat {
    id: string;
    participant1_id: string;
    participant2_id: string;
    listing_id: string | null;
    last_message: string | null;
    last_message_at: string | null;
    created_at: string;
    other_user?: {
        id: string;
        display_name: string;
        photo_url: string | null;
        role: string;
        avatar_url?: string; // Handle both naming conventions
    };
    listing_title?: string;
    unread_count?: number;
}

export default function ChatsPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [chats, setChats] = useState<Chat[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
            return;
        }

        if (user) {
            fetchChats();
            const unsubscribe = subscribeToChats();
            return () => {
                unsubscribe();
            };
        }
    }, [user, authLoading]);

    const fetchChats = async () => {
        if (!user) return;

        try {
            // Strategy: Fetch conversations where I am P1, then where I am P2, and merge.

            // 1. As Participant 1
            const { data: asP1, error: e1 } = await supabase
                .from('conversations')
                .select(`
                    *,
                    other_user:users!participant2_id(id, display_name, photo_url, role),
                    listing:listings(title)
                `)
                .eq('participant1_id', user.id)
                .order('last_message_at', { ascending: false });

            // 2. As Participant 2
            const { data: asP2, error: e2 } = await supabase
                .from('conversations')
                .select(`
                    *,
                    other_user:users!participant1_id(id, display_name, photo_url, role),
                    listing:listings(title)
                `)
                .eq('participant2_id', user.id)
                .order('last_message_at', { ascending: false });

            if (e1 || e2) throw (e1 || e2);

            let allChats = [...(asP1 || []), ...(asP2 || [])];

            // Sort by recent
            allChats.sort((a, b) => {
                const dateA = new Date(a.last_message_at || a.created_at).getTime();
                const dateB = new Date(b.last_message_at || b.created_at).getTime();
                return dateB - dateA;
            });

            // Map and get Unread Counts
            // Note: Getting unread counts for EACH chat in a loop is expensive.
            // Better: Get all unread messages for USER in one query? 
            // For now, let's just map the structure.

            const processedChats = allChats.map(c => ({
                ...c,
                // Normalize 'listing' -> 'listing_title'
                listing_title: c.listing?.title,
                unread_count: 0 // Placeholder until we fetch counts
            }));

            setChats(processedChats);
        } catch (error) {
            console.error('Error fetching chats:', error);
        } finally {
            setLoading(false);
        }
    };

    const subscribeToChats = () => {
        if (!user) return () => { };

        const channel = supabase
            .channel('public:conversations_list')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'conversations',
                filter: `participant1_id=eq.${user.id}`
            }, () => fetchChats())
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'conversations',
                filter: `participant2_id=eq.${user.id}`
            }, () => fetchChats())
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    };

    const filteredChats = chats.filter((chat) =>
        chat.other_user?.display_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (authLoading || loading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="text-center">
                        <Loader2 className="animate-spin h-12 w-12 text-[#FFB800] mx-auto" />
                        <p className="mt-4 text-zinc-500 font-mono text-xs tracking-widest uppercase">Syncing Encrypted Feeds...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-10 px-4 space-y-8 min-h-screen">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl border-l-4 border-[#FFB800] pl-4 text-white">
                        Terminal Link
                    </h1>
                    <p className="text-zinc-500 mt-2 font-mono text-sm uppercase tracking-wider">
                        Secure Communication Hub v2.0
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="px-3 py-1 font-mono text-[10px] border-[#FFB800]/20 bg-[#FFB800]/5 text-[#FFB800] animate-pulse">
                        ENCRYPTION STATUS: ACTIVE
                    </Badge>
                </div>
            </div>

            <Card className="border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden bg-black/50 backdrop-blur-sm">
                <CardHeader className="border-b border-white/5 bg-white/5 pb-6">
                    <div className="relative group max-w-md w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 group-focus-within:text-[#FFB800] transition-colors" />
                        <Input
                            placeholder="FILTER CONVERSATIONS..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 h-11 bg-black/50 border-white/10 font-mono text-xs tracking-widest uppercase focus:ring-1 focus:ring-[#FFB800] text-white placeholder:text-zinc-700"
                        />
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {filteredChats.length === 0 ? (
                        <div className="text-center py-24 bg-black/20">
                            <div className="h-20 w-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/5">
                                <MessageSquare className="h-10 w-10 text-zinc-700" />
                            </div>
                            <h3 className="text-xl font-black italic uppercase tracking-tighter mb-2 text-white">No Active Streams</h3>
                            <p className="text-zinc-500 mb-8 text-sm italic max-w-md mx-auto">
                                Connections will appear here once you initiate contact with a terminal provider (Seller).
                            </p>
                            <Button asChild className="font-bold uppercase tracking-widest text-xs h-12 px-10 bg-[#FFB800] text-black hover:bg-[#FFB800]/90">
                                <Link href="/listings">Initialize Marketplace</Link>
                            </Button>
                        </div>
                    ) : (
                        <div className="divide-y divide-white/5">
                            {filteredChats.map((chat) => (
                                <Link
                                    key={chat.id}
                                    href={`/chats/${chat.id}`}
                                    className="block group transition-all hover:bg-white/5"
                                >
                                    <div className="flex items-center gap-5 p-6 transition-all border-l-2 border-transparent hover:border-l-[#FFB800]">
                                        <div className="relative">
                                            <Avatar className="h-14 w-14 border border-white/10 shadow-md group-hover:scale-105 transition-transform">
                                                <AvatarImage src={chat.other_user?.avatar_url || chat.other_user?.photo_url || ''} />
                                                <AvatarFallback className="bg-zinc-800 text-zinc-500 font-black uppercase text-lg">
                                                    {chat.other_user?.display_name?.charAt(0).toUpperCase() || '?'}
                                                </AvatarFallback>
                                            </Avatar>
                                            {/* Unread indicator (simplified for now) */}
                                            {chat.unread_count! > 0 && (
                                                <span className="absolute -top-1 -right-1 h-5 w-5 bg-[#FFB800] rounded-full border-2 border-black flex items-center justify-center text-[10px] font-black text-black shadow-lg">
                                                    {chat.unread_count}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0 py-1">
                                            <div className="flex items-center justify-between mb-1.5">
                                                <div className="flex items-center gap-2 overflow-hidden">
                                                    <h3 className="font-black italic uppercase tracking-tighter text-base truncate text-white group-hover:text-[#FFB800] transition-colors">
                                                        {chat.other_user?.display_name || 'Unknown User'}
                                                    </h3>
                                                    {['dealer', 'student_seller'].includes(chat.other_user?.role as any) && (
                                                        <Badge variant="outline" className="text-[8px] h-4 py-0 font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                                                            MERCHANT
                                                        </Badge>
                                                    )}
                                                </div>
                                                {chat.last_message_at && (
                                                    <span className="text-[10px] font-mono text-zinc-600 bg-white/5 px-2 py-0.5 rounded leading-none">
                                                        {formatDistanceToNow(new Date(chat.last_message_at), { addSuffix: true })}
                                                    </span>
                                                )}
                                            </div>

                                            {chat.listing_title && (
                                                <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-[#FFB800] inline-block"></span>
                                                    Re: {chat.listing_title}
                                                </p>
                                            )}

                                            <div className="flex items-center justify-between gap-4">
                                                <p className={cn("text-sm line-clamp-1 transition-colors",
                                                    chat.unread_count! > 0 ? "font-bold text-white" : "text-zinc-400 font-medium italic"
                                                )}>
                                                    {chat.last_message || 'Initializing stream session...'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

// Helper for classnames
import { cn } from '@/lib/utils';
