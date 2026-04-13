'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
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
    AtSign,
    Plus,
    UserPlus,
    Command,
    Terminal,
    Shield,
    Zap,
    MoreVertical,
    Settings,
    Smile,
    Paperclip
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from '@/lib/supabase';
import { useToast } from '@/contexts/ToastContext';

export default function ExecutiveChatPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();

    useEffect(() => {
        const ADMIN_ROLES = ['admin', 'technical_admin', 'operations_admin', 'marketing_admin', 'ceo', 'cofounder'];
        if (!authLoading && (!user || !ADMIN_ROLES.includes(user.role))) {
            router.replace('/portal/login');
        }
    }, [user, authLoading, router]);
    const [messages, setMessages] = useState<any[]>([]);
    const [channels, setChannels] = useState<any[]>([]);
    const [staff, setStaff] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [activeChannel, setActiveChannel] = useState<any>(null);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const [error, setError] = useState<string | null>(null);

    // Dialog States
    const [isCreateChannelOpen, setIsCreateChannelOpen] = useState(false);
    const [isNewDMOpen, setIsNewDMOpen] = useState(false);
    const [newChannelName, setNewChannelName] = useState('');
    const [newChannelType, setNewChannelType] = useState<'public' | 'private'>('public');

    // Sync Data
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch Channels - Safe select (only columns confirmed in migration)
                const { data: chanData, error: chanError } = await supabase
                    .from('admin_channels')
                    .select('*')
                    .order('created_at', { ascending: true });

                if (chanError) {
                    if (chanError.code === '42P01') {
                        setError('Infrastructure offline. Please provision system.');
                        return;
                    }
                    throw chanError;
                }

                setChannels(chanData || []);
                if (chanData && chanData.length > 0 && !activeChannel) {
                    setActiveChannel(chanData[0]);
                }

                // Fetch Staff
                const staffRoles = ['ceo', 'cofounder', 'admin', 'marketing_admin', 'operations_admin', 'technical_admin'];
                const { data: staffData } = await supabase
                    .from('users')
                    .select('id, display_name, role, photo_url')
                    .in('role', staffRoles);

                setStaff(staffData || []);
            } catch (err) {
                console.error('Core sync error:', err);
                setError('Signal degraded. Check uplink.');
            }
        };

        if (user) fetchData();
    }, [user]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, activeChannel]);

    // Load Messages & Realtime
    useEffect(() => {
        if (!user || !activeChannel) return;

        const loadMessages = async () => {
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
                        sender:users!sender_id(display_name, role, photo_url)
                    `)
                    .eq('channel_id', activeChannel.id)
                    .order('created_at', { ascending: true })
                    .limit(100);

                if (error) throw error;

                const mapped = (data || []).map((m: any) => ({
                    id: m.id,
                    author: m.sender?.display_name || 'System',
                    role: m.sender?.role || m.role || 'Staff',
                    content: m.content,
                    avatar: m.sender?.photo_url,
                    timestamp: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    senderId: m.sender_id
                }));
                setMessages(mapped);
            } catch (err) {
                console.error('Intel fetch error:', err);
            } finally {
                setLoadingMessages(false);
            }
        };

        loadMessages();

        const channel = supabase
            .channel(`relay-${activeChannel.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'admin_channel_messages',
                    filter: `channel_id=eq.${activeChannel.id}`
                },
                async (payload) => {
                    const { data: senderData } = await supabase
                        .from('users')
                        .select('display_name, role, photo_url')
                        .eq('id', payload.new.sender_id)
                        .single();

                    const newMsg = {
                        id: payload.new.id,
                        author: senderData?.display_name || 'Anonymous',
                        role: senderData?.role || payload.new.role || 'Staff',
                        content: payload.new.content,
                        avatar: senderData?.photo_url,
                        timestamp: new Date(payload.new.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        senderId: payload.new.sender_id
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
        if (!newMessage.trim() || !user || !activeChannel) return;

        const content = newMessage.trim();
        setNewMessage('');

        try {
            const { error } = await supabase
                .from('admin_channel_messages')
                .insert({
                    channel_id: activeChannel.id,
                    sender_id: user.id,
                    content: content,
                    role: user.role
                });

            if (error) throw error;
        } catch (err) {
            console.error('TX failed:', err);
            setNewMessage(content);
            toast('Signal blocked. Retry broadcast.', 'error');
        }
    };

    const handleCreateChannel = async () => {
        if (!newChannelName.trim() || !user) return;

        try {
            const id = `ch-${Date.now()}`;
            const { data, error } = await supabase
                .from('admin_channels')
                .insert({
                    id,
                    name: newChannelName.trim(),
                    type: newChannelType
                })
                .select()
                .single();

            if (error) throw error;

            setChannels(prev => [...prev, data]);
            setActiveChannel(data);
            setIsCreateChannelOpen(false);
            setNewChannelName('');
            toast(`Encrypted node #${data.name} online.`, 'success');
        } catch (err) {
            console.error('Node construction failed:', err);
            toast('Authorization failed or matrix unstable.', 'error');
        }
    };

    const startDM = async (otherUser: any) => {
        if (!user) return;

        const dmId = [user.id, otherUser.id].sort().join('-vs-');
        const existing = channels.find(c => c.id === dmId);

        if (existing) {
            setActiveChannel(existing);
            setIsNewDMOpen(false);
            return;
        }

        try {
            // Safe upsert (minimal columns to avoid schema mismatch race conditions)
            const { data, error } = await supabase
                .from('admin_channels')
                .upsert(
                    {
                        id: dmId,
                        name: `Secure line: ${otherUser.display_name}`,
                        type: 'private'
                    },
                    { onConflict: 'id' }
                )
                .select()
                .single();

            if (error) throw error;

            // Remove if already exists in state visually and prepend updated
            setChannels(prev => [...prev.filter(c => c.id !== data.id), data]);
            setActiveChannel(data);
            setIsNewDMOpen(false);
            toast(`Private relay with ${otherUser.display_name} activated.`, 'success');
        } catch (err) {
            console.error('Secure line failed:', err);
            toast('Secure handshake rejected.', 'error');
        }
    };

    const [isInitializing, setIsInitializing] = useState(false);
    const initializeSystem = async () => {
        if (!user || isInitializing) return;
        setIsInitializing(true);
        try {
            const defaultChannels = [
                { id: 'gen', name: 'general-ops', label: 'General Ops', type: 'public', is_dm: false },
                { id: 'strat', name: 'ceo-strategy', label: 'CEO Strategy', type: 'private', is_dm: false },
                { id: 'tech', name: 'tech-signals', label: 'Tech Signals', type: 'public', is_dm: false },
                { id: 'abj', name: 'ops-abuja', label: 'Abuja Node', type: 'public', is_dm: false }
            ];

            const { error } = await supabase
                .from('admin_channels')
                .upsert(defaultChannels, { onConflict: 'id' });

            if (error) throw error;
            toast('Manual trigger successful. Refreshing nodes...', 'success');
            setTimeout(() => window.location.reload(), 1500);
        } catch (err: any) {
            console.error('Init failure:', err);
            toast('Initialization rejected by database. Manual SQL execution required.', 'error');
        } finally {
            setIsInitializing(false);
        }
    };

    if (authLoading) return <div className="flex h-[calc(100vh-140px)] items-center justify-center bg-background rounded-3xl border border-border"><Loader2 className="animate-spin text-primary h-12 w-12" /></div>;

    if (error || (channels.length === 0 && !loadingMessages)) {
        return (
            <div className="flex h-[calc(100vh-140px)] flex-col items-center justify-center bg-card rounded-[3rem] border border-border text-center p-12 relative overflow-hidden">
                <div className="absolute inset-0 bg-primary/5 blur-[120px] rounded-full animate-pulse pointer-events-none" />
                <div className="relative mb-8 h-24 w-24 bg-background border border-border rounded-[2rem] flex items-center justify-center shadow-2xl group hover:scale-110 transition-transform">
                    <Terminal className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-4xl font-black uppercase tracking-tighter text-foreground italic mb-4">Relay <span className="text-primary">Matrix</span> Offline</h3>
                <p className="text-muted-foreground max-w-sm mb-12 font-medium leading-relaxed opacity-70 italic font-heading">
                    The executive communication grid is currently inactive or unreachable. Deploy the secure infrastructure to enable personnel coordination.
                </p>
                <div className="flex flex-col gap-4">
                    <Button
                        onClick={initializeSystem}
                        disabled={isInitializing}
                        className="h-16 px-12 bg-primary hover:opacity-90 text-primary-foreground font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-primary/20 transition-all border-none"
                    >
                        {isInitializing ? (
                            <><Loader2 className="mr-3 h-6 w-6 animate-spin" /> Provisioning nodes...</>
                        ) : (
                            "Activate Secure Link ⚡"
                        )}
                    </Button>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-40">
                        {error?.includes('42P01') ? "Table Missing: Manual activation required in SQL Editor." : "Check Uplink Connection."}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-[calc(100vh-140px)] bg-card rounded-[2.5rem] border border-border overflow-hidden shadow-2xl transition-all duration-300">
            {/* Sidebar: Chat List */}
            <div className="w-80 bg-muted/20 border-r border-border flex flex-col">
                <div className="p-8 border-b border-border bg-card/40 backdrop-blur-md">
                    <h2 className="text-xl font-black italic tracking-tighter uppercase text-foreground">
                        Admin<span className="text-primary">Chat</span>
                    </h2>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1 opacity-60">HQ Communication Hub</p>
                </div>

                <ScrollArea className="flex-1">
                    <div className="p-6 space-y-8">
                        {/* 1. Public Channels */}
                        <div>
                            <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.3em] mb-4 pl-2">Channels</p>
                            <div className="space-y-1">
                                {channels.filter(ch => !ch.id.includes('-vs-')).map(ch => (
                                    <button
                                        key={ch.id}
                                        onClick={() => setActiveChannel(ch)}
                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold uppercase tracking-tight transition-all ${activeChannel?.id === ch.id ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'}`}
                                    >
                                        <Hash className={`h-4 w-4 ${activeChannel?.id === ch.id ? 'text-primary-foreground' : 'text-primary'}`} />
                                        {ch.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 2. Key Admins (WhatsApp Style List) */}
                        <div>
                            <div className="flex items-center justify-between px-2 mb-4">
                                <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.3em]">Department Leads</p>
                                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setIsNewDMOpen(true)}>
                                    <UserPlus className="h-3 w-3" />
                                </Button>
                            </div>
                            <div className="space-y-1">
                                {staff.filter(s => s.id !== user?.id).map((member) => {
                                    const dmId = [user?.id, member.id].sort().join('-vs-');
                                    const isActive = activeChannel?.id === dmId;
                                    return (
                                        <button
                                            key={member.id}
                                            onClick={() => startDM(member)}
                                            className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all ${isActive ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted/50 border border-transparent'}`}
                                        >
                                            <div className="relative">
                                                <Avatar className="h-10 w-10 border border-border">
                                                    <AvatarImage src={member.avatar_url} />
                                                    <AvatarFallback className="text-[10px] font-black">{member.display_name?.[0]}</AvatarFallback>
                                                </Avatar>
                                                <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 border-2 border-background rounded-full" />
                                            </div>
                                            <div className="text-left overflow-hidden">
                                                <p className={`text-xs font-black uppercase italic tracking-tighter truncate ${isActive ? 'text-primary' : 'text-foreground'}`}>
                                                    {member.display_name}
                                                </p>
                                                <p className="text-[9px] font-bold text-muted-foreground uppercase opacity-60 truncate">
                                                    {member.role?.split('_').join(' ')}
                                                </p>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </ScrollArea>

                {/* Self Profile */}
                <div className="p-6 border-t border-border bg-card/40">
                    <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 border border-primary/20">
                            <AvatarImage src={user?.photoURL} />
                            <AvatarFallback className="text-[10px] font-black">{user?.displayName?.[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 overflow-hidden">
                            <p className="text-xs font-black text-foreground truncate italic">{user?.displayName}</p>
                            <p className="text-[9px] text-muted-foreground uppercase font-bold">CEO (You)</p>
                        </div>
                        <Settings className="h-4 w-4 text-muted-foreground hover:text-primary cursor-pointer transition-colors" />
                    </div>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col bg-background relative">
                {/* Header: Identity Bar */}
                <div className="h-24 border-b border-border flex items-center justify-between px-10 bg-card/60 backdrop-blur-md sticky top-0 z-10">
                    <div className="flex items-center gap-5">
                        {activeChannel?.id.includes('-vs-') ? (
                            // Showing specific Admin we are chatting with
                            <div className="flex items-center gap-4">
                                <Avatar className="h-12 w-12 border-2 border-primary/20 shadow-lg">
                                    <AvatarFallback className="font-black text-sm bg-primary text-primary-foreground">
                                        {activeChannel.name.replace('Secure line: ', '')[0]}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <h3 className="font-black text-foreground text-xl italic tracking-tighter uppercase">
                                        {activeChannel.name.replace('Secure line: ', '')}
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                        <span className="text-[10px] text-green-500 font-black uppercase tracking-widest">Active Chat</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            // Group Channel View
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                                    <Hash className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="font-black text-foreground text-xl italic tracking-tighter uppercase">{activeChannel?.name}</h3>
                                    <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest opacity-60">Department-wide Broadcast</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        <Button variant="outline" className="h-11 px-6 rounded-2xl border-border bg-background text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground shadow-sm">
                            <Shield className="h-4 w-4 mr-2 text-primary" />
                            Secure Session
                        </Button>
                        <Button variant="ghost" size="icon" className="h-11 w-11 text-muted-foreground">
                            <MoreVertical className="h-5 w-5" />
                        </Button>
                    </div>
                </div>

                <ScrollArea className="flex-1 p-10">
                    <div className="space-y-10 max-w-4xl mx-auto">
                        {loadingMessages ? (
                            <div className="h-full flex items-center justify-center py-24">
                                <Loader2 className="h-12 w-12 animate-spin text-primary opacity-20" />
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-40 text-center">
                                <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-6">
                                    <MessageSquare className="h-8 w-8 text-muted-foreground/40" />
                                </div>
                                <p className="text-xl font-black uppercase italic tracking-tighter text-foreground/40">Start the conversation</p>
                                <p className="text-xs font-bold uppercase tracking-widest mt-2 text-muted-foreground/30">Your messages are encrypted end-to-end.</p>
                            </div>
                        ) : null}

                        {messages.map((msg, i) => {
                            const isMe = msg.senderId === user?.id;
                            return (
                                <div key={msg.id} className={`flex gap-4 group animate-in fade-in slide-in-from-bottom-2 duration-300 ${isMe ? 'flex-row-reverse text-right' : 'text-left'}`}>
                                    {!isMe && (
                                        <Avatar className="h-10 w-10 shrink-0 border border-border mt-1">
                                            <AvatarImage src={msg.avatar} />
                                            <AvatarFallback className="font-black text-xs uppercase bg-muted text-primary">{msg.author[0]}</AvatarFallback>
                                        </Avatar>
                                    )}
                                    <div className={`flex flex-col gap-1.5 max-w-[80%] ${isMe ? 'items-end' : 'items-start'}`}>
                                        <div className={`flex items-center gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                                            <span className="text-[10px] font-black text-foreground uppercase tracking-tight italic">{msg.author}</span>
                                            <span className="text-[9px] font-bold text-muted-foreground/40">{msg.timestamp}</span>
                                        </div>
                                        <div className={`px-6 py-4 rounded-3xl text-sm leading-relaxed ${isMe ? 'bg-primary text-primary-foreground rounded-tr-none shadow-lg shadow-primary/10' : 'bg-card text-foreground rounded-tl-none border border-border'}`}>
                                            {msg.content}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={chatEndRef} className="h-8" />
                    </div>
                </ScrollArea>

                {/* Input Area */}
                <div className="p-8 bg-background border-t border-border sticky bottom-0">
                    <div className="max-w-4xl mx-auto">
                        <div className="relative flex items-center gap-3 bg-card border border-border rounded-[2rem] p-3 focus-within:border-primary/50 transition-all shadow-xl shadow-black/5">
                            <Button variant="ghost" size="icon" className="h-12 w-12 rounded-full text-muted-foreground hover:text-primary">
                                <Plus className="h-5 w-5" />
                            </Button>
                            <Input
                                className="bg-transparent border-none text-foreground h-12 focus-visible:ring-0 placeholder:text-muted-foreground/30 font-medium text-sm"
                                placeholder={`Message ${activeChannel?.id.includes('-vs-') ? activeChannel.name.replace('Secure line: ', '') : activeChannel?.name}...`}
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            />
                            <div className="flex items-center gap-1 pr-1">
                                <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground/40 hover:text-primary">
                                    <Smile className="h-5 w-5" />
                                </Button>
                                <Button
                                    size="icon"
                                    className="h-12 w-12 bg-primary text-primary-foreground hover:opacity-90 rounded-2xl shadow-lg shadow-primary/20 active:scale-95 transition-all"
                                    onClick={handleSend}
                                    disabled={!newMessage.trim()}
                                >
                                    <Send className="h-5 w-5" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* DM Dialog stays for secondary use */}
            <Dialog open={isNewDMOpen} onOpenChange={setIsNewDMOpen}>
                <DialogContent className="bg-card border-border rounded-[2rem] max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black uppercase tracking-tighter italic">Personal <span className="text-primary">Handshake</span></DialogTitle>
                        <DialogDescription className="uppercase text-[10px] font-bold tracking-widest opacity-60">Connect with a department lead.</DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="h-[300px] mt-4">
                        <div className="space-y-2 pr-4">
                            {staff.filter(s => s.id !== user?.id).map((member) => (
                                <button
                                    key={member.id}
                                    onClick={() => startDM(member)}
                                    className="w-full flex items-center justify-between p-4 rounded-2xl bg-muted/40 hover:bg-primary/10 transition-all border border-transparent hover:border-primary/20"
                                >
                                    <div className="flex items-center gap-4 text-left">
                                        <Avatar className="h-10 w-10 border border-border">
                                            <AvatarImage src={member.avatar_url} />
                                            <AvatarFallback className="font-black text-xs">{member.display_name?.[0]}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-black uppercase italic tracking-tighter text-sm">{member.display_name}</p>
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-60">{member.role?.split('_').join(' ')}</p>
                                        </div>
                                    </div>
                                    <ChevronRight className="h-4 w-4 text-muted-foreground/30" />
                                </button>
                            ))}
                        </div>
                    </ScrollArea>
                </DialogContent>
            </Dialog>
        </div>
    );
}
