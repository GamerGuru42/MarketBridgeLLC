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

interface Message {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
    searchResults?: SearchResult[];
    supportTicket?: SupportTicket;
}

interface SearchResult {
    id: string;
    title: string;
    price: number;
    category: string;
    location: string;
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
            content: 'Hello! I\'m Sage, your MarketBridge AI assistant. I can help you find products, troubleshoot issues, or connect you with our support team. How can I help you shop without fear today?',
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

    // Mock product database for search
    const PRODUCTS = [
        { id: '1', title: 'iPhone 15 Pro Max 256GB', price: 1850000, category: 'Electronics', location: 'Ikeja, Lagos', keywords: ['phone', 'mobile', 'apple', 'iphone', '256gb', 'smartphone'] },
        { id: '2', title: 'Toyota Camry 2021 Foreign Used', price: 15000000, category: 'Automotive', location: 'Victoria Island', keywords: ['car', 'toyota', 'camry', 'vehicle', 'auto'] },
        { id: '3', title: 'MacBook Pro M3 1TB', price: 2400000, category: 'Electronics', location: 'Yaba, Lagos', keywords: ['laptop', 'macbook', 'computer', 'apple', 'm3', '1tb'] },
        { id: '4', title: 'Sony PS5 Disc Edition', price: 650000, category: 'Electronics', location: 'Lekki, Lagos', keywords: ['gaming', 'playstation', 'ps5', 'console', 'sony'] },
        { id: '5', title: 'Nike Air Jordan 1 High Size 42', price: 120000, category: 'Fashion', location: 'Surulere, Lagos', keywords: ['shoes', 'sneakers', 'nike', 'jordan', 'footwear'] },
        { id: '6', title: 'Luxury Italian Leather Sofa 7-Seater', price: 3500000, category: 'Home & Garden', location: 'Ikoyi, Lagos', keywords: ['furniture', 'sofa', 'couch', 'home', 'leather'] },
    ];

    const searchProducts = (query: string): SearchResult[] => {
        const lowerQuery = query.toLowerCase();
        const matches = PRODUCTS.filter(product =>
            product.keywords.some(kw => kw.includes(lowerQuery)) ||
            product.title.toLowerCase().includes(lowerQuery) ||
            product.category.toLowerCase().includes(lowerQuery)
        );
        return matches.slice(0, 3);
    };

