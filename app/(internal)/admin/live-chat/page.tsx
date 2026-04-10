'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, ShieldAlert, CheckCircle, RefreshCw, MessageSquare } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';

export default function LiveChatMonitoring() {
    const { user, loading: authLoading } = useAuth();
    const [flags, setFlags] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        if (!authLoading && user) {
            fetchFlags();
            
            // Subscribe to realtime flags
            const channel = supabase
                .channel('admin-ai-flags')
                .on(
                    'postgres_changes',
                    { event: 'INSERT', schema: 'public', table: 'chat_flags' },
                    (payload) => {
                        toast('New AI Flag detected!', 'error');
                        setFlags((prev) => [payload.new, ...prev]);
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, [user, authLoading]);

    const fetchFlags = async () => {
        try {
            setLoading(true);
            const { data: rawData, error } = await supabase
                .from('chat_flags')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) throw error;
            
            const flags = rawData || [];
            if (flags.length === 0) {
                setFlags([]);
                return;
            }

            // Fetch conversations manually
            const conversationIds = Array.from(new Set(flags.map(f => f.conversation_id).filter(Boolean)));
            const { data: convData } = await supabase
                .from('conversations')
                .select('id, participant1_id, participant2_id')
                .in('id', conversationIds);

            // Fetch users manually
            const userIds = Array.from(new Set(flags.map(f => f.resolved_by).filter(Boolean)));
            const { data: userData } = await supabase
                .from('users')
                .select('id, display_name')
                .in('id', userIds);

            const mappedFlags = flags.map(f => ({
                ...f,
                conversation: convData?.find(c => c.id === f.conversation_id),
                resolved_admin: userData?.find(u => u.id === f.resolved_by)
            }));

            setFlags(mappedFlags);
        } catch (error) {
            console.error('Error fetching flags:', error);
            toast('Failed to load AI flags', 'error');
        } finally {
            setLoading(false);
        }
    };

    const resolveFlag = async (id: string) => {
        if (!user) return;
        try {
            const { error } = await supabase
                .from('chat_flags')
                .update({ is_resolved: true, resolved_by: user.id })
                .eq('id', id);

            if (error) throw error;
            setFlags(flags.map(f => f.id === id ? { ...f, is_resolved: true, resolved_admin: { display_name: user?.displayName || 'Admin' } } : f));
            toast('Flag resolved successfully', 'success');
        } catch (error) {
            console.error('Error resolving flag:', error);
            toast('Failed to resolve flag', 'error');
        }
    };

    if (authLoading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin h-8 w-8 text-[#FF6600]" /></div>;

    if (!['ceo', 'admin', 'operations_admin', 'technical_admin'].includes(user?.role || '')) {
        return <div className="p-8 text-center text-red-500 font-bold">Unauthorized Access</div>;
    }

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-6">
            <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
                <div>
                    <h1 className="text-2xl font-black text-zinc-900 tracking-tighter flex items-center gap-3">
                        <ShieldAlert className="text-red-500 h-6 w-6" />
                        Live Chat AI Monitoring
                    </h1>
                    <p className="text-sm text-zinc-500 font-medium mt-1">Real-time surveillance of platform communications. Intercepting malicious patterns.</p>
                </div>
                <Button variant="outline" onClick={fetchFlags} disabled={loading} className="gap-2">
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh Radar
                </Button>
            </div>

            <div className="grid gap-4">
                {flags.length === 0 && !loading && (
                    <div className="text-center py-12 bg-white rounded-2xl border border-zinc-200 shadow-sm">
                        <ShieldAlert className="h-12 w-12 text-zinc-300 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-zinc-600">No flags detected</h3>
                        <p className="text-zinc-400 text-sm">The AI system has not flagged any recent conversations.</p>
                    </div>
                )}

                {flags.map((flag) => (
                    <Card key={flag.id} className={`border-l-4 overflow-hidden ${flag.is_resolved ? 'border-l-green-500 opacity-70' : 'border-l-red-500'}`}>
                        <CardHeader className="pb-2 flex flex-row items-start justify-between bg-zinc-50/50">
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <Badge variant="destructive" className="uppercase font-black tracking-widest text-[10px]">{flag.flag_type}</Badge>
                                    <Badge variant="outline" className="uppercase font-black tracking-widest text-[10px] text-zinc-500 bg-white">Severity: {flag.severity}</Badge>
                                    {flag.is_resolved && (
                                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none uppercase font-black tracking-widest text-[10px] gap-1">
                                            <CheckCircle className="h-3 w-3" /> Resolved by {flag.resolved_admin?.display_name || 'Admin'}
                                        </Badge>
                                    )}
                                </div>
                                <CardTitle className="text-lg font-bold text-zinc-900 mt-2 flex items-center gap-2">
                                    <MessageSquare className="h-4 w-4 text-zinc-400" /> 
                                    Transcript Flagged
                                </CardTitle>
                                <CardDescription className="font-mono text-xs text-zinc-500 mt-1">Chat ID: {flag.conversation_id}</CardDescription>
                            </div>
                            <div className="text-right">
                                <span className="text-xs font-bold text-zinc-400">{new Date(flag.created_at).toLocaleString()}</span>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-4 bg-white">
                            <div className="bg-red-50 text-red-900 border border-red-100 rounded-xl p-4 mb-4 text-sm font-medium">
                                <span className="font-black uppercase tracking-widest text-[10px] text-red-500 block mb-1">AI Summary</span>
                                {flag.ai_summary}
                            </div>
                            
                            <div className="flex gap-3 justify-end">
                                <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50" onClick={() => window.open(`/admin/executive-chat?suspect=${flag.conversation_id}`, '_blank')}>
                                    Investigate Users
                                </Button>
                                {!flag.is_resolved && (
                                    <Button onClick={() => resolveFlag(flag.id)} className="bg-green-600 hover:bg-green-700 text-white font-bold tracking-wide">
                                        Mark as Resolved
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
