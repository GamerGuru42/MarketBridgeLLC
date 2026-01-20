'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, X, Send, Bot, User, Sparkles, Phone, Search, AlertCircle } from 'lucide-react';
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
    description?: string;
    keywords?: string[];
}

interface SupportTicket {
    ticketId: string;
    status: 'escalated' | 'pending';
    department: 'technical' | 'operations';
}

export function AiAssistant() {
    const [isOpen, setIsOpen] = useState(false);

    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'assistant',
            content: 'Hello! I\'m Sage, your MarketBridge AI assistant. I can help you find products, troubleshoot issues, or connect you connect with our support team. How can I help you shop without fear today?',
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

    // Use the new AI Brain
    const generateResponse = (input: string): { content: string; searchResults?: SearchResult[]; productDetail?: SearchResult; supportTicket?: SupportTicket } => {
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

        // Simulate AI processing time
        setTimeout(() => {
            const response = generateResponse(userMessage.content);
            const botMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: response.content,
                timestamp: new Date(),
                searchResults: response.searchResults,
                productDetail: response.productDetail,
                supportTicket: response.supportTicket
            };
            setMessages(prev => [...prev, botMessage]);
            setIsTyping(false);
        }, 800);
    };

    return (
        <>
            {/* Floating Toggle Button */}
            <Button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50 transition-all duration-300 hover:scale-110",
                    isOpen ? "rotate-90 bg-destructive hover:bg-destructive/90" : "bg-primary hover:bg-primary/90"
                )}
                size="icon"
            >
                {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
            </Button>

            {/* Chat Window */}
            <div
                className={cn(
                    "fixed bottom-24 right-6 z-50 w-[350px] sm:w-[420px] transition-all duration-300 ease-in-out origin-bottom-right",
                    isOpen ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-10 pointer-events-none"
                )}
            >
                <Card className="border-primary/20 shadow-2xl overflow-hidden backdrop-blur-sm bg-background/95 h-[600px] flex flex-col">
                    <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 p-4 flex flex-row items-center gap-3 border-b border-primary/10 shrink-0">
                        <div className="relative">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                                <Sparkles className="h-5 w-5 text-primary-foreground" />
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
                                                    <AvatarFallback className="bg-muted text-muted-foreground"><User className="h-4 w-4" /></AvatarFallback>
                                                </>
                                            )}
                                        </Avatar>
                                        <div className="flex flex-col gap-2 flex-1 min-w-0">
                                            <div
                                                className={cn(
                                                    "p-3 rounded-2xl text-sm whitespace-pre-wrap",
                                                    msg.role === 'user'
                                                        ? "bg-primary text-primary-foreground rounded-tr-none"
                                                        : "bg-muted/50 text-foreground rounded-tl-none"
                                                )}
                                            >
                                                {msg.content}
                                            </div>

                                            {/* Product Details Card (Single Item) */}
                                            {msg.productDetail && (
                                                <div className="rounded-xl border border-primary/20 bg-card overflow-hidden shadow-lg animate-in fade-in zoom-in-95 duration-300">
                                                    <div className="h-32 bg-muted relative">
                                                        {/* Placeholder for image - in real app use Next Image */}
                                                        <div className="absolute inset-0 flex items-center justify-center bg-zinc-800 text-zinc-500">
                                                            <Sparkles className="h-8 w-8 opacity-20" />
                                                        </div>
                                                        <Badge className="absolute top-2 right-2 bg-[#FFB800] text-black">
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
                                                        <Button className="w-full font-bold uppercase tracking-widest bg-[#FFB800] text-black hover:bg-[#FFD700]" asChild>
                                                            <Link href={`/listings/${msg.productDetail.id}`}>
                                                                View Full Listing
                                                            </Link>
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Search Results List */}
                                            {msg.searchResults && msg.searchResults.length > 0 && (
                                                <div className="space-y-2">
                                                    {msg.searchResults.map((result) => (
                                                        <div
                                                            key={result.id}
                                                            // Instead of navigating, we chat about it
                                                            onClick={() => handleSendMessage(`Tell me more about ${result.title}`)}
                                                            className="block p-3 bg-card border border-border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group text-left"
                                                        >
                                                            <div className="flex items-start justify-between gap-2">
                                                                <div className="flex-1">
                                                                    <p className="font-medium text-sm line-clamp-1 group-hover:text-primary transition-colors">{result.title}</p>
                                                                    <p className="text-xs text-muted-foreground">{result.location}</p>
                                                                </div>
                                                                <Badge variant="secondary" className="text-xs shrink-0 group-hover:bg-[#FFB800] group-hover:text-black transition-colors">
                                                                    ₦{result.price.toLocaleString()}
                                                                </Badge>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    <Link href="/listings" className="block pt-2">
                                                        <Button variant="outline" size="sm" className="w-full">
                                                            <Search className="h-3 w-3 mr-2" />
                                                            Browse All Marketplace
                                                        </Button>
                                                    </Link>
                                                </div>
                                            )}

                                            {/* Support Ticket */}
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
                                                            <Badge variant="secondary" className="text-xs mt-2">
                                                                {msg.supportTicket.department === 'technical' ? '🔧 Technical Team' : '📦 Operations Team'}
                                                            </Badge>
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
