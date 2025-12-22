'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Send } from 'lucide-react';

// Mock data for now, would connect to a real backend endpoint in production
const MOCK_MEMOS = [
    {
        id: '1',
        author: 'CEO',
        content: 'Welcome to the new admin dashboard. Please review the new dispute resolution protocols.',
        timestamp: new Date(Date.now() - 86400000).toISOString(),
    },
    {
        id: '2',
        author: 'CTO',
        content: 'Scheduled maintenance tonight at 2 AM WAT. Expect 15 mins downtime.',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
    }
];

export default function ExecutiveChatPage() {
    const { user, loading } = useAuth();
    const [memos, setMemos] = useState(MOCK_MEMOS);
    const [newMessage, setNewMessage] = useState('');
    const [isSending, setIsSending] = useState(false);

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

    const handleSend = () => {
        if (!newMessage.trim()) return;

        setIsSending(true);
        // Simulate API call
        setTimeout(() => {
            const newMemo = {
                id: Date.now().toString(),
                author: user?.displayName || 'Admin',
                content: newMessage,
                timestamp: new Date().toISOString(),
            };
            setMemos([newMemo, ...memos]);
            setNewMessage('');
            setIsSending(false);
        }, 500);
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <h1 className="text-3xl font-bold mb-8">Executive Operations Log</h1>

            <Card className="mb-8">
                <CardHeader>
                    <CardTitle>New Memo</CardTitle>
                </CardHeader>
                <CardContent>
                    <Textarea
                        placeholder="Post an update for the executive team..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        className="min-h-[100px]"
                    />
                </CardContent>
                <CardFooter className="flex justify-end">
                    <Button onClick={handleSend} disabled={isSending || !newMessage.trim()}>
                        {isSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                        Post Memo
                    </Button>
                </CardFooter>
            </Card>

            <div className="space-y-4">
                {memos.map((memo) => (
                    <Card key={memo.id}>
                        <CardHeader className="flex flex-row items-center gap-4 pb-2">
                            <Avatar>
                                <AvatarFallback>{memo.author[0]}</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                                <span className="font-semibold">{memo.author}</span>
                                <span className="text-xs text-muted-foreground">{new Date(memo.timestamp).toLocaleString()}</span>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="whitespace-pre-wrap">{memo.content}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
