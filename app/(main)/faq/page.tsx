import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Shield, Eye, MessageSquare, TrendingUp, Users, Lock } from 'lucide-react';

export default function FAQPage() {
    const faqs = [
        {
            question: "What makes MarketBridge 'trustless'?",
            answer: "In a trustless marketplace, you don't need to blindly trust dealers. We provide transparency through verified dealer badges, public reviews, transaction history, and clear order tracking. The platform's mechanisms replace the need for trust."
        },
        {
            question: "How does payment on delivery work?",
            answer: "You only pay when you receive your items. This protects buyers from fraud and ensures you get exactly what you ordered. It's our way of making transactions secure without requiring upfront trust."
        },
        {
            question: "Are all dealers verified?",
            answer: "We verify dealers through our verification process. Look for the green 'Verified Dealer' badge before making a purchase. Verified dealers have confirmed their identity and business information."
        },
        {
            question: "Can I return items?",
            answer: "Return policies vary by dealer. Check the listing details or contact the dealer directly before purchasing. All communication is recorded for your protection."
        },
        {
            question: "How do I become a verified dealer?",
            answer: "Sign up as a dealer and complete your profile with accurate business information. Our team will review your application and verify your credentials. Verification helps build trust with customers."
        },
        {
            question: "What if I have an issue with my order?",
            answer: "Contact the dealer directly through our messaging system. All conversations are recorded. If you can't resolve the issue, our support team can help mediate."
        },
        {
            question: "Are there any hidden fees?",
            answer: "No. What you see is what you pay. We believe in complete transparency - no surprise charges at checkout."
        },
        {
            question: "How do reviews work?",
            answer: "After receiving your order, you can leave a review. Reviews are public and cannot be deleted by dealers, ensuring honest feedback for future customers."
        },
        {
            question: "Is my personal information safe?",
            answer: "Yes. We use industry-standard security measures to protect your data. We never share your personal information with third parties without your consent."
        },
        {
            question: "Can I track my order?",
            answer: "Yes! Every order has a tracking page showing its status: Pending → Confirmed → Shipped → Delivered. You'll see exactly where your order is in the process."
        }
    ];

    return (
        <div className="min-h-screen py-16">
            <div className="container mx-auto px-4 max-w-4xl">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold mb-4">Frequently Asked Questions</h1>
                    <p className="text-lg text-muted-foreground">
                        Everything you need to know about shopping on MarketBridge
                    </p>
                </div>

                {/* Trust Highlights */}
                <div className="grid md:grid-cols-3 gap-4 mb-12">
                    <Card>
                        <CardContent className="p-6 text-center">
                            <Shield className="h-8 w-8 mx-auto mb-3 text-primary" />
                            <h3 className="font-semibold mb-1">Verified Dealers</h3>
                            <p className="text-sm text-muted-foreground">All dealers go through verification</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-6 text-center">
                            <Eye className="h-8 w-8 mx-auto mb-3 text-primary" />
                            <h3 className="font-semibold mb-1">Full Transparency</h3>
                            <p className="text-sm text-muted-foreground">See ratings and reviews before buying</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-6 text-center">
                            <Lock className="h-8 w-8 mx-auto mb-3 text-primary" />
                            <h3 className="font-semibold mb-1">Secure Payments</h3>
                            <p className="text-sm text-muted-foreground">Pay on delivery for your protection</p>
                        </CardContent>
                    </Card>
                </div>

                {/* FAQs */}
                <div className="space-y-6">
                    {faqs.map((faq, index) => (
                        <Card key={index}>
                            <CardContent className="p-6">
                                <h3 className="text-lg font-semibold mb-3">{faq.question}</h3>
                                <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* CTA */}
                <div className="mt-12 text-center">
                    <Card className="bg-primary text-primary-foreground">
                        <CardContent className="p-8">
                            <h2 className="text-2xl font-bold mb-4">Still have questions?</h2>
                            <p className="mb-6 opacity-90">
                                Our support team is here to help
                            </p>
                            <div className="flex gap-4 justify-center">
                                <Button asChild variant="secondary" size="lg">
                                    <Link href="/contact">Contact Support</Link>
                                </Button>
                                <Button asChild variant="outline" size="lg" className="bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary">
                                    <Link href="/about">Learn More</Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
