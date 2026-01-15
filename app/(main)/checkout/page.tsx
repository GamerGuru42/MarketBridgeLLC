'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageCircle, ShoppingBag } from 'lucide-react';
import Link from 'next/link';

export default function CheckoutPage() {
    const router = useRouter();
    const { user, loading } = useAuth();

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading]);

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-2xl mx-auto">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-2xl">Secure Checkout</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
                            <div className="flex items-start gap-4">
                                <MessageCircle className="h-8 w-8 text-blue-600 dark:text-blue-400 mt-1" />
                                <div>
                                    <h3 className="font-semibold text-lg mb-2">New Checkout Process</h3>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        We've improved our checkout experience! You can now initiate secure escrow payments directly in your chat with the dealer.
                                    </p>
                                    <div className="space-y-2 text-sm">
                                        <p className="font-medium">How it works:</p>
                                        <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                                            <li>Browse listings and find a product you like</li>
                                            <li>Click "Contact Dealer" to start a conversation</li>
                                            <li>Discuss product details and negotiate if needed</li>
                                            <li>Click "Initiate Escrow" in the chat when ready to buy</li>
                                            <li>Your payment is held securely until you confirm delivery</li>
                                        </ol>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Button asChild size="lg" className="h-auto py-4">
                                <Link href="/listings" className="flex flex-col items-center gap-2">
                                    <ShoppingBag className="h-6 w-6" />
                                    <span>Browse Listings</span>
                                </Link>
                            </Button>
                            <Button asChild variant="outline" size="lg" className="h-auto py-4">
                                <Link href="/chats" className="flex flex-col items-center gap-2">
                                    <MessageCircle className="h-6 w-6" />
                                    <span>View Messages</span>
                                </Link>
                            </Button>
                        </div>

                        <div className="border-t pt-6">
                            <h4 className="font-semibold mb-3">Benefits of Chat-Based Checkout:</h4>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li className="flex items-start gap-2">
                                    <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
                                    <span>Direct communication with sellers</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
                                    <span>Secure escrow protection for all transactions</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
                                    <span>Negotiate prices and ask questions before buying</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
                                    <span>Track your order status in real-time</span>
                                </li>
                            </ul>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
