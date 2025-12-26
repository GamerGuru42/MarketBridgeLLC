'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { ShoppingCart, Menu, User, LogOut, LayoutDashboard, Package, Home, ListIcon, Users, DollarSign, Info, Phone, MessageCircle, Settings, Heart, Shield, CreditCard, HelpCircle, MapPin, Crown } from 'lucide-react';
import { useRouter } from 'next/navigation';

export const Header = () => {
    const { user, logout, loading } = useAuth();
    const { itemCount } = useCart();
    const router = useRouter();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const handleSignOut = () => {
        logout();
        router.push('/');
    };

    const closeMobileMenu = () => {
        setMobileMenuOpen(false);
    };

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto flex h-16 items-center justify-between px-4">
                {/* Logo with Beta Badge */}
                <div className="flex items-center gap-2">
                    <Logo />
                    <span className="hidden sm:inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                        BETA
                    </span>
                </div>

                {/* Desktop Navigation */}
                <nav className="hidden lg:flex items-center gap-6 text-sm font-medium">
                    <Link href="/" className="transition-colors hover:text-primary">Home</Link>
                    <Link href="/listings" className="transition-colors hover:text-primary">Listings</Link>
                    <Link href="/dealers" className="transition-colors hover:text-primary">Find Dealers</Link>
                    <Link href="/pricing" className="transition-colors hover:text-primary">Pricing</Link>
                    <Link href="/about" className="transition-colors hover:text-primary">About</Link>
                    <Link href="/contact" className="transition-colors hover:text-primary">Contact</Link>
                </nav>

                {/* Actions */}
                <div className="flex items-center gap-2">
                    {loading && !user ? null : (
                        <>
                            {user && (
                                <div className="flex items-center gap-2">
                                    {/* Messages Icon */}
                                    <Link href="/chats">
                                        <Button variant="ghost" size="icon">
                                            <MessageCircle className="h-5 w-5" />
                                        </Button>
                                    </Link>

                                    {/* Cart Icon (only for customers) */}
                                    {user.role === 'customer' && (
                                        <Link href="/cart">
                                            <Button variant="ghost" size="icon" className="relative">
                                                <ShoppingCart className="h-5 w-5" />
                                                {itemCount > 0 && (
                                                    <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center">
                                                        {itemCount}
                                                    </span>
                                                )}
                                            </Button>
                                        </Link>
                                    )}
                                </div>
                            )}

                            {/* Login and Sign Up Buttons - Desktop only */}
                            {!user && (
                                <div className="hidden lg:flex items-center gap-3">
                                    <Link
                                        href="/signup?role=dealer"
                                        className="hidden xl:flex items-center text-xs font-bold uppercase tracking-widest text-primary hover:text-primary/80 transition-colors mr-4"
                                    >
                                        Join as Dealer
                                    </Link>
                                    <Button variant="ghost" asChild size="sm" className="hidden sm:flex">
                                        <Link href="/login">Sign In</Link>
                                    </Button>
                                    <Button asChild size="sm" className="shadow-lg shadow-primary/20">
                                        <Link href="/signup">Create Account</Link>
                                    </Button>
                                </div>
                            )}

                            {/* Account Dropdown - Desktop */}
                            {user && (
                                <div className="hidden lg:block">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="gap-2">
                                                {user?.photoURL ? (
                                                    <div className="relative h-6 w-6 rounded-full overflow-hidden">
                                                        <Image src={user.photoURL} alt={user.displayName || 'User'} fill className="object-cover" />
                                                    </div>
                                                ) : (
                                                    <User className="h-5 w-5" />
                                                )}
                                                <span className="hidden xl:inline">{user?.displayName || 'Account'}</span>
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-64 p-2">
                                            <DropdownMenuLabel className="font-normal">
                                                <div className="flex flex-col space-y-1 py-1 px-1">
                                                    <p className="text-sm font-medium leading-none">{user?.displayName}</p>
                                                    <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                                                    {user?.location && (
                                                        <div className="flex items-center pt-1 text-[10px] text-primary/80 font-medium">
                                                            <MapPin className="mr-1 h-3 w-3" />
                                                            {user.location}
                                                        </div>
                                                    )}
                                                </div>
                                            </DropdownMenuLabel>
                                            <DropdownMenuSeparator />

                                            <div className="py-1">
                                                <DropdownMenuItem asChild>
                                                    <Link href="/settings" className="cursor-pointer flex items-center py-2">
                                                        <Settings className="mr-3 h-4 w-4 text-muted-foreground" />
                                                        <span>Profile Settings</span>
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem asChild>
                                                    <Link href="/wishlist" className="cursor-pointer flex items-center py-2">
                                                        <Heart className="mr-3 h-4 w-4 text-muted-foreground" />
                                                        <span>My Wishlist</span>
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem asChild>
                                                    <Link href="/orders" className="cursor-pointer flex items-center py-2">
                                                        <Package className="mr-3 h-4 w-4 text-muted-foreground" />
                                                        <span>Order History</span>
                                                    </Link>
                                                </DropdownMenuItem>
                                            </div>

                                            <DropdownMenuSeparator />

                                            {/* Business / Role Specific */}
                                            {user?.role === 'dealer' && (
                                                <div className="py-1">
                                                    <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground px-2 py-1.5 uppercase tracking-wider">
                                                        Business
                                                    </DropdownMenuLabel>
                                                    <DropdownMenuItem asChild>
                                                        <Link href="/dealer/dashboard" className="cursor-pointer flex items-center py-2">
                                                            <LayoutDashboard className="mr-3 h-4 w-4 text-primary" />
                                                            <span className="font-medium">Dealer Dashboard</span>
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem asChild>
                                                        <Link href="/dealer/listings" className="cursor-pointer flex items-center py-2">
                                                            <ListIcon className="mr-3 h-4 w-4 text-muted-foreground" />
                                                            <span>Manage Listings</span>
                                                        </Link>
                                                    </DropdownMenuItem>
                                                </div>
                                            )}

                                            {['ceo', 'cto', 'coo', 'cofounder', 'technical_admin', 'operations_admin', 'marketing_admin'].includes(user?.role || '') && (
                                                <div className="py-1">
                                                    <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground px-2 py-1.5 uppercase tracking-wider">
                                                        Administration
                                                    </DropdownMenuLabel>
                                                    {user?.role === 'ceo' && (
                                                        <DropdownMenuItem asChild>
                                                            <Link href="/ceo" className="cursor-pointer flex items-center py-2 font-bold text-[#d4af37]">
                                                                <Crown className="mr-3 h-4 w-4" />
                                                                Vision Command
                                                            </Link>
                                                        </DropdownMenuItem>
                                                    )}
                                                    <DropdownMenuItem asChild>
                                                        <Link href="/admin" className="cursor-pointer flex items-center py-2 font-bold text-primary">
                                                            <Shield className="mr-3 h-4 w-4" />
                                                            Admin Portal
                                                        </Link>
                                                    </DropdownMenuItem>
                                                </div>
                                            )}

                                            <DropdownMenuSeparator />

                                            <div className="py-1">
                                                <DropdownMenuItem asChild>
                                                    <Link href="/faq" className="cursor-pointer flex items-center py-2">
                                                        <HelpCircle className="mr-3 h-4 w-4 text-muted-foreground" />
                                                        <span>Help & Support</span>
                                                    </Link>
                                                </DropdownMenuItem>

                                                <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer flex items-center py-2 text-destructive focus:bg-destructive/10 focus:text-destructive">
                                                    <LogOut className="mr-3 h-4 w-4" />
                                                    <span>Log out</span>
                                                </DropdownMenuItem>
                                            </div>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            )}

                            {/* Mobile Menu */}
                            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                                <SheetTrigger asChild>
                                    <Button variant="ghost" size="icon" className="lg:hidden">
                                        <Menu className="h-5 w-5" />
                                        <span className="sr-only">Menu</span>
                                    </Button>
                                </SheetTrigger>
                                <SheetContent side="right" className="w-[300px] overflow-y-auto">
                                    <SheetHeader className="border-b pb-4">
                                        <SheetTitle>
                                            <div className="flex items-center gap-2">
                                                <Logo showText={false} />
                                                <span className="font-bold text-xl">MarketBridge</span>
                                            </div>
                                        </SheetTitle>
                                    </SheetHeader>
                                    <div className="flex flex-col gap-6 py-6">
                                        {/* User Profile Section */}
                                        {user ? (
                                            <div className="flex flex-col gap-4 px-2">
                                                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl border border-border/50">
                                                    {user?.photoURL ? (
                                                        <div className="relative h-12 w-12 rounded-full overflow-hidden border-2 border-primary/20">
                                                            <Image src={user.photoURL} alt={user.displayName || 'User'} fill className="object-cover" />
                                                        </div>
                                                    ) : (
                                                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/20">
                                                            <User className="h-6 w-6 text-primary" />
                                                        </div>
                                                    )}
                                                    <div className="flex flex-col">
                                                        <p className="text-sm font-bold truncate max-w-[180px]">{user?.displayName}</p>
                                                        <p className="text-xs text-muted-foreground truncate max-w-[180px]">{user?.email}</p>
                                                        {user?.location && (
                                                            <p className="text-[10px] text-primary font-medium flex items-center mt-0.5">
                                                                <MapPin className="mr-1 h-3 w-3" />
                                                                {user.location}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Personal Quick Links */}
                                                <div className="grid grid-cols-2 gap-2">
                                                    <Link href="/settings" onClick={closeMobileMenu} className="flex flex-col items-center justify-center gap-2 p-3 bg-card border rounded-lg hover:bg-muted transition-colors">
                                                        <Settings className="h-5 w-5 text-muted-foreground" />
                                                        <span className="text-[10px] font-medium uppercase tracking-tighter">Settings</span>
                                                    </Link>
                                                    <Link href="/wishlist" onClick={closeMobileMenu} className="flex flex-col items-center justify-center gap-2 p-3 bg-card border rounded-lg hover:bg-muted transition-colors">
                                                        <Heart className="h-5 w-5 text-muted-foreground" />
                                                        <span className="text-[10px] font-medium uppercase tracking-tighter">Wishlist</span>
                                                    </Link>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col gap-2 px-2">
                                                <Button asChild className="w-full h-12 text-base shadow-lg shadow-primary/20">
                                                    <Link href="/signup" onClick={closeMobileMenu}>Create Account</Link>
                                                </Button>
                                                <Button variant="outline" asChild className="w-full h-12 text-base">
                                                    <Link href="/login" onClick={closeMobileMenu}>Sign In</Link>
                                                </Button>
                                            </div>
                                        )}

                                        {/* Main Navigation */}
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] px-4 mb-2">Marketplace</p>
                                            <nav className="flex flex-col">
                                                <Link href="/" onClick={closeMobileMenu} className="flex items-center gap-4 px-4 py-3 rounded-lg hover:bg-muted transition-colors">
                                                    <Home className="h-5 w-5 text-primary" />
                                                    <span className="font-semibold">Home</span>
                                                </Link>
                                                <Link href="/listings" onClick={closeMobileMenu} className="flex items-center gap-4 px-4 py-3 rounded-lg hover:bg-muted transition-colors">
                                                    <ListIcon className="h-5 w-5" />
                                                    <span>All Listings</span>
                                                </Link>
                                                <Link href="/dealers" onClick={closeMobileMenu} className="flex items-center gap-4 px-4 py-3 rounded-lg hover:bg-muted transition-colors">
                                                    <Users className="h-5 w-5" />
                                                    <span>Find Dealers</span>
                                                </Link>
                                            </nav>
                                        </div>

                                        {/* Account / Business Links */}
                                        {user && (
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] px-4 mb-2">Activities</p>
                                                <nav className="flex flex-col">
                                                    <Link href="/orders" onClick={closeMobileMenu} className="flex items-center gap-4 px-4 py-3 rounded-lg hover:bg-muted transition-colors">
                                                        <Package className="h-5 w-5" />
                                                        <span>Order History</span>
                                                    </Link>
                                                    <Link href="/chats" onClick={closeMobileMenu} className="flex items-center gap-4 px-4 py-3 rounded-lg hover:bg-muted transition-colors">
                                                        <MessageCircle className="h-5 w-5" />
                                                        <span>Messages</span>
                                                    </Link>

                                                    {user?.role === 'dealer' && (
                                                        <>
                                                            <DropdownMenuSeparator className="my-2" />
                                                            <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] px-4 mb-2">Business</p>
                                                            <Link href="/dealer/dashboard" onClick={closeMobileMenu} className="flex items-center gap-4 px-4 py-3 rounded-lg bg-primary/5 hover:bg-primary/10 text-primary transition-colors">
                                                                <LayoutDashboard className="h-5 w-5" />
                                                                <span className="font-bold">Dealer Dashboard</span>
                                                            </Link>
                                                            <Link href="/dealer/listings" onClick={closeMobileMenu} className="flex items-center gap-4 px-4 py-3 rounded-lg hover:bg-muted transition-colors">
                                                                <Package className="h-5 w-5" />
                                                                <span>Manage Listings</span>
                                                            </Link>
                                                        </>
                                                    )}

                                                    {['ceo', 'cto', 'coo', 'cofounder', 'technical_admin', 'operations_admin', 'marketing_admin'].includes(user?.role || '') && (
                                                        <div className="flex flex-col gap-2 mt-2">
                                                            {user?.role === 'ceo' && (
                                                                <Link href="/ceo" onClick={closeMobileMenu} className="flex items-center gap-4 px-4 py-3 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 transition-colors">
                                                                    <Crown className="h-5 w-5" />
                                                                    <span className="font-bold">Vision Command</span>
                                                                </Link>
                                                            )}
                                                            <Link href="/admin" onClick={closeMobileMenu} className="flex items-center gap-4 px-4 py-3 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-500 transition-colors">
                                                                <Shield className="h-5 w-5" />
                                                                <span className="font-bold">Admin Portal</span>
                                                            </Link>
                                                        </div>
                                                    )}
                                                </nav>
                                            </div>
                                        )}

                                        {/* Support & Other */}
                                        <div className="space-y-1 mt-auto pt-4 border-t px-2">
                                            <Link href="/faq" onClick={closeMobileMenu} className="flex items-center gap-4 px-4 py-3 rounded-lg hover:bg-muted transition-colors text-sm text-muted-foreground">
                                                <HelpCircle className="h-4 w-4" />
                                                <span>Help & Support</span>
                                            </Link>
                                            {user && (
                                                <Button
                                                    onClick={() => { handleSignOut(); closeMobileMenu(); }}
                                                    variant="ghost"
                                                    className="w-full justify-start gap-4 px-4 py-6 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                >
                                                    <LogOut className="h-5 w-5" />
                                                    <span className="font-bold">Log out</span>
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </SheetContent>
                            </Sheet>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
};
