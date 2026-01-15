'use client';

import React from 'react';
import Link from 'next/link';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Trash2, ShoppingBag, ArrowRight, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function CartPage() {
    const { items, removeFromCart, clearCart, total, itemCount } = useCart();
    const router = useRouter();

    if (itemCount === 0) {
        return (
            <div className="min-h-screen py-20 px-4">
                <div className="container mx-auto max-w-md text-center">
                    <div className="bg-muted/30 rounded-full h-24 w-24 flex items-center justify-center mx-auto mb-6">
                        <ShoppingBag className="h-12 w-12 text-muted-foreground" />
                    </div>
                    <h1 className="text-2xl font-bold mb-2">Your cart is empty</h1>
                    <p className="text-muted-foreground mb-8">
                        Looks like you haven't added anything to your cart yet.
                    </p>
                    <Button asChild size="lg">
                        <Link href="/listings">
                            Start Shopping
                        </Link>
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen py-8">
            <div className="container px-4 mx-auto max-w-6xl">
                <h1 className="text-3xl font-bold mb-8">Shopping Cart ({itemCount} items)</h1>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Cart Items */}
                    <div className="lg:col-span-2 space-y-4">
                        {items.map((item) => (
                            <Card key={item.listingId}>
                                <CardContent className="p-4 flex gap-4">
                                    <div className="h-24 w-24 bg-muted rounded-md overflow-hidden flex-shrink-0">
                                        {item.image ? (
                                            <img
                                                src={item.image}
                                                alt={item.title}
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <div className="h-full w-full flex items-center justify-center text-xs text-muted-foreground">
                                                No Image
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 flex flex-col justify-between">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-semibold line-clamp-1">{item.title}</h3>
                                                <p className="text-sm text-muted-foreground">Quantity: {item.quantity}</p>
                                            </div>
                                            <p className="font-bold">₦{item.price.toLocaleString()}</p>
                                        </div>
                                        <div className="flex justify-end">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                onClick={() => removeFromCart(item.listingId)}
                                            >
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                Remove
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}

                        <div className="flex justify-end">
                            <Button variant="outline" onClick={clearCart} className="text-muted-foreground">
                                Clear Cart
                            </Button>
                        </div>
                    </div>

                    {/* Order Summary */}
                    <div className="lg:col-span-1">
                        <Card className="sticky top-24">
                            <CardHeader>
                                <CardTitle>Order Summary</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Subtotal</span>
                                    <span>₦{total.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Shipping</span>
                                    <span className="text-green-600">Free</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between font-bold text-lg">
                                    <span>Total</span>
                                    <span>₦{total.toLocaleString()}</span>
                                </div>
                            </CardContent>
                            <CardFooter className="flex-col gap-3">
                                <Button
                                    className="w-full"
                                    size="lg"
                                    onClick={() => router.push('/checkout')}
                                    disabled={items.length === 0}
                                >
                                    Proceed to Checkout
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                                <Button variant="ghost" className="w-full" asChild>
                                    <Link href="/listings">
                                        <ArrowLeft className="mr-2 h-4 w-4" />
                                        Continue Shopping
                                    </Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
