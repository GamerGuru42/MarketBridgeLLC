'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Chat {
    id: string;
    participants: string[];
    listing_id: string | null;
    last_message: string | null;
    last_message_timestamp: string | null;
    created_at: string;
    other_user?: {
        id: string;
        display_name: string;
        photo_url: string | null;
        role: string;
    };
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
            subscribeToChats();
        }
    }, [user, authLoading]);

    const fetchChats = async () => {
        if (!user) return;

        try {
            // Fetch all chats where user is a participant
            const { data: chatsData, error } = await supabase
                .from('chats')
                .select('*')
                .contains('participants', [user.id])
                .order('last_message_timestamp', { ascending: false, nullsFirst: false });

            if (error) throw error;

            // Fetch other participants' details
            const chatsWithUsers = await Promise.all(
                (chatsData || []).map(async (chat) => {
                    const otherUserId = chat.participants.find((id: string) => id !== user.id);

                    if (otherUserId) {
                        const { data: userData } = await supabase
                            .from('users')
                            .select('id, display_name, photo_url, role')
                            .eq('id', otherUserId)
                            .single();

                        // Get unread message count
                        const { count } = await supabase
                            .from('messages')
                            .select('*', { count: 'exact', head: true })
                            .eq('chat_id', chat.id)
                            .eq('read', false)
                            .neq('sender_id', user.id);

                        return {
                            ...chat,
                            other_user: userData,
                            unread_count: count || 0,
                        };
                    }
                    return chat;
                })
            );

            setChats(chatsWithUsers);
        } catch (error) {
            console.error('Error fetching chats:', error);
        } finally {
            setLoading(false);
        }
    };

    const subscribeToChats = () => {
        if (!user) return;

        // Subscribe to new messages
        const subscription = supabase
            .channel('chats')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'messages',
                },
                () => {
                    fetchChats();
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
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
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                        <p className="mt-4 text-muted-foreground">Loading chats...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-10 px-4 space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl border-l-4 border-primary pl-4">Terminal Link</h1>
                    <p className="text-muted-foreground mt-2 font-mono text-sm uppercase tracking-wider">Secure Communication Hub v1.0.4</p>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="px-3 py-1 font-mono text-[10px] border-primary/20 bg-primary/5 animate-pulse">
                        ENCRYPTION STATUS: ACTIVE
                    </Badge>
                </div>
            </div>

            <Card className="border-primary/10 shadow-xl overflow-hidden bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-sm">
                <CardHeader className="border-b bg-muted/30 pb-6">
                    <div className="relative group max-w-md w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                        <Input
                            placeholder="FILTER CONVERSATIONS..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 h-11 bg-background/50 border-slate-200 dark:border-slate-800 font-mono text-xs tracking-widest uppercase focus:ring-1 focus:ring-primary"
                        />
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {filteredChats.length === 0 ? (
                        <div className="text-center py-24 bg-background/50">
                            <div className="h-20 w-20 bg-muted/20 rounded-full flex items-center justify-center mx-auto mb-6">
                                <MessageSquare className="h-10 w-10 text-muted-foreground opacity-30" />
                            </div>
                            <h3 className="text-xl font-black italic uppercase tracking-tighter mb-2">No Active Streams</h3>
                            <p className="text-muted-foreground mb-8 text-sm italic">
                                Connections will appear here once you initiate contact with a terminal provider.
                            </p>
                            <Button asChild className="font-bold uppercase tracking-widest text-xs h-12 px-10">
                                <Link href="/listings">Initialize Marketplace</Link>
                            </Button>
                        </div>
                    ) : (
                        <div className="divide-y divide-border">
                            {filteredChats.map((chat) => (
                                <Link
                                    key={chat.id}
                                    href={`/chats/${chat.id}`}
                                    className="block group transition-all"
                                >
                                    <div className="flex items-center gap-5 p-6 hover:bg-primary/5 dark:hover:bg-primary/10 transition-all border-l-0 hover:border-l-4 border-primary">
                                        <div className="relative">
                                            <Avatar className="h-14 w-14 border-2 border-background shadow-md group-hover:scale-105 transition-transform">
                                                <AvatarImage src={chat.other_user?.photo_url || ''} />
                                                <AvatarFallback className="bg-primary/10 text-primary font-black uppercase">
                                                    {chat.other_user?.display_name.charAt(0).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            {chat.unread_count! > 0 && (
                                                <span className="absolute -top-1 -right-1 h-5 w-5 bg-primary rounded-full border-2 border-background flex items-center justify-center text-[10px] font-black text-white shadow-lg">
                                                    {chat.unread_count}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0 py-1">
                                            <div className="flex items-center justify-between mb-1.5">
                                                <div className="flex items-center gap-2 overflow-hidden">
                                                    <h3 className="font-black italic uppercase tracking-tighter text-base truncate group-hover:text-primary transition-colors">
                                                        {chat.other_user?.display_name}
                                                    </h3>
                                                    {chat.other_user?.role === 'dealer' && (
                                                        <Badge variant="outline" className="text-[8px] h-4 py-0 font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                                                            DEALER
                                                        </Badge>
                                                    )}
                                                </div>
                                                {chat.last_message_timestamp && (
                                                    <span className="text-[10px] font-mono text-muted-foreground bg-muted/50 px-2 py-0.5 rounded leading-none">
                                                        {new Date(chat.last_message_timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center justify-between gap-4">
                                                <p className={`text-sm line-clamp-1 transition-colors ${chat.unread_count! > 0 ? 'font-bold text-foreground' : 'text-muted-foreground font-medium italic'}`}>
                                                    {chat.last_message || 'Initializing stream session...'}
                                                </p>
                                                {chat.unread_count === 0 && (
                                                    <div className="h-1.5 w-1.5 rounded-full bg-slate-300 dark:bg-slate-700 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                )}
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