    const generateResponse = (input: string): { content: string; searchResults?: SearchResult[]; supportTicket?: SupportTicket } => {
        const lowerInput = input.toLowerCase();

        // Product search
        if (lowerInput.includes('find') || lowerInput.includes('search') || lowerInput.includes('looking for') ||
            lowerInput.includes('buy') || lowerInput.includes('need') || lowerInput.includes('want')) {
            const results = searchProducts(lowerInput);
            if (results.length > 0) {
                return {
                    content: `I found ${results.length} product(s) that match your search. Here are the top results:`,
                    searchResults: results
                };
            }
            return { content: "I couldn't find any exact matches, but you can browse our full catalog by category in the listings page." };
        }

        // Technical support escalation
        if (lowerInput.includes('not working') || lowerInput.includes('broken') || lowerInput.includes('error') ||
            lowerInput.includes('bug') || lowerInput.includes('technical issue') || lowerInput.includes('can\'t login')) {
            return {
                content: "I understand you're experiencing a technical issue. Let me connect you with our Technical Support team who can assist you better.",
                supportTicket: {
                    ticketId: `TECH-${Date.now()}`,
                    status: 'escalated',
                    department: 'technical'
                }
            };
        }

        // Operations support escalation
        if (lowerInput.includes('delivery') || lowerInput.includes('order') || lowerInput.includes('refund') ||
            lowerInput.includes('payment issue') || lowerInput.includes('dispute')) {
            return {
                content: "I'm escalating this to our Operations team who specialize in order and delivery matters. They'll reach out to you shortly.",
                supportTicket: {
                    ticketId: `OPS-${Date.now()}`,
                    status: 'escalated',
                    department: 'operations'
                }
            };
        }

        // Troubleshooting
        if (lowerInput.includes('how do i') || lowerInput.includes('how to')) {
            if (lowerInput.includes('verify') || lowerInput.includes('become a dealer')) {
                return { content: "To become a verified dealer:\n1. Sign up with your business email\n2. Choose 'Dealer' during registration\n3. Upload your business documents (CAC certificate, ID)\n4. Wait 24-48 hours for verification\n\nNeed help with a specific step?" };
            }
            if (lowerInput.includes('pay') || lowerInput.includes('checkout')) {
                return { content: "To complete a purchase:\n1. Add items to your cart\n2. Click 'Checkout'\n3. Enter delivery address\n4. Choose payment method (we support Paystack)\n5. Confirm your order\n\nYou can also pay on delivery for added security!" };
            }
            return { content: "I can help you with: account setup, making purchases, becoming a dealer, or tracking orders. What specifically would you like to know?" };
        }

        // Trust & Safety
        if (lowerInput.includes('trust') || lowerInput.includes('safe') || lowerInput.includes('fear') || lowerInput.includes('scam')) {
            return { content: "MarketBridge is designed for you to shop without fear. We verify all dealers, hold payments in escrow until you receive items, and maintain public reviews. Every transaction is protected. What specific concern can I address?" };
        }

        // Pricing questions
        if (lowerInput.includes('price') || lowerInput.includes('cost') || lowerInput.includes('fee')) {
            return { content: "We have transparent pricing with no hidden fees. What you see is what you pay. Transaction fees range from 1-5% depending on your dealer tier. Check our pricing page for details!" };
        }

        // Greeting
        if (lowerInput.includes('hello') || lowerInput.includes('hi') || lowerInput.includes('hey')) {
            return { content: "Hello! I'm Sage, your AI assistant. I can help you find products, answer questions, or connect you with support. What are you looking for today?" };
        }

        // Default intelligent response
        return { content: "I'm here to help! I can:\n• Search for specific products\n• Answer questions about the platform\n• Troubleshoot issues\n• Connect you with technical or operations support\n\nWhat would you like assistance with?" };
    };

    const handleSendMessage = async () => {
        if (!inputValue.trim()) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: inputValue,
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
                <Card className="border-primary/20 shadow-2xl overflow-hidden backdrop-blur-sm bg-background/95">
                    <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 p-4 flex flex-row items-center gap-3 border-b border-primary/10">
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

                    <CardContent className="p-0 h-[450px] flex flex-col">
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {messages.map((msg) => (
                                <div key={msg.id}>
                                    <div
                                        className={cn(
                                            "flex gap-3 max-w-[85%]",
                                            msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
                                        )}
                                    >
                                        <Avatar className="h-8 w-8 mt-1">
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
                                        <div className="flex flex-col gap-2 flex-1">
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

                                            {/* Search Results */}
                                            {msg.searchResults && msg.searchResults.length > 0 && (
                                                <div className="space-y-2">
                                                    {msg.searchResults.map((result) => (
                                                        <Link
                                                            key={result.id}
                                                            href={`/listings/${result.id}`}
                                                            className="block p-3 bg-card border border-border rounded-lg hover:bg-muted/50 transition-colors"
                                                        >
                                                            <div className="flex items-start justify-between gap-2">
                                                                <div className="flex-1">
                                                                    <p className="font-medium text-sm line-clamp-1">{result.title}</p>
                                                                    <p className="text-xs text-muted-foreground">{result.location}</p>
                                                                </div>
                                                                <Badge variant="secondary" className="text-xs shrink-0">
                                                                    ₦{result.price.toLocaleString()}
                                                                </Badge>
                                                            </div>
                                                        </Link>
                                                    ))}
                                                    <Link href="/listings">
                                                        <Button variant="outline" size="sm" className="w-full">
                                                            <Search className="h-3 w-3 mr-2" />
                                                            View All Results
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
                                                        <Button size="sm" variant="ghost" className="h-7">
                                                            <Phone className="h-3 w-3 mr-1" />
                                                            Call
                                                        </Button>
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

                    <CardFooter className="p-3 bg-muted/20 border-t border-primary/10">
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
