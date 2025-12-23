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

const CHANNELS = [
    { id: 'gen', name: 'general-ops', type: 'public' },
    { id: 'strat', name: 'ceo-strategy', type: 'private' },
    { id: 'tech', name: 'tech-signals', type: 'public' },
    { id: 'abj', name: 'ops-abuja', type: 'public' },
];

const MOCK_MESSAGES = [
    { id: '1', author: 'CEO', role: 'ceo', content: 'Team, the Abuja launch KPIs looking solid. Let\'s maintain this momentum.', timestamp: '10:05 AM', channelId: 'gen' },
    { id: '2', author: 'CTO', role: 'cto', content: 'Agreed. Abuja Node clusters are at 100% health.', timestamp: '10:12 AM', channelId: 'gen' },
    { id: '3', author: 'COO', role: 'coo', content: 'Verification queue for Wuse II is now cleared.', timestamp: '11:02 AM', channelId: 'abj' },
];

export default function ExecutiveChatPage() {
    const { user, loading } = useAuth();
    const [messages, setMessages] = useState(MOCK_MESSAGES);
    const [newMessage, setNewMessage] = useState('');
    const [activeChannel, setActiveChannel] = useState(CHANNELS[0]);
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, activeChannel]);

    const handleSend = () => {
        if (!newMessage.trim()) return;
        const msg = {
            id: Date.now().toString(),
            author: user?.displayName || 'Admin',
            role: user?.role || 'admin',
            content: newMessage,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            channelId: activeChannel.id
        };
        setMessages([...messages, msg]);
        setNewMessage('');
    };

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

    const filteredMessages = messages.filter(m => m.channelId === activeChannel.id);

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
                        {CHANNELS.map(ch => (
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
                        <button className="w-full flex items-center justify-between px-3 py-1.5 rounded-md text-xs text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
                            <div className="flex items-center gap-2">
                                <Circle className="h-2 w-2 fill-green-500 text-green-500" />
                                <span>CEO (Admin)</span>
                            </div>
                            <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100" />
                        </button>
                        <button className="w-full flex items-center justify-between px-3 py-1.5 rounded-md text-xs text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
                            <div className="flex items-center gap-2">
                                <Circle className="h-2 w-2 fill-green-500 text-green-500" />
                                <span>CTO Hub</span>
                            </div>
                        </button>
                        <button className="w-full flex items-center justify-between px-3 py-1.5 rounded-md text-xs text-slate-400 hover:bg-slate-800 hover:text-white transition-colors opacity-50">
                            <div className="flex items-center gap-2">
                                <Circle className="h-2 w-2 text-slate-600" />
                                <span>Ops Lead</span>
                            </div>
                        </button>
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
                        <h3 className="font-bold text-white text-sm">{activeChannel.name}</h3>
                        <Separator orientation="vertical" className="h-4 bg-slate-800 mx-2" />
                        <span className="text-[10px] text-slate-500 font-medium">Internal Coordination Terminal</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <Users className="h-4 w-4 text-slate-500 cursor-pointer hover:text-white" />
                        <Button variant="outline" size="sm" className="h-7 text-[10px] border-slate-700 bg-transparent text-slate-300 hover:bg-slate-800">
                            Archive Session
                        </Button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
                    {filteredMessages.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center opacity-20">
                            <MessageSquare className="h-12 w-12 mb-2" />
                            <p className="text-sm font-medium">No intelligence reports in this channel yet.</p>
                        </div>
                    )}
                    {filteredMessages.map((msg) => (
                        <div key={msg.id} className={`flex gap-4 group ${msg.author === user?.displayName ? 'flex-row-reverse' : ''}`}>
                            <Avatar className="h-9 w-9 shrink-0 ring-2 ring-slate-800 group-hover:ring-primary/40 transition-all">
                                <AvatarFallback>{msg.author[0]}</AvatarFallback>
                            </Avatar>
                            <div className={`flex flex-col gap-1 max-w-[70%] ${msg.author === user?.displayName ? 'items-end' : ''}`}>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-[10px] font-bold text-white uppercase tracking-tighter">{msg.author}</span>
                                    <Badge variant="outline" className={`text-[8px] h-3 px-1 font-black ${msg.role === 'ceo' ? 'border-primary text-primary' : 'border-slate-700 text-slate-500'}`}>
                                        {msg.role}
                                    </Badge>
                                    <span className="text-[8px] text-slate-600">{msg.timestamp}</span>
                                </div>
                                <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${msg.author === user?.displayName ? 'bg-primary text-white rounded-tr-none shadow-[0_4px_12px_rgba(var(--primary-rgb),0.3)]' : 'bg-slate-800/80 text-slate-200 rounded-tl-none border border-slate-700/50'}`}>
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
                                placeholder={`Message #${activeChannel.name}`}
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            />
                            <Button
                                size="icon"
                                variant="ghost"
                                className="absolute right-1 top-1 h-9 w-9 text-slate-500 hover:text-primary transition-colors"
                                onClick={handleSend}
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

