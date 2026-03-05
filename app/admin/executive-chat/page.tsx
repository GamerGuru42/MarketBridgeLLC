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
    const { toast } = useToast();
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
                    .select('id, display_name, role, avatar_url')
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
                        sender:users!sender_id(display_name, role, avatar_url)
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
                    avatar: m.sender?.avatar_url,
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
                        .select('display_name, role, avatar_url')
                        .eq('id', payload.new.sender_id)
                        .single();

                    const newMsg = {
                        id: payload.new.id,
                        author: senderData?.display_name || 'Anonymous',
                        role: senderData?.role || payload.new.role || 'Staff',
                        content: payload.new.content,
                        avatar: senderData?.avatar_url,
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
            // Safe insert (minimal columns to avoid schema mismatch)
            const { data, error } = await supabase
                .from('admin_channels')
                .insert({
                    id: dmId,
                    name: `Secure line: ${otherUser.display_name}`,
                    type: 'private'
                })
                .select()
                .single();

            if (error) throw error;

            setChannels(prev => [...prev, data]);
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
                { id: 'gen', name: 'general-ops', type: 'public' },
                { id: 'strat', name: 'ceo-strategy', type: 'private' },
                { id: 'tech', name: 'tech-signals', type: 'public' },
                { id: 'abj', name: 'ops-abuja', type: 'public' }
            ];

            const { error } = await supabase
                .from('admin_channels')
                .upsert(defaultChannels, { onConflict: 'id' });

            if (error) throw error;
            window.location.reload();
        } catch (err: any) {
            console.error('Init failure:', err);
            toast('Matrix initialization error.', 'error');
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
            </div>
        );
    }

    return (
        <div className="flex h-[calc(100vh-140px)] bg-card rounded-[2.5rem] border border-border overflow-hidden shadow-2xl transition-all duration-300">
            {/* Sidebar */}
            <div className="w-80 bg-muted/30 border-r border-border flex flex-col">
                <div className="p-8 border-b border-border bg-card/40 backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                        <div className="h-4 w-4 rounded-full bg-primary animate-pulse" />
                        <h2 className="text-foreground font-black italic tracking-tighter uppercase text-lg">
                            Intel<span className="text-primary">Relay</span>
                        </h2>
                    </div>
                </div>

                <ScrollArea className="flex-1 py-8">
                    <div className="px-6 mb-8">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40" />
                            <input className="w-full bg-background/50 border border-border/50 rounded-xl py-2.5 pl-10 pr-4 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary/30 transition-all placeholder:text-muted-foreground/30" placeholder="Filter transmissions..." />
                        </div>
                    </div>

                    <div className="space-y-8 px-4">
                        <div>
                            <div className="flex items-center justify-between px-4 mb-4">
                                <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.4em] italic">Channels</p>
                                <Dialog open={isCreateChannelOpen} onOpenChange={setIsCreateChannelOpen}>
                                    <DialogTrigger asChild>
                                        <Plus className="h-4 w-4 text-muted-foreground hover:text-primary cursor-pointer transition-colors" />
                                    </DialogTrigger>
                                    <DialogContent className="bg-card border-border rounded-[2rem]">
                                        <DialogHeader>
                                            <DialogTitle className="text-2xl font-black uppercase tracking-tighter italic">Establish <span className="text-primary">Node</span></DialogTitle>
                                            <DialogDescription className="uppercase text-[10px] font-bold tracking-widest opacity-60">Create a shared communication sector.</DialogDescription>
                                        </DialogHeader>
                                        <div className="py-6 space-y-4">
                                            <Input
                                                placeholder="Sector Identifier (e.g. logistics)"
                                                className="h-14 rounded-2xl bg-muted border-border font-bold uppercase tracking-tighter"
                                                value={newChannelName}
                                                onChange={(e) => setNewChannelName(e.target.value)}
                                            />
                                            <div className="flex gap-4">
                                                <Button
                                                    variant={newChannelType === 'public' ? 'default' : 'outline'}
                                                    onClick={() => setNewChannelType('public')}
                                                    className="flex-1 rounded-xl h-12 uppercase font-black text-[10px] tracking-widest"
                                                >
                                                    <Hash className="h-4 w-4 mr-2" /> Public
                                                </Button>
                                                <Button
                                                    variant={newChannelType === 'private' ? 'default' : 'outline'}
                                                    onClick={() => setNewChannelType('private')}
                                                    className="flex-1 rounded-xl h-12 uppercase font-black text-[10px] tracking-widest"
                                                >
                                                    <Lock className="h-4 w-4 mr-2" /> Private
                                                </Button>
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button onClick={handleCreateChannel} className="h-14 w-full rounded-2xl bg-primary font-black uppercase tracking-widest">Construct Node</Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </div>
                            <div className="space-y-1">
                                {channels.filter(ch => !ch.id.includes('-vs-')).map(ch => (
                                    <button
                                        key={ch.id}
                                        onClick={() => setActiveChannel(ch)}
                                        className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest italic transition-all ${activeChannel?.id === ch.id ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'text-muted-foreground/60 hover:bg-muted/50 hover:text-foreground'}`}
                                    >
                                        {ch.type === 'private' ? <Lock className="h-4 w-4" /> : <Hash className="h-4 w-4" />}
                                        {ch.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between px-4 mb-4">
                                <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.4em] italic">Direct Relay</p>
                                <Dialog open={isNewDMOpen} onOpenChange={setIsNewDMOpen}>
                                    <DialogTrigger asChild>
                                        <UserPlus className="h-4 w-4 text-muted-foreground hover:text-primary cursor-pointer transition-colors" />
                                    </DialogTrigger>
                                    <DialogContent className="bg-card border-border rounded-[2rem] max-w-md">
                                        <DialogHeader>
                                            <DialogTitle className="text-2xl font-black uppercase tracking-tighter italic">Personal <span className="text-primary">Uplink</span></DialogTitle>
                                            <DialogDescription className="uppercase text-[10px] font-bold tracking-widest opacity-60">Establish a private peer-to-peer signal.</DialogDescription>
                                        </DialogHeader>
                                        <ScrollArea className="h-[400px] mt-6 -mr-4 pr-4">
                                            <div className="space-y-2">
                                                {staff.filter(s => s.id !== user?.id).map((member) => (
                                                    <button
                                                        key={member.id}
                                                        onClick={() => startDM(member)}
                                                        className="w-full flex items-center justify-between p-4 rounded-2xl bg-muted/40 hover:bg-primary/10 transition-all border border-transparent hover:border-primary/20 group"
                                                    >
                                                        <div className="flex items-center gap-4 text-left">
                                                            <Avatar className="h-10 w-10 border border-border shadow-sm">
                                                                <AvatarImage src={member.avatar_url} />
                                                                <AvatarFallback className="font-black text-xs">{member.display_name?.[0]}</AvatarFallback>
                                                            </Avatar>
                                                            <div>
                                                                <p className="font-black uppercase italic tracking-tighter text-sm group-hover:text-primary transition-colors">{member.display_name}</p>
                                                                <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-60">{member.role?.split('_').join(' ')}</p>
                                                            </div>
                                                        </div>
                                                        <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                                                    </button>
                                                ))}
                                            </div>
                                        </ScrollArea>
                                    </DialogContent>
                                </Dialog>
                            </div>
                            <div className="space-y-1">
                                {channels.filter(ch => ch.id.includes('-vs-')).map((ch: any) => (
                                    <button
                                        key={ch.id}
                                        onClick={() => setActiveChannel(ch)}
                                        className={`w-full flex items-center justify-between px-5 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest italic transition-all ${activeChannel?.id === ch.id ? 'bg-primary/10 text-primary border border-primary/20' : 'text-muted-foreground/60 hover:bg-muted/50 hover:text-foreground'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <Circle className={`h-2.5 w-2.5 ${activeChannel?.id === ch.id ? 'fill-primary text-primary' : 'fill-green-500/40 text-green-500'}`} />
                                            <span className="truncate max-w-[150px]">{ch.name.replace('Secure line: ', '')}</span>
                                        </div>
                                        {activeChannel?.id === ch.id && <Zap className="h-3.5 w-3.5 text-primary animate-pulse" />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </ScrollArea>

                <div className="p-8 border-t border-border bg-card transition-colors">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <Avatar className="h-11 w-11 border border-primary/30 shadow-lg ring-2 ring-background">
                                <AvatarImage src={user?.avatar_url} />
                                <AvatarFallback className="font-black text-xs text-primary">{user?.displayName?.[0] || 'A'}</AvatarFallback>
                            </Avatar>
                            <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-green-500 border-2 border-background rounded-full" />
                        </div>
                        <div className="overflow-hidden flex-1">
                            <p className="text-xs font-black text-foreground truncate italic group-hover:text-primary transition-colors cursor-default">{user?.displayName}</p>
                            <p className="text-[9px] text-muted-foreground/60 uppercase font-black tracking-widest">{user?.role?.split('_').join(' ')}</p>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                            <Settings className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col bg-background relative transition-colors">
                <div className="h-24 border-b border-border flex items-center justify-between px-10 bg-card/60 backdrop-blur-xl sticky top-0 z-10">
                    <div className="flex items-center gap-5">
                        <div className="h-12 w-12 rounded-2xl bg-muted border border-border flex items-center justify-center text-primary group-hover:scale-105 transition-transform shadow-sm">
                            {activeChannel?.type === 'private' || activeChannel?.id.includes('-vs-') ? <Lock className="h-6 w-6" /> : <Hash className="h-6 w-6" />}
                        </div>
                        <div>
                            <h3 className="font-black text-foreground text-xl italic tracking-tighter uppercase">{activeChannel?.name}</h3>
                            <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                                <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest opacity-60">High-Fidelity Broadcast Active</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="icon" className="h-11 w-11 rounded-2xl border-border text-muted-foreground hover:text-primary shadow-sm">
                            <Users className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" className="h-11 px-8 rounded-2xl border-border bg-background text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground shadow-sm group">
                            <Shield className="h-4 w-4 mr-2 group-hover:text-primary transition-colors" />
                            Security Protocol
                        </Button>
                    </div>
                </div>

                <ScrollArea className="flex-1 p-10">
                    <div className="space-y-10 max-w-5xl mx-auto">
                        {loadingMessages ? (
                            <div className="h-full flex items-center justify-center py-24">
                                <Loader2 className="h-12 w-12 animate-spin text-primary opacity-20" />
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-40 opacity-20">
                                <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center mb-8 border border-border">
                                    <MessageSquare className="h-10 w-10" />
                                </div>
                                <p className="text-xl font-black uppercase italic tracking-tighter">Zero Broadcasts Detected</p>
                                <p className="text-xs font-bold uppercase tracking-widest mt-3 opacity-40 italic">Initialize tactical uplink below.</p>
                            </div>
                        ) : null}

                        {messages.map((msg, i) => {
                            const isMe = msg.senderId === user?.id;
                            return (
                                <div key={msg.id} className={`flex gap-6 group animate-in fade-in slide-in-from-bottom-3 duration-500 ${isMe ? 'flex-row-reverse text-right' : 'text-left'}`}>
                                    <Avatar className={`h-12 w-12 shrink-0 border border-border shadow-md transition-all duration-300 ${isMe ? 'ring-2 ring-primary/20' : 'group-hover:ring-2 group-hover:ring-primary/20'}`}>
                                        <AvatarImage src={msg.avatar} />
                                        <AvatarFallback className="font-black text-xs uppercase bg-muted text-primary">{msg.author[0]}</AvatarFallback>
                                    </Avatar>
                                    <div className={`flex flex-col gap-2.5 max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
                                        <div className={`flex items-center gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                                            <span className="text-xs font-black text-foreground uppercase tracking-tight italic">{msg.author}</span>
                                            <Badge variant="outline" className={`text-[8px] h-4 px-2 font-black uppercase border-none rounded-md bg-muted/60 ${msg.role === 'ceo' ? 'text-primary' : 'text-muted-foreground/60'}`}>
                                                {msg.role}
                                            </Badge>
                                            <span className="text-[9px] font-bold text-muted-foreground/20 font-mono tracking-widest">{msg.timestamp}</span>
                                        </div>
                                        <div className={`px-8 py-5 rounded-[2.5rem] text-base leading-relaxed transition-all shadow-sm ${isMe ? 'bg-primary text-primary-foreground rounded-tr-none shadow-primary/20' : 'bg-card text-foreground rounded-tl-none border border-border hover:border-primary/20 transition-all'}`}>
                                            {msg.content}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={chatEndRef} className="h-8" />
                    </div>
                </ScrollArea>

                <div className="p-10 bg-background/80 backdrop-blur-sm border-t border-border sticky bottom-0">
                    <div className="max-w-5xl mx-auto">
                        <div className="relative group bg-card border border-border rounded-[3rem] p-4 flex items-center gap-5 focus-within:border-primary shadow-2xl shadow-black/5 hover:border-primary/30 transition-all">
                            <Button variant="ghost" size="icon" className="h-12 w-12 rounded-[1.5rem] text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors">
                                <Plus className="h-6 w-6" />
                            </Button>
                            <Input
                                className="bg-transparent border-none text-foreground h-16 pr-40 focus-visible:ring-0 placeholder:text-muted-foreground/20 font-medium text-lg italic"
                                placeholder={`Transmit to ${activeChannel?.name}...`}
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            />
                            <div className="absolute right-6 flex items-center gap-4">
                                <Button variant="ghost" size="icon" className="h-12 w-12 text-muted-foreground/30 hover:text-primary transition-colors hidden sm:flex">
                                    <Smile className="h-6 w-6" />
                                </Button>
                                <Button
                                    size="icon"
                                    className="h-14 w-14 bg-primary text-primary-foreground hover:opacity-90 rounded-[1.75rem] shadow-xl shadow-primary/20 transition-all active:scale-95 group"
                                    onClick={handleSend}
                                    disabled={!newMessage.trim()}
                                >
                                    <Send className="h-6 w-6 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-300" />
                                </Button>
                            </div>
                        </div>
                        <p className="text-center mt-8 text-[9px] font-black uppercase tracking-[0.8em] text-muted-foreground/10 italic">Secure Node Relay Point // CID-ALPHA-99X</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
