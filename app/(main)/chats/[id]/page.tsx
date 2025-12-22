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
import { EscrowProgress } from '@/components/chat/EscrowProgress';

interface Message {
    id: string;
    chat_id: string;
    sender_id: string;
    content: string;
    image_url?: string | null;
    read: boolean;
    created_at: string;
    sender?: {
        display_name: string;
        photo_url: string | null;
    };
}

interface Chat {
    id: string;
    participants: string[];
    listing_id: string | null;
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
    };
}

export default function ChatPage({ params }: { params: { id: string } }) {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [chat, setChat] = useState<Chat | null>(null);
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
    const [activeAgreement, setActiveAgreement] = useState<any>(null);
    const [escrowSteps, setEscrowSteps] = useState<any[]>([]);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
            return;
        }

        if (user) {
            fetchChat();
            fetchMessages();
            fetchActiveEscrow();
            subscribeToMessages();
            subscribeToEscrow();
            markMessagesAsRead();
        }
    }, [user, authLoading, params.id]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const fetchChat = async () => {
        if (!user) return;

        try {
            const { data: chatData, error } = await supabase
                .from('chats')
                .select('*')
                .eq('id', params.id)
                .single();

            if (error) throw error;

            if (!chatData.participants.includes(user.id)) {
                router.push('/chats');
                return;
            }

            const otherUserId = chatData.participants.find((id: string) => id !== user.id);

            if (otherUserId) {
                const { data: userData } = await supabase
                    .from('users')
                    .select('id, display_name, photo_url, role')
                    .eq('id', otherUserId)
                    .single();

                chatData.other_user = userData;
            }

            if (chatData.listing_id) {
                const { data: listingData } = await supabase
                    .from('listings')
                    .select('id, title, price, images')
                    .eq('id', chatData.listing_id)
                    .single();

                chatData.listing = listingData;
            }

            setChat(chatData);
        } catch (error) {
            console.error('Error fetching chat:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMessages = async () => {
        try {
            const { data, error } = await supabase
                .from('messages')
                .select(`
                    *,
                    sender:users!messages_sender_id_fkey(display_name, photo_url)
                `)
                .eq('chat_id', params.id)
                .order('created_at', { ascending: true });

            if (error) throw error;

            setMessages(data || []);
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    };

    const fetchActiveEscrow = async () => {
        try {
            const { data: agreement, error } = await supabase
                .from('escrow_agreements')
                .select('*')
                .eq('chat_id', params.id)
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
        const subscription = supabase
            .channel(`chat:${params.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `chat_id=eq.${params.id}`,
                },
                async (payload) => {
                    const { data: senderData } = await supabase
                        .from('users')
                        .select('display_name, photo_url')
                        .eq('id', payload.new.sender_id)
                        .single();

                    setMessages((prev) => [
                        ...prev,
                        { ...payload.new, sender: senderData } as Message,
                    ]);

                    if (payload.new.sender_id !== user?.id) {
                        markMessagesAsRead();
                    }
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    };

    const subscribeToEscrow = () => {
        const subscription = supabase
            .channel(`escrow:${params.id}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'escrow_agreements',
                    filter: `chat_id=eq.${params.id}`,
                },
                (payload) => {
                    if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                        setActiveAgreement(payload.new);
                        fetchActiveEscrow(); // Refresh steps too
                    }
                }
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'escrow_steps',
                },
                () => {
                    fetchActiveEscrow(); // Refresh steps
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    };

    const markMessagesAsRead = async () => {
        if (!user) return;

        await supabase
            .from('messages')
            .update({ read: true })
            .eq('chat_id', params.id)
            .neq('sender_id', user.id)
            .eq('read', false);
    };

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
    };

    const clearSelectedImage = () => {
        setSelectedImage(null);
        setImagePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const uploadImage = async (file: File): Promise<string | null> => {
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${user?.id}-${Date.now()}.${fileExt}`;
            const filePath = `${params.id}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('chat-images')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('chat-images')
                .getPublicUrl(filePath);

            return publicUrl;
        } catch (error) {
            console.error('Error uploading image:', error);
            return null;
        }
    };

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if ((!newMessage.trim() && !selectedImage) || !user || sending) return;

        setSending(true);
        setUploadingImage(!!selectedImage);

        try {
            let imageUrl: string | null = null;

            if (selectedImage) {
                imageUrl = await uploadImage(selectedImage);
            }

            const { error } = await supabase.from('messages').insert({
                chat_id: params.id,
                sender_id: user.id,
                content: newMessage.trim() || (imageUrl ? '📷 Image' : ''),
                image_url: imageUrl,
            });

            if (error) throw error;

            // Update chat's last message
            await supabase
                .from('chats')
                .update({
                    last_message: newMessage.trim() || '📷 Image',
                    last_message_timestamp: new Date().toISOString(),
                })
                .eq('id', params.id);

            setNewMessage('');
            clearSelectedImage();
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            setSending(false);
            setUploadingImage(false);
        }
    };

    const handleCreateEscrow = async (data: any) => {
        if (!user || !chat?.other_user) return;

        try {
            // 1. Create Agreement
            const { data: agreement, error: agreementError } = await supabase
                .from('escrow_agreements')
                .insert({
                    chat_id: params.id,
                    buyer_id: user.id,
                    seller_id: chat.other_user.id,
                    amount: data.amount,
                    agreement_type: data.type,
                    status: 'pending',
                    tos_accepted_buyer: true, // Creator accepts by default
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
                chat_id: params.id,
                sender_id: user.id,
                content: `🔒 Smart Escrow initiated for ₦${data.amount.toLocaleString()}. Please review and accept the conditions.`,
            });

            setActiveAgreement(agreement);
            fetchActiveEscrow();
        } catch (error) {
            console.error('Error creating escrow:', error);
            alert('Failed to create escrow agreement');
        }
    };

    if (authLoading || loading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                        <p className="mt-4 text-muted-foreground">Loading chat...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!chat) {
        return (
            <div className="container mx-auto px-4 py-8">
                <Card>
                    <CardContent className="py-12 text-center">
                        <p className="text-muted-foreground">Chat not found</p>
                        <Button asChild className="mt-4">
                            <Link href="/chats">Back to Chats</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <Card className="h-[calc(100vh-12rem)]">
                <CardHeader className="border-b">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Button variant="ghost" size="icon" asChild>
                                <Link href="/chats">
                                    <ArrowLeft className="h-5 w-5" />
                                </Link>
                            </Button>
                            <Avatar>
                                <AvatarImage src={chat.other_user?.photo_url || ''} />
                                <AvatarFallback>
                                    {chat.other_user?.display_name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <CardTitle className="text-lg">{chat.other_user?.display_name}</CardTitle>
                                <Badge variant="secondary" className="mt-1">
                                    {chat.other_user?.role === 'dealer' ? 'Dealer' : 'Customer'}
                                </Badge>
                            </div>
                        </div>
                        {chat.listing && !activeAgreement && (
                            <Button onClick={() => setShowEscrowModal(true)} className="gap-2">
                                <DollarSign className="h-4 w-4" />
                                Initiate Escrow
                            </Button>
                        )}
                    </div>
                    {chat.listing && (
                        <div className="mt-4 p-3 bg-muted rounded-lg flex items-center gap-3">
                            <Package className="h-5 w-5 text-muted-foreground" />
                            <div className="flex-1">
                                <p className="font-medium text-sm">{chat.listing.title}</p>
                                <p className="text-sm text-muted-foreground">
                                    ₦{chat.listing.price.toLocaleString()}
                                </p>
                            </div>
                            <Button variant="outline" size="sm" asChild>
                                <Link href={`/listings/${chat.listing.id}`}>View</Link>
                            </Button>
                        </div>
                    )}
                </CardHeader>
                <CardContent className="flex flex-col h-[calc(100%-10rem)] p-0">
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {/* Active Escrow Progress */}
                        {activeAgreement && (
                            <EscrowProgress
                                agreement={activeAgreement}
                                steps={escrowSteps}
                                onUpdate={fetchActiveEscrow}
                            />
                        )}

                        {messages.map((message) => {
                            const isOwn = message.sender_id === user?.id;
                            return (
                                <div
                                    key={message.id}
                                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`flex gap-2 max-w-[70%] ${isOwn ? 'flex-row-reverse' : ''}`}>
                                        {!isOwn && (
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={message.sender?.photo_url || ''} />
                                                <AvatarFallback>
                                                    {message.sender?.display_name.charAt(0).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                        )}
                                        <div>
                                            <div
                                                className={`rounded-lg px-4 py-2 ${isOwn
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'bg-muted'
                                                    }`}
                                            >
                                                {message.image_url && (
                                                    <div className="mb-2">
                                                        <img
                                                            src={message.image_url}
                                                            alt="Chat image"
                                                            className="rounded-lg max-w-full max-h-64 object-contain cursor-pointer"
                                                            onClick={() => window.open(message.image_url!, '_blank')}
                                                        />
                                                    </div>
                                                )}
                                                {message.content && message.content !== '📷 Image' && (
                                                    <p className="text-sm">{message.content}</p>
                                                )}
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-1 px-1">
                                                {new Date(message.created_at).toLocaleTimeString([], {
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Image Preview */}
                    {imagePreview && (
                        <div className="border-t p-2">
                            <div className="relative inline-block">
                                <img
                                    src={imagePreview}
                                    alt="Selected"
                                    className="h-20 w-20 object-cover rounded-lg"
                                />
                                <button
                                    onClick={clearSelectedImage}
                                    className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </div>
                        </div>
                    )}

                    <form onSubmit={sendMessage} className="border-t p-4">
                        <div className="flex gap-2">
                            <input
                                type="file"
                                accept="image/*"
                                ref={fileInputRef}
                                onChange={handleImageSelect}
                                className="hidden"
                            />
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={sending}
                            >
                                <ImageIcon className="h-4 w-4" />
                            </Button>
                            <Input
                                placeholder="Type a message..."
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                disabled={sending}
                            />
                            <Button type="submit" disabled={sending || (!newMessage.trim() && !selectedImage)}>
                                {uploadingImage ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Send className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                    </form>
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
