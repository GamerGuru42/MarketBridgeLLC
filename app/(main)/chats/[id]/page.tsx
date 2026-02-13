'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Send, ArrowLeft, DollarSign, Package, Image as ImageIcon, Loader2, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SmartEscrowModal } from '@/components/chat/SmartEscrowModal';
import { EscrowProgress, EscrowAgreement, EscrowStep } from '@/components/chat/EscrowProgress';
import { formatDistanceToNow } from 'date-fns';

interface Message {
    id: string;
    conversation_id: string;
    sender_id: string;
    content: string;
    image_url?: string | null;
    is_read: boolean;
    created_at: string;
    sender?: {
        display_name: string;
        photo_url: string | null;
    };
}

interface Conversation {
    id: string;
    participant1_id: string;
    participant2_id: string;
    listing_id: string | null;
    last_message: string | null;
    last_message_at: string | null;
    listing?: {
        id: string;
        title: string;
        price: number;
        images: string[];
    };
    other_user?: {
        id: string;
        display_name: string;
        photo_url: string | null;
        role: string;
        avatar_url?: string;
    };
}

export default function ChatPage({ params }: { params: Promise<{ id: string }> }) {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [chat, setChat] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Smart Escrow State
    const [showEscrowModal, setShowEscrowModal] = useState(false);
    const [escrowAmount, setEscrowAmount] = useState('');
    const [activeAgreement, setActiveAgreement] = useState<EscrowAgreement | null>(null);
    const [escrowSteps, setEscrowSteps] = useState<EscrowStep[]>([]);
    const [chatId, setChatId] = useState<string | null>(null);

    // Unwrap params
    useEffect(() => {
        params.then(p => setChatId(p.id));
    }, [params]);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
            return;
        }

        if (user && chatId) {
            fetchChat();
            fetchMessages();
            fetchActiveEscrow();

            const unsubscribeMessages = subscribeToMessages();
            const unsubscribeEscrow = subscribeToEscrow();

            // Mark initial batch as read
            markMessagesAsRead();

            return () => {
                unsubscribeMessages();
                unsubscribeEscrow();
            };
        }
    }, [user, authLoading, chatId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const fetchChat = async () => {
        if (!user || !chatId) return;

        try {
            const { data: chatData, error } = await supabase
                .from('conversations')
                .select(`
                    *,
                    listing:listings(id, title, price, images)
                `)
                .eq('id', chatId)
                .single();

            if (error) throw error;

            // Verify Participant
            if (chatData.participant1_id !== user.id && chatData.participant2_id !== user.id) {
                console.warn('Unauthorized access to chat');
                router.push('/chats');
                return;
            }

            // Identify Other User ID
            const otherUserId = chatData.participant1_id === user.id
                ? chatData.participant2_id
                : chatData.participant1_id;

            // Fetch Other User Details
            const { data: userData } = await supabase
                .from('users')
                .select('id, display_name, photo_url, role, avatar_url')
                .eq('id', otherUserId)
                .single();

            if (userData) {
                // Normalize photo_url vs avatar_url
                chatData.other_user = {
                    ...userData,
                    photo_url: userData.avatar_url || userData.photo_url
                };
            }

            setChat(chatData);
        } catch (error) {
            console.error('Error fetching chat:', error);
            // router.push('/chats'); // Optional redirect on error
        } finally {
            setLoading(false);
        }
    };

    const fetchMessages = async () => {
        if (!chatId) return;
        try {
            const { data, error } = await supabase
                .from('messages')
                .select(`
                    *,
                    sender:users!messages_sender_id_fkey(display_name, photo_url, avatar_url)
                `)
                .eq('conversation_id', chatId) // Note: Renamed from chat_id to conversation_id in schema migration?
                // Wait, in schema I used 'conversation_id'? 
                // Migration 20260213_messaging_system.sql: conversation_id UUID REFERENCES conversations(id)
                // Yes.
                .order('created_at', { ascending: true });

            if (error) {
                // Determine if error is due to column name mismatch (if migration failed)
                // We assume migration succeeded.
                throw error;
            }

            // Standardize sender photo
            const mapped = (data || []).map((m: any) => ({
                ...m,
                sender: m.sender ? {
                    ...m.sender,
                    photo_url: m.sender.avatar_url || m.sender.photo_url
                } : null
            }));

            setMessages(mapped);
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    };

    const fetchActiveEscrow = async () => {
        if (!chatId) return;
        try {
            const { data: agreement, error } = await supabase
                .from('escrow_agreements')
                .select('*')
                .eq('conversation_id', chatId) // conversation_id
                .in('status', ['pending', 'active'])
                .single();

            if (error && error.code !== 'PGRST116') throw error;

            if (agreement) {
                setActiveAgreement(agreement);
                const { data: steps } = await supabase
                    .from('escrow_steps')
                    .select('*')
                    .eq('agreement_id', agreement.id)
                    .order('step_order', { ascending: true });
                setEscrowSteps(steps || []);
            }
        } catch (error) {
            console.error('Error fetching escrow:', error);
        }
    };

    const subscribeToMessages = () => {
        if (!chatId) return () => { };

        const subscription = supabase
            .channel(`chat:${chatId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `conversation_id=eq.${chatId}`,
                },
                async (payload) => {
                    // Fetch sender details for the new message
                    const { data: senderData } = await supabase
                        .from('users')
                        .select('display_name, photo_url, avatar_url')
                        .eq('id', payload.new.sender_id)
                        .single();

                    const newMsg: Message = {
                        ...payload.new,
                        // Fix types
                        sender: senderData ? {
                            display_name: senderData.display_name,
                            photo_url: senderData.avatar_url || senderData.photo_url
                        } : undefined
                    } as Message;

                    setMessages((prev) => [...prev, newMsg]);

                    if (payload.new.sender_id !== user?.id) {
                        markMessagesAsRead();
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    };

    const subscribeToEscrow = () => {
        if (!chatId) return () => { };

        const subscription = supabase
            .channel(`escrow:${chatId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'escrow_agreements',
                    filter: `conversation_id=eq.${chatId}`,
                },
                (payload) => {
                    if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                        setActiveAgreement(payload.new as EscrowAgreement);
                        fetchActiveEscrow(); // Refresh steps/details full object
                    }
                }
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'escrow_steps',
                    // Filter by agreement_id is harder without knowing ID upfront if it changes.
                    // Use broad filter? No, inefficient.
                    // Just listen to all steps? Also inefficient.
                    // Since steps belong to agreements which belong to this chat, 
                    // maybe we just refresh on any step change if we have an active agreement?
                },
                () => {
                    fetchActiveEscrow(); // Aggressive refresh
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    };

    const markMessagesAsRead = async () => {
        if (!user || !chatId) return;

        await supabase
            .from('messages')
            .update({ is_read: true })
            .eq('conversation_id', chatId)
            .neq('sender_id', user.id)
            .eq('is_read', false);
    };

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if ((!newMessage.trim() && !selectedImage) || !user || sending || !chatId) return;

        setSending(true);
        setUploadingImage(!!selectedImage);

        try {
            let imageUrl: string | null = null;

            if (selectedImage) {
                // Upload logic
                const fileExt = selectedImage.name.split('.').pop();
                const fileName = `${user.id}-${Date.now()}.${fileExt}`;
                const filePath = `${chatId}/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('chat-images') // Ensure bucket exists!
                    .upload(filePath, selectedImage);

                if (!uploadError) {
                    const { data } = supabase.storage
                        .from('chat-images')
                        .getPublicUrl(filePath);
                    imageUrl = data.publicUrl;
                }
            }

            const { error } = await supabase.from('messages').insert({
                conversation_id: chatId,
                sender_id: user.id,
                content: newMessage.trim() || (imageUrl ? '📷 Image' : ''),
                image_url: imageUrl,
            });

            if (error) throw error;

            // Trigger update on conversation for last_message (done via DB trigger usually, but safe to keep)
            // My migration has a trigger: update_conversation_last_message()
            // So no need to manually update conversations table!

            setNewMessage('');
            setSelectedImage(null);
            setImagePreview(null);
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            setSending(false);
            setUploadingImage(false);
        }
    };

    const handleCreateEscrow = async (data: {
        amount: number;
        type: 'default' | 'custom';
        steps: string[];
        tosText: string;
    }) => {
        if (!user || !chat || !chat.other_user || !chatId) return;

        try {
            // 1. Create Agreement
            const { data: agreement, error: agreementError } = await supabase
                .from('escrow_agreements')
                .insert({
                    conversation_id: chatId,
                    buyer_id: user.id,
                    seller_id: chat.other_user.id,
                    amount: data.amount,
                    agreement_type: data.type,
                    status: 'pending',
                    tos_accepted_buyer: true, // Creator accepts
                })
                .select()
                .single();

            if (agreementError) throw agreementError;

            // 2. Create Steps
            const stepsToInsert = data.steps.map((desc: string, index: number) => ({
                agreement_id: agreement.id,
                step_order: index,
                description: desc,
                status: 'pending'
            }));

            const { error: stepsError } = await supabase
                .from('escrow_steps')
                .insert(stepsToInsert);

            if (stepsError) throw stepsError;

            // 3. Send System Message
            await supabase.from('messages').insert({
                conversation_id: chatId,
                sender_id: user.id,
                content: `🔒 Smart Escrow initiated for ₦${data.amount.toLocaleString()}. Please review and accept conditions.`,
            });

            setActiveAgreement(agreement);
            fetchActiveEscrow(); // Refresh steps
        } catch (error) {
            console.error('Error creating escrow:', error);
            alert('Failed to create escrow agreement. Please try again.');
        }
    };

    // Image handling helpers
    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                alert('Image must be less than 5MB');
                return;
            }
            setSelectedImage(file);
            setImagePreview(URL.createObjectURL(file));
        }
    }

    if (authLoading || loading) {
        return (
            <div className="container mx-auto px-4 py-8 min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="animate-spin h-12 w-12 text-[#FFB800] mx-auto" />
                    <p className="mt-4 text-zinc-500 font-mono text-xs tracking-widest uppercase">Decrypting Stream...</p>
                </div>
            </div>
        );
    }

    if (!chat) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="text-center text-zinc-500">Chat Not Found</div>
                <Button asChild className="mt-4"><Link href="/chats">Return to Terminal</Link></Button>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 h-[calc(100vh-4rem)] flex flex-col">
            <Card className="flex-1 flex flex-col bg-black/50 border-white/10 backdrop-blur-md overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                <CardHeader className="border-b border-white/5 bg-white/5 py-4 shrink-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Button variant="ghost" size="icon" asChild className="text-zinc-400 hover:text-white hover:bg-white/10">
                                <Link href="/chats">
                                    <ArrowLeft className="h-5 w-5" />
                                </Link>
                            </Button>
                            <Avatar className="h-10 w-10 border border-white/10">
                                <AvatarImage src={chat.other_user?.photo_url || ''} />
                                <AvatarFallback className="bg-zinc-800 text-zinc-500 font-black uppercase">
                                    {chat.other_user?.display_name?.charAt(0).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <CardTitle className="text-base text-white font-bold tracking-wide">
                                    {chat.other_user?.display_name}
                                </CardTitle>
                                <Badge variant="secondary" className="mt-1 bg-white/5 text-zinc-400 border border-white/5 text-[10px] uppercase tracking-wider">
                                    {['dealer', 'student_seller'].includes(chat.other_user?.role || '') ? 'Verified Merchant' : 'User'}
                                </Badge>
                            </div>
                        </div>
                        {chat.listing && !activeAgreement && (
                            <Button onClick={() => setShowEscrowModal(true)} className="gap-2 bg-[#FFB800] text-black font-black uppercase text-xs tracking-widest hover:bg-[#FFB800]/90 h-9">
                                <DollarSign className="h-4 w-4" />
                                Secure Escrow
                            </Button>
                        )}
                    </div>
                </CardHeader>

                <CardContent className="flex-1 flex flex-col p-0 overflow-hidden relative">
                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-zinc-800">
                        {/* Escrow Widget */}
                        {activeAgreement && (
                            <EscrowProgress
                                agreement={activeAgreement}
                                steps={escrowSteps}
                                onUpdate={fetchActiveEscrow}
                            />
                        )}

                        {/* Messages */}
                        {messages.map((message) => {
                            const isOwn = message.sender_id === user?.id;
                            return (
                                <div key={message.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`flex gap-3 max-w-[80%] md:max-w-[60%] ${isOwn ? 'flex-row-reverse' : ''}`}>
                                        {!isOwn && (
                                            <Avatar className="h-8 w-8 mt-1 border border-white/10 hidden sm:block">
                                                <AvatarImage src={message.sender?.photo_url || ''} />
                                                <AvatarFallback className="text-[10px] bg-zinc-800 text-zinc-500">
                                                    {message.sender?.display_name?.charAt(0)}
                                                </AvatarFallback>
                                            </Avatar>
                                        )}
                                        <div className={`space-y-1 ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
                                            <div className={`rounded-2xl px-4 py-3 text-sm shadow-sm ${isOwn
                                                    ? 'bg-[#FFB800] text-black font-medium rounded-tr-none'
                                                    : 'bg-white/10 text-zinc-200 border border-white/5 rounded-tl-none'
                                                }`}>
                                                {message.image_url && (
                                                    <div className="mb-2">
                                                        <img src={message.image_url} alt="Shared" className="rounded-lg max-h-60 object-cover" onClick={() => window.open(message.image_url!, '_blank')} />
                                                    </div>
                                                )}
                                                {message.content && !message.content.startsWith('📷 Image') && (
                                                    <p>{message.content}</p>
                                                )}
                                            </div>
                                            <p className="text-[10px] text-zinc-600 px-1 font-mono">
                                                {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-4 bg-black/40 backdrop-blur-md border-t border-white/5 shrink-0">
                        {imagePreview && (
                            <div className="mb-3 relative inline-block">
                                <img src={imagePreview} alt="Preview" className="h-16 w-16 object-cover rounded-md border border-[#FFB800]/50" />
                                <button onClick={() => { setSelectedImage(null); setImagePreview(null); }} className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 text-white hover:bg-red-600"><X className="h-3 w-3" /></button>
                            </div>
                        )}
                        <form onSubmit={sendMessage} className="flex gap-3 items-end">
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleImageSelect}
                                accept="image/*"
                                className="hidden"
                            />
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="h-12 w-12 rounded-xl border-white/10 bg-white/5 text-zinc-400 hover:text-[#FFB800] hover:bg-[#FFB800]/10 hover:border-[#FFB800]/30 shrink-0 transition-all"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <ImageIcon className="h-5 w-5" />
                            </Button>

                            <Input
                                placeholder="Transmit secure message..."
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                className="h-12 bg-black/50 border-white/10 rounded-xl text-white placeholder:text-zinc-600 focus:ring-[#FFB800]/50 focus:border-[#FFB800]/50 font-medium"
                                disabled={sending}
                            />

                            <Button
                                type="submit"
                                className="h-12 w-12 rounded-xl bg-[#FFB800] text-black hover:bg-[#FFB800]/90 shadow-[0_0_20px_rgba(255,184,0,0.2)] shrink-0"
                                disabled={sending || (!newMessage.trim() && !selectedImage)}
                            >
                                {uploadingImage ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                            </Button>
                        </form>
                    </div>
                </CardContent>
            </Card>

            <SmartEscrowModal
                isOpen={showEscrowModal}
                onClose={() => setShowEscrowModal(false)}
                onConfirm={handleCreateEscrow}
                amount={escrowAmount}
                setAmount={setEscrowAmount}
            />
        </div>
    );
}
