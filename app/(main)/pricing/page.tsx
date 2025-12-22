import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check } from 'lucide-react';
import Link from 'next/link';

export default function PricingPage() {
    return (
        <div className="container mx-auto py-16 px-4">
            <div className="text-center max-w-3xl mx-auto mb-16">
                <h1 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h1>
                <p className="text-xl text-muted-foreground">
                    Choose the plan that fits your business needs. No hidden fees.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                {/* Basic Plan */}
                <Card className="flex flex-col">
                    <CardHeader>
                        <CardTitle className="text-2xl">Starter</CardTitle>
                        <CardDescription>For individuals just starting out</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1">
                        <div className="mb-6">
                            <span className="text-4xl font-bold">Free</span>
                            <span className="text-muted-foreground">/month</span>
                        </div>
                        <ul className="space-y-3">
                            <li className="flex items-center gap-2">
                                <Check className="h-4 w-4 text-primary" />
                                <span>Up to 5 active listings</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <Check className="h-4 w-4 text-primary" />
                                <span>Basic analytics</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <Check className="h-4 w-4 text-primary" />
                                <span>Standard support</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <Check className="h-4 w-4 text-primary" />
                                <span>5% transaction fee</span>
                            </li>
                        </ul>
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full" variant="outline" asChild>
                            <Link href="/signup">Get Started</Link>
                        </Button>
                    </CardFooter>
                </Card>

                {/* Pro Plan */}
                <Card className="flex flex-col border-primary shadow-lg relative">
                    <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg">
                        POPULAR
                    </div>
                    <CardHeader>
                        <CardTitle className="text-2xl">Professional</CardTitle>
                        <CardDescription>For growing businesses</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1">
                        <div className="mb-6">
                            <span className="text-4xl font-bold">₦5,000</span>
                            <span className="text-muted-foreground">/month</span>
                        </div>
                        <ul className="space-y-3">
                            <li className="flex items-center gap-2">
                                <Check className="h-4 w-4 text-primary" />
                                <span>Up to 50 active listings</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <Check className="h-4 w-4 text-primary" />
                                <span>Advanced analytics</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <Check className="h-4 w-4 text-primary" />
                                <span>Priority support</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <Check className="h-4 w-4 text-primary" />
                                <span>Verified Dealer Badge</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <Check className="h-4 w-4 text-primary" />
                                <span>2.5% transaction fee</span>
                            </li>
                        </ul>
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full" asChild>
                            <Link href="/signup">Start Free Trial</Link>
                        </Button>
                    </CardFooter>
                </Card>

                {/* Enterprise Plan */}
                <Card className="flex flex-col">
                    <CardHeader>
                        <CardTitle className="text-2xl">Enterprise</CardTitle>
                        <CardDescription>For large scale operations</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1">
                        <div className="mb-6">
                            <span className="text-4xl font-bold">₦20,000</span>
                            <span className="text-muted-foreground">/month</span>
                        </div>
                        <ul className="space-y-3">
                            <li className="flex items-center gap-2">
                                <Check className="h-4 w-4 text-primary" />
                                <span>Unlimited listings</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <Check className="h-4 w-4 text-primary" />
                                <span>Custom analytics reports</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <Check className="h-4 w-4 text-primary" />
                                <span>Dedicated account manager</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <Check className="h-4 w-4 text-primary" />
                                <span>API access</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <Check className="h-4 w-4 text-primary" />
                                <span>1% transaction fee</span>
                            </li>
                        </ul>
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full" variant="outline" asChild>
                            <Link href="/contact">Contact Sales</Link>
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
