'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Headphones, Send, CheckCircle, ArrowLeft, User, Bot, Shield } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { useRouter } from 'next/navigation';

interface Ticket {
    id: string;
    user_id: string;
    status: string;
    priority: string;
    assigned_admin_id: string | null;
    created_at: string;
    updated_at: string;
    user?: { display_name: string; email: string; photo_url: string | null };
}

interface SupportMsg {
    id: string;
    ticket_id: string;
    sender_id: string;
    sender_type: 'user' | 'ai' | 'admin';
    content: string;
    created_at: string;
}

export default function OperationsSupportPage() {
    const { user, loading: authLoading } = useAuth();
    const { toast } = useToast();
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
    const [messages, setMessages] = useState<SupportMsg[]>([]);
    const [newMsg, setNewMsg] = useState('');
    const [sending, setSending] = useState(false);
    const router = useRouter();
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const ADMIN_ROLES = ['admin', 'technical_admin', 'operations_admin', 'marketing_admin', 'ceo', 'cofounder'];
        if (!authLoading && (!user || !ADMIN_ROLES.includes(user.role))) {
            router.replace('/portal/login');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (!authLoading && user) fetchTickets();
    }, [user, authLoading]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const fetchTickets = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('support_tickets')
                .select(`*, user:users!user_id(display_name, email, photo_url)`)
                .in('status', ['open', 'ai_handling', 'escalated'])
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) throw error;
            setTickets(data || []);
        } catch (err) {
            console.error('Error fetching tickets:', err);
            toast('Failed to load support tickets', 'error');
        } finally {
            setLoading(false);
        }
    };

    const openTicket = async (ticket: Ticket) => {
        setActiveTicket(ticket);

        // Assign admin if not already assigned
        if (!ticket.assigned_admin_id && user) {
            await supabase
                .from('support_tickets')
                .update({ assigned_admin_id: user.id, status: 'escalated' })
                .eq('id', ticket.id);
        }

        // Fetch messages
        const { data } = await supabase
            .from('support_messages')
            .select('*')
            .eq('ticket_id', ticket.id)
            .order('created_at', { ascending: true });

        setMessages(data || []);

        // Subscribe to new messages
        const channel = supabase
            .channel(`support-ticket-${ticket.id}`)
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'support_messages', filter: `ticket_id=eq.${ticket.id}` },
                (payload) => {
                    setMessages(prev => [...prev, payload.new as SupportMsg]);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    };

    const sendReply = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMsg.trim() || !activeTicket || !user) return;
        setSending(true);
        try {
            const { error } = await supabase.from('support_messages').insert({
                ticket_id: activeTicket.id,
                sender_id: user.id,
                sender_type: 'admin',
                content: newMsg.trim(),
            });
            if (error) throw error;
            setNewMsg('');
        } catch (err) {
            console.error('Error sending reply:', err);
            toast('Failed to send reply', 'error');
        } finally {
            setSending(false);
        }
    };

    const resolveTicket = async () => {
        if (!activeTicket) return;
        await supabase
            .from('support_tickets')
            .update({ status: 'resolved', updated_at: new Date().toISOString() })
            .eq('id', activeTicket.id);

        toast('Ticket resolved successfully', 'success');
        setActiveTicket(null);
        fetchTickets();
    };

    if (authLoading || !user) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin h-8 w-8 text-[#FF6600]" /></div>;

    // Chat View
    if (activeTicket) {
        return (
            <div className="p-4 md:p-8 max-w-4xl mx-auto h-[calc(100vh-6rem)] flex flex-col">
                <div className="flex items-center justify-between mb-4 shrink-0">
                    <Button variant="ghost" onClick={() => setActiveTicket(null)} className="gap-2 text-zinc-500 hover:text-zinc-900">
                        <ArrowLeft className="h-4 w-4" /> Back to Queue
                    </Button>
                    <div className="flex items-center gap-3">
                        <Badge className="bg-amber-100 text-amber-800 border-none uppercase font-black text-[10px] tracking-widest">{activeTicket.priority}</Badge>
                        <Button onClick={resolveTicket} className="bg-green-600 hover:bg-green-700 text-white font-bold text-xs uppercase tracking-wider gap-2 h-9">
                            <CheckCircle className="h-3.5 w-3.5" /> Resolve
                        </Button>
                    </div>
                </div>

                <Card className="flex-1 flex flex-col overflow-hidden border-zinc-200 shadow-lg">
                    <CardHeader className="bg-zinc-50 border-b border-zinc-100 p-4 shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-[#FF6600]/10 flex items-center justify-center">
                                <User className="h-5 w-5 text-[#FF6600]" />
                            </div>
                            <div>
                                <CardTitle className="text-base font-bold text-zinc-900">
                                    {(activeTicket as any).user?.display_name || 'Anonymous User'}
                                </CardTitle>
                                <p className="text-xs text-zinc-500 font-mono">{(activeTicket as any).user?.email || activeTicket.user_id}</p>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="flex-1 overflow-y-auto p-4 space-y-3">
                        {messages.map((msg) => (
                            <div key={msg.id} className={`flex ${msg.sender_type === 'admin' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm ${
                                    msg.sender_type === 'admin'
                                        ? 'bg-[#FF6600] text-black font-medium rounded-tr-none'
                                        : msg.sender_type === 'ai'
                                        ? 'bg-purple-50 text-purple-900 border border-purple-200 rounded-tl-none'
                                        : 'bg-zinc-100 text-zinc-900 border border-zinc-200 rounded-tl-none'
                                }`}>
                                    <div className="flex items-center gap-2 mb-1">
                                        {msg.sender_type === 'ai' && <Bot className="h-3 w-3 text-purple-500" />}
                                        {msg.sender_type === 'admin' && <Shield className="h-3 w-3" />}
                                        {msg.sender_type === 'user' && <User className="h-3 w-3 text-zinc-400" />}
                                        <span className="text-[10px] font-black uppercase tracking-widest opacity-60">
                                            {msg.sender_type === 'ai' ? 'Sage AI' : msg.sender_type === 'admin' ? 'You' : 'User'}
                                        </span>
                                    </div>
                                    <p className="whitespace-pre-wrap">{msg.content}</p>
                                    <p className="text-[10px] opacity-40 mt-1">{new Date(msg.created_at).toLocaleTimeString()}</p>
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </CardContent>

                    <div className="p-4 bg-white border-t border-zinc-100 shrink-0">
                        <form onSubmit={sendReply} className="flex gap-3">
                            <Input
                                value={newMsg}
                                onChange={(e) => setNewMsg(e.target.value)}
                                placeholder="Type your reply..."
                                className="h-12 bg-zinc-50 border-zinc-200 rounded-xl font-medium"
                                disabled={sending}
                            />
                            <Button type="submit" disabled={!newMsg.trim() || sending} className="h-12 w-12 rounded-xl bg-[#FF6600] text-black hover:bg-[#FF6600]/90 shrink-0">
                                {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                            </Button>
                        </form>
                    </div>
                </Card>
            </div>
        );
    }

    // Ticket Queue View
    return (
        <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
            <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
                <div>
                    <h1 className="text-2xl font-black text-zinc-900 tracking-tighter flex items-center gap-3">
                        <Headphones className="text-[#FF6600] h-6 w-6" />
                        Customer Support Queue
                    </h1>
                    <p className="text-sm text-zinc-500 font-medium mt-1">Live tickets from users and AI escalations. Click to respond.</p>
                </div>
                <Badge className="bg-[#FF6600]/10 text-[#FF6600] font-black text-sm border-none px-4 py-2">
                    {tickets.length} Active
                </Badge>
            </div>

            {loading ? (
                <div className="flex justify-center py-12"><Loader2 className="animate-spin h-8 w-8 text-[#FF6600]" /></div>
            ) : tickets.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-zinc-200 shadow-sm">
                    <Headphones className="h-12 w-12 text-zinc-300 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-zinc-600">All clear!</h3>
                    <p className="text-zinc-400 text-sm mt-1">No active support tickets at this time.</p>
                </div>
            ) : (
                <div className="grid gap-3">
                    {tickets.map((ticket) => (
                        <Card
                            key={ticket.id}
                            className="cursor-pointer hover:border-[#FF6600]/30 hover:shadow-md transition-all border-zinc-200"
                            onClick={() => openTicket(ticket)}
                        >
                            <CardContent className="p-5 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-full bg-zinc-100 flex items-center justify-center">
                                        <User className="h-5 w-5 text-zinc-500" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-zinc-900">{(ticket as any).user?.display_name || 'Anonymous User'}</p>
                                        <p className="text-xs text-zinc-500 font-mono">{(ticket as any).user?.email || ticket.user_id}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Badge variant="outline" className={`uppercase font-black text-[10px] tracking-widest ${
                                        ticket.status === 'escalated' ? 'border-red-200 text-red-600 bg-red-50' : 'border-amber-200 text-amber-600 bg-amber-50'
                                    }`}>{ticket.status}</Badge>
                                    <Badge variant="outline" className="uppercase font-black text-[10px] tracking-widest text-zinc-500">{ticket.priority}</Badge>
                                    <span className="text-xs text-zinc-400">{new Date(ticket.created_at).toLocaleDateString()}</span>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
