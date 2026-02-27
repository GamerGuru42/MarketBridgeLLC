'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, X, Send, Bot, User, ShoppingBag, Search, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { brain } from '@/lib/ai_brain';

interface Message {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
    searchResults?: SearchResult[];
    productDetail?: SearchResult;
    supportTicket?: SupportTicket;
}

interface SearchResult {
    id: string;
    title: string;
    price: number;
    category: string;
    location: string;
    image?: string;
    description?: string;
    keywords?: string[];
}

interface SupportTicket {
    ticketId: string;
    status: 'escalated' | 'pending';
    department: 'technical' | 'operations';
}

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export function AiAssistant() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'assistant',
            content: "Hello! I'm **Sage**, your MarketBridge AI assistant. I'm trained to help you:\n- **Find products** safely across Abuja campuses\n- **Explain** our Paystack escrow system\n- **Guide** you to become a verified dealer\n\nHow can I assist your hustle today?",
            timestamp: new Date()
        }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const generateResponse = (input: string) => {
        const response = brain.processInput(input);
        let supportTicket: SupportTicket | undefined;
        if (response.action === 'escalate_tech') {
            supportTicket = { ticketId: `TECH-${Date.now()}`, status: 'escalated', department: 'technical' };
        } else if (response.action === 'escalate_ops') {
            supportTicket = { ticketId: `OPS-${Date.now()}`, status: 'escalated', department: 'operations' };
        }

        return {
            content: response.content,
            searchResults: response.searchResults,
            productDetail: response.productDetail,
            supportTicket
        };
    };

    const handleSendMessage = async (text?: string) => {
        const contentToSend = text || inputValue;
        if (!contentToSend.trim()) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: contentToSend,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsTyping(true);

        // Simulate network delay
        setTimeout(() => {
            const response = generateResponse(userMessage.content);
            const botMessageId = (Date.now() + 1).toString();

            // Start with an empty message and streaming state
            setMessages(prev => [...prev, {
                id: botMessageId,
                role: 'assistant',
                content: '',
                timestamp: new Date(),
            }]);

            setIsTyping(false); // Hide the "pulsing dots" loader

            // Simulated Streaming Effect
            const fullContent = response.content;
            let currentLength = 0;
            const chunkSize = Math.max(1, Math.floor(fullContent.length / 40));

            const streamInterval = setInterval(() => {
                currentLength += chunkSize;
                if (currentLength >= fullContent.length) {
                    currentLength = fullContent.length;
                    clearInterval(streamInterval);

                    // Once text finishes streaming, append the rich UI widgets (cards, tickets, etc.)
                    setMessages(prev => prev.map(msg =>
                        msg.id === botMessageId ? {
                            ...msg,
                            content: fullContent,
                            searchResults: response.searchResults,
                            productDetail: response.productDetail,
                            supportTicket: response.supportTicket
                        } : msg
                    ));
                } else {
                    // Update streaming text
                    setMessages(prev => prev.map(msg =>
                        msg.id === botMessageId ? {
                            ...msg,
                            content: fullContent.substring(0, currentLength) + ' ⬤'
                        } : msg
                    ));
                }
                scrollToBottom();
            }, 15); // FAST stream 15ms per chunk

        }, 600);
    };

    return (
        <>
            <Button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "fixed bottom-6 right-4 sm:right-6 h-12 w-12 sm:h-14 sm:w-14 rounded-full shadow-lg z-[110] transition-all duration-300 hover:scale-110",
                    isOpen ? "rotate-90 bg-destructive hover:bg-destructive/90" : "bg-primary hover:bg-primary/90"
                )}
                size="icon"
            >
                {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
            </Button>

            <div
                className={cn(
                    "fixed bottom-24 right-4 sm:right-6 z-[110] w-[calc(100vw-2rem)] sm:w-[400px] transition-all duration-300 ease-in-out origin-bottom-right",
                    isOpen ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-10 pointer-events-none"
                )}
            >
                <Card className="border-primary/20 shadow-2xl overflow-hidden backdrop-blur-sm bg-background/95 h-[500px] sm:h-[600px] flex flex-col">
                    <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 p-4 flex flex-row items-center gap-3 border-b border-primary/10 shrink-0">
                        <div className="relative">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                                <Bot className="h-6 w-6 text-primary-foreground" />
                            </div>
                            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-background"></span>
                        </div>
                        <div className="flex-1">
                            <CardTitle className="text-lg flex items-center gap-2">
                                Sage
                                <Badge variant="secondary" className="text-xs">AI Assistant</Badge>
                            </CardTitle>
                            <p className="text-xs text-muted-foreground">Always here to help</p>
                        </div>
                    </CardHeader>

                    <CardContent className="p-0 flex-1 overflow-hidden flex flex-col">
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {messages.map((msg) => (
                                <div key={msg.id}>
                                    <div
                                        className={cn(
                                            "flex gap-3 max-w-[85%]",
                                            msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
                                        )}
                                    >
                                        <Avatar className="h-8 w-8 mt-1 shrink-0">
                                            {msg.role === 'assistant' ? (
                                                <>
                                                    <AvatarImage src="/sage-avatar.png" />
                                                    <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-primary-foreground">
                                                        <Bot className="h-4 w-4" />
                                                    </AvatarFallback>
                                                </>
                                            ) : (
                                                <>
                                                    <AvatarImage src="/user-avatar.png" />
                                                    <AvatarFallback className="bg-muted text-muted-foreground"><User className="h-4 w-4" /></AvatarFallback>                                                </>
                                            )}
                                        </Avatar>
                                        <div className="flex flex-col gap-2 flex-1 min-w-0">
                                            <div
                                                className={cn(
                                                    "p-3 rounded-2xl text-sm whitespace-pre-wrap max-w-full overflow-hidden",
                                                    msg.role === 'user'
                                                        ? "bg-primary text-primary-foreground rounded-tr-none"
                                                        : "bg-muted/50 text-foreground rounded-tl-none prose prose-sm dark:prose-invert prose-p:leading-relaxed prose-pre:bg-zinc-900 prose-pre:text-zinc-100"
                                                )}
                                            >
                                                {msg.role === 'user' ? (
                                                    msg.content
                                                ) : (
                                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                        {msg.content}
                                                    </ReactMarkdown>
                                                )}
                                            </div>

                                            {msg.productDetail && (
                                                <div className="rounded-xl border border-primary/20 bg-card overflow-hidden shadow-lg animate-in fade-in zoom-in-95 duration-300">
                                                    <div className="h-48 bg-muted relative">
                                                        {msg.productDetail.image ? (
                                                            <img
                                                                src={msg.productDetail.image}
                                                                alt={msg.productDetail.title}
                                                                className="w-full h-full object-cover"
                                                                onError={(e) => {
                                                                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1523475496153-3d6cc0f0bf19?w=800&q=80';
                                                                }}
                                                            />
                                                        ) : (
                                                            <div className="absolute inset-0 flex items-center justify-center bg-zinc-800 text-zinc-500">
                                                                <ShoppingBag className="h-8 w-8 opacity-20" />
                                                            </div>
                                                        )}
                                                        <Badge className="absolute top-2 right-2 bg-[#FF6200] text-black">
                                                            {msg.productDetail.category}
                                                        </Badge>
                                                    </div>
                                                    <div className="p-4 space-y-3">
                                                        <div>
                                                            <h3 className="font-bold text-lg leading-tight">{msg.productDetail.title}</h3>
                                                            <p className="text-sm text-muted-foreground">{msg.productDetail.description}</p>
                                                        </div>
                                                        <div className="flex items-center justify-between">
                                                            <div className="font-black text-xl">₦{msg.productDetail.price.toLocaleString()}</div>
                                                            <div className="text-xs text-muted-foreground flex items-center">
                                                                <Search className="h-3 w-3 mr-1" /> {msg.productDetail.location}
                                                            </div>
                                                        </div>
                                                        <Button className="w-full font-bold uppercase tracking-widest bg-[#FF6200] text-black hover:bg-white transition-colors" asChild>
                                                            <Link href={`/listings/${msg.productDetail.id}`}>
                                                                View Full Listing
                                                            </Link>
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}

                                            {msg.searchResults && msg.searchResults.length > 0 && (
                                                <div className="space-y-2">
                                                    {msg.searchResults.map((result) => (
                                                        <div
                                                            key={result.id}
                                                            onClick={() => handleSendMessage(`Tell me more about ${result.title}`)}
                                                            className="block p-3 bg-card border border-border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group text-left"
                                                        >
                                                            <div className="flex items-start justify-between gap-2">
                                                                <div className="flex-1">
                                                                    <p className="font-medium text-sm line-clamp-1 group-hover:text-primary transition-colors">{result.title}</p>                                                                    <p className="text-xs text-muted-foreground">{result.location}</p>
                                                                </div>
                                                                <Badge variant="secondary" className="text-xs shrink-0 group-hover:bg-[#FF6200] group-hover:text-black transition-colors">
                                                                    ₦{result.price.toLocaleString()}
                                                                </Badge>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    <Link href="/listings" className="block pt-2">
                                                        <Button variant="outline" size="sm" className="w-full font-bold uppercase tracking-widest text-[10px]">
                                                            <Search className="h-3 w-3 mr-2" />
                                                            Browse All Marketplace
                                                        </Button>
                                                    </Link>
                                                </div>
                                            )}

                                            {msg.supportTicket && (
                                                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                                                    <div className="flex items-start gap-2">
                                                        <AlertCircle className="h-4 w-4 text-blue-500 mt-0.5" />
                                                        <div className="flex-1">
                                                            <p className="text-xs font-semibold text-blue-700 dark:text-blue-400">
                                                                Support Ticket Created
                                                            </p>
                                                            <p className="text-xs text-muted-foreground mt-1">
                                                                Ticket ID: {msg.supportTicket.ticketId}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground mt-1">
                                                                Status: <strong>ESCALATED</strong> - An agent will contact you shortly.
                                                            </p>
                                                            <Badge variant="secondary" className="text-xs mt-2">
                                                                {msg.supportTicket.department === 'technical' ? '🔴 Technical Team' : '🟢 Operations Team'}
                                                            </Badge>
                                                            <a
                                                                href={`mailto:${msg.supportTicket.department === 'technical' ? 'support@marketbridge.com.ng' : 'ops-support@marketbridge.com.ng'}?subject=Ticket%20${msg.supportTicket.ticketId}`}
                                                                className="block mt-2 text-xs text-primary hover:underline font-semibold"
                                                            >
                                                                → Email {msg.supportTicket.department === 'technical' ? 'support@marketbridge.com.ng' : 'ops-support@marketbridge.com.ng'}
                                                            </a>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {isTyping && (
                                <div className="flex gap-3 max-w-[85%]">
                                    <Avatar className="h-8 w-8 mt-1">
                                        <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-primary-foreground">
                                            <Bot className="h-4 w-4" />
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="bg-muted/50 p-3 rounded-2xl rounded-tl-none flex items-center gap-1">
                                        <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                        <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                        <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce"></span>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                    </CardContent>

                    <div className="px-4 py-2 border-t border-white/5 bg-zinc-950/50">
                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide overscroll-contain overscroll-x-contain">
                            {['Find Textbooks', 'Cheap Laptops', 'Wigs for Sale', 'Food Delivery', 'Sell Item'].map((chip) => (
                                <button
                                    key={chip}
                                    onClick={() => handleSendMessage(chip)}
                                    className="whitespace-nowrap px-3 py-1.5 rounded-full bg-white/5 hover:bg-[#FF6200] hover:text-black border border-white/10 text-[10px] font-bold uppercase tracking-wide transition-all text-zinc-400"
                                >
                                    {chip}
                                </button>
                            ))}
                        </div>
                    </div>

                    <CardFooter className="p-3 bg-muted/20 border-t border-primary/10 shrink-0">
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleSendMessage();
                            }}
                            className="flex w-full gap-2"
                        >
                            <Input
                                placeholder="Ask Sage anything..."
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                className="bg-background/50 focus-visible:ring-primary"
                            />
                            <Button type="submit" size="icon" disabled={!inputValue.trim() || isTyping}>
                                <Send className="h-4 w-4" />
                            </Button>
                        </form>
                    </CardFooter>
                </Card>
            </div>
        </>
    );
}