import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Shield, Users, Eye, MessageSquare, CheckCircle, Lock, Wallet, Clock, AlertTriangle } from 'lucide-react';

export default function AboutPage() {
    return (
        <div className="min-h-screen">
            {/* Hero Section */}
            <section className="bg-gradient-to-b from-primary/10 to-background py-20">
                <div className="container mx-auto px-4 text-center">
                    <h1 className="text-5xl font-bold mb-6">About MarketBridge</h1>
                    <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                        Beginning with verified used cars, we are building Nigeria's first <span className="text-primary font-semibold">escrow-protected marketplace</span> - where your money stays safe until you receive and verify your vehicle.
                    </p>
                </div>
            </section>

            {/* Escrow Protection Section */}
            <section className="py-16 bg-primary/5">
                <div className="container mx-auto px-4 max-w-4xl">
                    <h2 className="text-3xl font-bold mb-4 text-center">🔒 Escrow Payment Protection</h2>
                    <p className="text-lg text-muted-foreground mb-8 text-center">
                        Your money is held securely until you confirm delivery. No more sending money and hoping for the best.
                    </p>

                    <div className="grid md:grid-cols-3 gap-6">
                        <Card className="border-primary/20">
                            <CardContent className="p-6 text-center">
                                <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Wallet className="h-8 w-8 text-primary" />
                                </div>
                                <h3 className="font-semibold mb-2">You Pay to Escrow</h3>
                                <p className="text-sm text-muted-foreground">
                                    Your payment goes to a secure escrow account, not directly to the dealer.
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="border-primary/20">
                            <CardContent className="p-6 text-center">
                                <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Clock className="h-8 w-8 text-primary" />
                                </div>
                                <h3 className="font-semibold mb-2">Dealer Ships</h3>
                                <p className="text-sm text-muted-foreground">
                                    The dealer ships your order knowing payment is guaranteed upon delivery.
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="border-primary/20">
                            <CardContent className="p-6 text-center">
                                <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle className="h-8 w-8 text-primary" />
                                </div>
                                <h3 className="font-semibold mb-2">You Confirm Delivery</h3>
                                <p className="text-sm text-muted-foreground">
                                    Only when you confirm receipt does the dealer get paid. Simple and safe.
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="mt-8 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                            <div>
                                <h4 className="font-semibold text-yellow-700">Dispute Protection</h4>
                                <p className="text-sm text-muted-foreground">
                                    If there's an issue with your order, you can raise a dispute. Our team will review the case and ensure fair resolution.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* What Makes Us Different */}
            <section className="py-16">
                <div className="container mx-auto px-4 max-w-4xl">
                    <h2 className="text-3xl font-bold mb-8 text-center">What Makes Us Different?</h2>
                    <p className="text-lg text-muted-foreground mb-8">
                        Unlike other marketplaces where you send money and hope for the best, MarketBridge protects both buyers and dealers with verified identities and secure escrow payments.
                    </p>

                    <div className="grid md:grid-cols-2 gap-6">
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-start gap-4">
                                    <div className="bg-primary/10 p-3 rounded-lg">
                                        <Shield className="h-6 w-6 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold mb-2">Verified Dealers</h3>
                                        <p className="text-sm text-muted-foreground">
                                            All dealers submit NIN, CAC, or ID documents. Look for the verified badge before purchasing.
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-start gap-4">
                                    <div className="bg-primary/10 p-3 rounded-lg">
                                        <Lock className="h-6 w-6 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold mb-2">Escrow Payments</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Your money is held safely until you confirm delivery. Dealers get paid only when you're satisfied.
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-start gap-4">
                                    <div className="bg-primary/10 p-3 rounded-lg">
                                        <MessageSquare className="h-6 w-6 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold mb-2">In-App Messaging</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Chat directly with dealers. Share images and negotiate prices. All chats are saved for your protection.
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-start gap-4">
                                    <div className="bg-primary/10 p-3 rounded-lg">
                                        <Users className="h-6 w-6 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold mb-2">Honest Reviews</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Real reviews from real customers. Dealers can't delete negative feedback.
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className="py-16 bg-muted/30">
                <div className="container mx-auto px-4 max-w-4xl">
                    <h2 className="text-3xl font-bold mb-12 text-center">How It Works</h2>

                    <div className="space-y-8">
                        <div className="flex gap-6">
                            <div className="flex-shrink-0">
                                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">
                                    1
                                </div>
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold mb-2">Browse & Choose</h3>
                                <p className="text-muted-foreground">
                                    Search products from verified dealers. Check their ratings, reviews, and verification status before buying.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-6">
                            <div className="flex-shrink-0">
                                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">
                                    2
                                </div>
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold mb-2">Chat & Negotiate</h3>
                                <p className="text-muted-foreground">
                                    Message the dealer directly. Ask questions, request more photos, or negotiate prices. All chats support text and images.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-6">
                            <div className="flex-shrink-0">
                                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">
                                    3
                                </div>
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold mb-2">Pay with Escrow</h3>
                                <p className="text-muted-foreground">
                                    Initiate an escrow payment from the chat. Your money is held securely until you confirm delivery - the dealer can't access it until then.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-6">
                            <div className="flex-shrink-0">
                                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">
                                    4
                                </div>
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold mb-2">Receive & Confirm</h3>
                                <p className="text-muted-foreground">
                                    Once you receive your order in good condition, confirm delivery. The payment is released to the dealer. Leave a review to help others.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Why Choose Us */}
            <section className="py-16">
                <div className="container mx-auto px-4 max-w-4xl text-center">
                    <h2 className="text-3xl font-bold mb-6">Why Choose MarketBridge?</h2>
                    <div className="grid md:grid-cols-3 gap-8 mt-12">
                        <div>
                            <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Lock className="h-8 w-8 text-primary" />
                            </div>
                            <h3 className="font-semibold mb-2">100% Payment Protection</h3>
                            <p className="text-sm text-muted-foreground">
                                Escrow ensures your money is only released when you're satisfied with your order.
                            </p>
                        </div>
                        <div>
                            <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Shield className="h-8 w-8 text-primary" />
                            </div>
                            <h3 className="font-semibold mb-2">Verified Dealers Only</h3>
                            <p className="text-sm text-muted-foreground">
                                Every dealer is verified with government ID. No anonymous sellers.
                            </p>
                        </div>
                        <div>
                            <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Eye className="h-8 w-8 text-primary" />
                            </div>
                            <h3 className="font-semibold mb-2">Full Transparency</h3>
                            <p className="text-sm text-muted-foreground">
                                See dealer history, ratings, and reviews. Make informed decisions.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-16 bg-primary text-primary-foreground">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-3xl font-bold mb-4">Ready to Shop Safely?</h2>
                    <p className="text-lg mb-8 opacity-90">
                        Join thousands of Nigerians using escrow-protected shopping on MarketBridge
                    </p>
                    <div className="flex gap-4 justify-center">
                        <Button asChild size="lg" variant="secondary">
                            <Link href="/listings">Browse Products</Link>
                        </Button>
                        <Button asChild size="lg" variant="outline" className="bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary">
                            <Link href="/signup">Become a Dealer</Link>
                        </Button>
                    </div>
                </div>
            </section>
        </div>
    );
}
