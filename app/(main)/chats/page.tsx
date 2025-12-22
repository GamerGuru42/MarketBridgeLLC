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
        <div className="container mx-auto px-4 py-8">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <MessageSquare className="h-6 w-6" />
                            Messages
                        </CardTitle>
                    </div>
                    <div className="mt-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search conversations..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {filteredChats.length === 0 ? (
                        <div className="text-center py-12">
                            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No conversations yet</h3>
                            <p className="text-muted-foreground mb-4">
                                Start a conversation with a dealer from a product listing
                            </p>
                            <Button asChild>
                                <Link href="/listings">Browse Listings</Link>
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {filteredChats.map((chat) => (
                                <Link
                                    key={chat.id}
                                    href={`/chats/${chat.id}`}
                                    className="block"
                                >
                                    <div className="flex items-center gap-4 p-4 rounded-lg hover:bg-muted/50 transition-colors border">
                                        <Avatar className="h-12 w-12">
                                            <AvatarImage src={chat.other_user?.photo_url || ''} />
                                            <AvatarFallback>
                                                {chat.other_user?.display_name.charAt(0).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <h3 className="font-semibold truncate">
                                                    {chat.other_user?.display_name}
                                                </h3>
                                                {chat.last_message_timestamp && (
                                                    <span className="text-xs text-muted-foreground">
                                                        {new Date(chat.last_message_timestamp).toLocaleDateString()}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <p className="text-sm text-muted-foreground truncate">
                                                    {chat.last_message || 'No messages yet'}
                                                </p>
                                                {chat.unread_count! > 0 && (
                                                    <Badge variant="default" className="ml-2">
                                                        {chat.unread_count}
                                                    </Badge>
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
