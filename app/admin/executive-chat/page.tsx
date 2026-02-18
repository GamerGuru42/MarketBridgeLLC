'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
    Loader2,
    Send,
    MessageSquare,
    Hash,
    Lock,
    Users,
    Circle,
    Search,
    ChevronRight,
    AtSign
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';

// Executive Chat connected to Supabase
import { supabase } from '@/lib/supabase';
type DbMessage = {
    id: string;
    channel_id: string;
    sender_id: string;
    role: string | null;
    content: string;
    created_at: string;
    sender?: {
        display_name: string;
        role: string;
    }
}

export default function ExecutiveChatPage() {
    const { user, loading: authLoading } = useAuth();
    const [messages, setMessages] = useState<any[]>([]);
    const [channels, setChannels] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [activeChannel, setActiveChannel] = useState<any>(null);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const [error, setError] = useState<string | null>(null);

    // 1. Fetch Channels
    useEffect(() => {
        const fetchChannels = async () => {
            try {
                const { data, error } = await supabase
                    .from('admin_channels')
                    .select('*')
                    .order('is_dm', { ascending: true })
                    .order('name', { ascending: true });

                if (error) throw error;
                setChannels(data || []);
                if (data && data.length > 0) {
                    setActiveChannel(data[0]);
                }
            } catch (err) {
                console.error('Failed to fetch channels:', err);
                setError('Failed to load command channels.');
            }
        };

        if (user) fetchChannels();
    }, [user]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, activeChannel]);

    // Load and Subscribe
    useEffect(() => {
        if (!user || !activeChannel) return;

        // 1. Fetch existing messages for channel
        const loadMessages = async () => {
            setError(null);
            setLoadingMessages(true);
            try {
                const { data, error } = await supabase
                    .from('admin_channel_messages')
                    .select(`
                        id,
                        channel_id,
                        sender_id,
                        content,
                        created_at,
                        role,
                        sender:users!sender_id(display_name, role)
                    `)
                    .eq('channel_id', activeChannel.id)
                    .order('created_at', { ascending: true })
                    .limit(100);

                if (error) {
                    if (error.code === '42P01') { // undefined_table
                        console.warn('Admin Chat table missing. Migration required.');
                        setError('System Offline: Database migration pending.');
                        return;
                    }
                    throw error;
                }

                // Map data to match UI needs
                const mapped = (data || []).map((m: any) => ({
                    id: m.id,
                    author: m.sender?.display_name || 'Unknown',
                    role: m.sender?.role || m.role || 'admin',
                    content: m.content,
                    timestamp: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    channelId: m.channel_id,
                    raw_time: m.created_at
                }));
                setMessages(mapped);
            } catch (err) {
                console.error('Chat Load Error:', err);
            } finally {
                setLoadingMessages(false);
            }
        };

        loadMessages();

        // 2. Subscribe to new messages
        const channel = supabase
            .channel(`admin-chat:${activeChannel.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'admin_channel_messages',
                    filter: `channel_id=eq.${activeChannel.id}`
                },
                async (payload) => {
                    // Fetch sender details
                    const { data: senderData } = await supabase
                        .from('users')
                        .select('display_name, role')
                        .eq('id', payload.new.sender_id)
                        .single();

                    const newMsg = {
                        id: payload.new.id,
                        author: senderData?.display_name || 'System',
                        role: senderData?.role || payload.new.role || 'bot',
                        content: payload.new.content,
                        timestamp: new Date(payload.new.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        channelId: payload.new.channel_id,
                        raw_time: payload.new.created_at
                    };

                    setMessages(prev => [...prev, newMsg]);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, activeChannel]);

    const handleSend = async () => {
        if (!newMessage.trim() || !user) return;

        const content = newMessage.trim();
        setNewMessage(''); // Clear immediately for UX

        try {
            const { error } = await supabase
                .from('admin_channel_messages')
                .insert({
                    channel_id: activeChannel.id,
                    sender_id: user.id,
                    content: content,
                    role: user.role // Cache role
                });

            if (error) {
                console.error('Send failed:', error);
                setNewMessage(content); // Restore if failed
                alert('Failed to transmit message.');
            }
        } catch (err) {
            console.error('Send error:', err);
        }
    };

    if (authLoading) return <div className="flex h-[calc(100vh-140px)] items-center justify-center bg-slate-950 rounded-xl border border-slate-800"><Loader2 className="animate-spin text-primary" /></div>;

    if (!activeChannel && !loadingMessages) {
        return (
            <div className="flex h-[calc(100vh-140px)] flex-col items-center justify-center bg-slate-950 rounded-xl border border-slate-800 text-center p-8">
                <MessageSquare className="h-12 w-12 text-slate-800 mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">No Comm Channels Found</h3>
                <p className="text-slate-500 max-w-md">Initialize the admin infrastructure using the provided SQL script to activate executive communication.</p>
            </div>
        );
    }

    if (!activeChannel) return <div className="flex h-[calc(100vh-140px)] items-center justify-center bg-slate-950 rounded-xl border border-slate-800"><Loader2 className="animate-spin text-primary" /></div>;

    // Filter logic not needed on client side as we fetch per channel
    // but we reuse the variable for render
    const filteredMessages = messages;

    return (
        <div className="flex h-[calc(100vh-140px)] bg-slate-950 rounded-xl border border-slate-800 overflow-hidden shadow-2xl">
            {/* Sidebar */}
            <div className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col">
                <div className="p-4 bg-slate-950/50 border-b border-slate-800 flex items-center justify-between">
                    <h2 className="text-white font-black italic tracking-tighter flex items-center gap-2">
                        <AtSign className="h-4 w-4 text-primary" />
                        COLLAB
                    </h2>
                    <Badge variant="outline" className="text-[8px] border-slate-700 text-slate-400">HQ</Badge>
                </div>

                <div className="flex-1 overflow-y-auto py-4">
                    <div className="px-4 mb-6">
                        <div className="relative">
                            <Search className="absolute left-2 top-2.5 h-3 w-3 text-slate-500" />
                            <input className="w-full bg-slate-800 border-none rounded-md py-2 pl-7 pr-3 text-[10px] text-white outline-none focus:ring-1 focus:ring-primary" placeholder="Jump to..." />
                        </div>
                    </div>

                    <div className="space-y-1 px-2">
                        <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Channels</p>
                        {channels.filter(ch => !ch.is_dm).map(ch => (
                            <button
                                key={ch.id}
                                onClick={() => setActiveChannel(ch)}
                                className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${activeChannel.id === ch.id ? 'bg-primary text-white font-bold' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                            >
                                {ch.type === 'private' ? <Lock className="h-3 w-3" /> : <Hash className="h-3 w-3" />}
                                {ch.name}
                            </button>
                        ))}
                    </div>

                    <div className="mt-8 space-y-1 px-2">
                        <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Direct Messages</p>
                        {channels.filter(ch => ch.is_dm).map((ch: any) => (
                            <button
                                key={ch.id}
                                onClick={() => setActiveChannel(ch)}
                                className={`w-full flex items-center justify-between px-3 py-1.5 rounded-md text-xs transition-colors ${activeChannel.id === ch.id ? 'bg-primary/20 text-white font-bold border border-primary/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                            >
                                <div className="flex items-center gap-2">
                                    <Circle className={`h-2 w-2 ${activeChannel.id === ch.id ? 'fill-primary text-primary' : 'fill-green-500 text-green-500'}`} />
                                    <span>{ch.label || ch.name}</span>
                                </div>
                                {activeChannel.id === ch.id && <ChevronRight className="h-3 w-3 text-primary" />}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="p-4 bg-slate-950/30 border-t border-slate-800">
                    <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 border border-primary/30">
                            <AvatarFallback delayMs={1000}>{user?.displayName?.[0] || 'A'}</AvatarFallback>
                        </Avatar>
                        <div className="overflow-hidden">
                            <p className="text-[10px] font-bold text-white truncate">{user?.displayName}</p>
                            <p className="text-[8px] text-slate-500 uppercase font-bold tracking-tighter">{user?.role}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col bg-slate-950">
                <div className="h-14 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-900/20">
                    <div className="flex items-center gap-2">
                        <Hash className="h-4 w-4 text-slate-400" />
                        <h3 className="font-bold text-white text-sm">{(activeChannel as any).label || activeChannel.name}</h3>
                        <Separator orientation="vertical" className="h-4 bg-slate-800 mx-2" />
                        <span className="text-[10px] text-slate-500 font-medium">Internal Coordination Terminal</span>
                    </div>
                    {error && <span className="text-red-500 text-xs font-bold animate-pulse">{error}</span>}
                    <div className="flex items-center gap-4">
                        <Users className="h-4 w-4 text-slate-500 cursor-pointer hover:text-white" />
                        <Button variant="outline" size="sm" className="h-7 text-[10px] border-slate-700 bg-transparent text-slate-300 hover:bg-slate-800">
                            Archive Session
                        </Button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
                    {loadingMessages ? (
                        <div className="h-full flex items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-primary opacity-20" />
                        </div>
                    ) : filteredMessages.length === 0 && !error ? (
                        <div className="h-full flex flex-col items-center justify-center opacity-20">
                            <MessageSquare className="h-12 w-12 mb-2" />
                            <p className="text-sm font-medium">No intelligence reports in this channel yet.</p>
                        </div>
                    ) : null}
                    {filteredMessages.map((msg) => (
                        <div key={msg.id} className={`flex gap-4 group ${msg.author === (user?.displayName || 'Unknown') ? 'flex-row-reverse' : ''}`}>
                            <Avatar className="h-9 w-9 shrink-0 ring-2 ring-slate-800 group-hover:ring-primary/40 transition-all">
                                <AvatarFallback>{msg.author[0]}</AvatarFallback>
                            </Avatar>
                            <div className={`flex flex-col gap-1 max-w-[70%] ${msg.author === (user?.displayName || 'Unknown') ? 'items-end' : ''}`}>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-[10px] font-bold text-white uppercase tracking-tighter">{msg.author}</span>
                                    <Badge variant="outline" className={`text-[8px] h-3 px-1 font-black ${msg.role === 'ceo' ? 'border-primary text-primary' : 'border-slate-700 text-slate-500'}`}>
                                        {msg.role}
                                    </Badge>
                                    <span className="text-[8px] text-slate-600">{msg.timestamp}</span>
                                </div>
                                <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${msg.author === (user?.displayName || 'Unknown') ? 'bg-primary text-white rounded-tr-none shadow-[0_4px_12px_rgba(var(--primary-rgb),0.3)]' : 'bg-slate-800/80 text-slate-200 rounded-tl-none border border-slate-700/50'}`}>
                                    {msg.content}
                                </div>
                            </div>
                        </div>
                    ))}
                    <div ref={chatEndRef} />
                </div>

                <div className="p-4 bg-slate-900/20 border-t border-slate-800">
                    <div className="max-w-4xl mx-auto flex gap-3">
                        <div className="relative flex-1">
                            <Input
                                className="bg-slate-900 border-slate-800 text-slate-200 h-11 pr-12 focus-visible:ring-primary placeholder:text-slate-600"
                                placeholder={`Message ${(activeChannel as any).label ? '@' + (activeChannel as any).label : '#' + activeChannel.name}`}
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                disabled={!!error}
                            />
                            <Button
                                size="icon"
                                variant="ghost"
                                className="absolute right-1 top-1 h-9 w-9 text-slate-500 hover:text-primary transition-colors"
                                onClick={handleSend}
                                disabled={!!error}
                            >
                                <Send className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

