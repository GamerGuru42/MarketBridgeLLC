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
import { ShoppingCart, Menu, User, LogOut, LayoutDashboard, Package, Home, ListIcon, Users, DollarSign, Info, Phone, MessageCircle } from 'lucide-react';
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
                                <div className="hidden lg:flex items-center gap-2">
                                    <Button variant="ghost" size="sm" asChild>
                                        <Link href="/login">Login</Link>
                                    </Button>
                                    <Button size="sm" asChild>
                                        <Link href="/signup">Sign Up</Link>
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
                                        <DropdownMenuContent align="end" className="w-56">
                                            <DropdownMenuLabel>
                                                <div className="flex flex-col space-y-1">
                                                    <p className="text-sm font-medium leading-none">{user?.displayName}</p>
                                                    <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                                                </div>
                                            </DropdownMenuLabel>
                                            <DropdownMenuSeparator />
                                            {user?.role === 'dealer' && (
                                                <>
                                                    <DropdownMenuItem asChild>
                                                        <Link href="/dealer/dashboard" className="cursor-pointer">
                                                            <LayoutDashboard className="mr-2 h-4 w-4" />
                                                            Dashboard
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem asChild>
                                                        <Link href="/dealer/listings" className="cursor-pointer">
                                                            <Package className="mr-2 h-4 w-4" />
                                                            My Listings
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                </>
                                            )}
                                            {['technical_admin', 'operations_admin', 'marketing_admin'].includes(user?.role || '') && (
                                                <>
                                                    <DropdownMenuItem asChild>
                                                        <Link href="/admin" className="cursor-pointer font-bold text-primary">
                                                            <LayoutDashboard className="mr-2 h-4 w-4" />
                                                            Admin Portal
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    {user?.role === 'technical_admin' && (
                                                        <DropdownMenuItem asChild>
                                                            <Link href="/admin/technical" className="cursor-pointer pl-6 italic text-xs">
                                                                Technical Command
                                                            </Link>
                                                        </DropdownMenuItem>
                                                    )}
                                                    {user?.role === 'operations_admin' && (
                                                        <DropdownMenuItem asChild>
                                                            <Link href="/admin/operations" className="cursor-pointer pl-6 italic text-xs">
                                                                Operations Hub
                                                            </Link>
                                                        </DropdownMenuItem>
                                                    )}
                                                    {user?.role === 'marketing_admin' && (
                                                        <DropdownMenuItem asChild>
                                                            <Link href="/admin/marketing" className="cursor-pointer pl-6 italic text-xs">
                                                                Growth Dashboard
                                                            </Link>
                                                        </DropdownMenuItem>
                                                    )}
                                                    <DropdownMenuSeparator />
                                                </>
                                            )}
                                            {user?.role === 'ceo' && (
                                                <>
                                                    <DropdownMenuItem asChild>
                                                        <Link href="/ceo" className="cursor-pointer">
                                                            <LayoutDashboard className="mr-2 h-4 w-4" />
                                                            CEO Dashboard
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                </>
                                            )}
                                            {user?.role === 'cto' && (
                                                <>
                                                    <DropdownMenuItem asChild>
                                                        <Link href="/cto" className="cursor-pointer">
                                                            <LayoutDashboard className="mr-2 h-4 w-4" />
                                                            CTO Hub
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                </>
                                            )}
                                            {user?.role === 'coo' && (
                                                <>
                                                    <DropdownMenuItem asChild>
                                                        <Link href="/coo" className="cursor-pointer">
                                                            <LayoutDashboard className="mr-2 h-4 w-4" />
                                                            Operations Command
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                </>
                                            )}
                                            {user?.role === 'cofounder' && (
                                                <>
                                                    <DropdownMenuItem asChild>
                                                        <Link href="/cofounder" className="cursor-pointer">
                                                            <LayoutDashboard className="mr-2 h-4 w-4" />
                                                            Co-Founder Dashboard
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                </>
                                            )}
                                            {user?.role === 'customer' && (
                                                <>
                                                    <DropdownMenuItem asChild>
                                                        <Link href="/orders" className="cursor-pointer">
                                                            <Package className="mr-2 h-4 w-4" />
                                                            My Orders
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                </>
                                            )}
                                            <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive">
                                                <LogOut className="mr-2 h-4 w-4" />
                                                Log out
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            )}
                        </>
                    )}

                    {/* Mobile Menu */}
                    <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="lg:hidden">
                                <Menu className="h-5 w-5" />
                                <span className="sr-only">Menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                            <SheetHeader>
                                <SheetTitle>
                                    <div className="flex items-center gap-2">
                                        <Logo showText={false} />
                                        <span className="font-bold text-xl">MarketBridge</span>
                                    </div>
                                </SheetTitle>
                            </SheetHeader>
                            <div className="flex flex-col gap-4 mt-8">
                                {/* User Info */}
                                {user && (
                                    <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                                        {user?.photoURL ? (
                                            <Image src={user.photoURL} alt={user.displayName || 'User'} width={40} height={40} className="h-10 w-10 rounded-full" />
                                        ) : (
                                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                <User className="h-5 w-5 text-primary" />
                                            </div>
                                        )}
                                        <div className="flex flex-col">
                                            <p className="text-sm font-medium">{user?.displayName}</p>
                                            <p className="text-xs text-muted-foreground">{user?.email}</p>
                                        </div>
                                    </div>
                                )}

                                {/* Navigation Links */}
                                <nav className="flex flex-col gap-2">
                                    <Link href="/" onClick={closeMobileMenu} className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors">
                                        <Home className="h-5 w-5" />
                                        <span className="font-medium">Home</span>
                                    </Link>
                                    <Link href="/listings" onClick={closeMobileMenu} className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors">
                                        <ListIcon className="h-5 w-5" />
                                        <span className="font-medium">Listings</span>
                                    </Link>
                                    {user && (
                                        <Link href="/chats" onClick={closeMobileMenu} className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors">
                                            <MessageCircle className="h-5 w-5" />
                                            <span className="font-medium">Messages</span>
                                        </Link>
                                    )}
                                    <Link href="/dealers" onClick={closeMobileMenu} className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors">
                                        <Users className="h-5 w-5" />
                                        <span className="font-medium">Find Dealers</span>
                                    </Link>
                                    <Link href="/pricing" onClick={closeMobileMenu} className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors">
                                        <DollarSign className="h-5 w-5" />
                                        <span className="font-medium">Pricing</span>
                                    </Link>
                                    <Link href="/about" onClick={closeMobileMenu} className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors">
                                        <Info className="h-5 w-5" />
                                        <span className="font-medium">About</span>
                                    </Link>
                                    <Link href="/contact" onClick={closeMobileMenu} className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors">
                                        <Phone className="h-5 w-5" />
                                        <span className="font-medium">Contact</span>
                                    </Link>
                                </nav>

                                {/* User-specific Links */}
                                {user && (
                                    <>
                                        <div className="border-t pt-4">
                                            {user?.role === 'dealer' && (
                                                <>
                                                    <Link href="/dealer/dashboard" onClick={closeMobileMenu} className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors">
                                                        <LayoutDashboard className="h-5 w-5" />
                                                        <span className="font-medium">Dashboard</span>
                                                    </Link>
                                                    <Link href="/dealer/listings" onClick={closeMobileMenu} className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors">
                                                        <Package className="h-5 w-5" />
                                                        <span className="font-medium">My Listings</span>
                                                    </Link>
                                                </>
                                            )}
                                            {user?.role === 'customer' && (
                                                <Link href="/orders" onClick={closeMobileMenu} className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors">
                                                    <Package className="h-5 w-5" />
                                                    <span className="font-medium">My Orders</span>
                                                </Link>
                                            )}
                                        </div>
                                        <Button onClick={() => { handleSignOut(); closeMobileMenu(); }} variant="destructive" className="w-full mt-4">
                                            <LogOut className="mr-2 h-4 w-4" />
                                            Log out
                                        </Button>
                                    </>
                                )}

                                {/* Auth Buttons for non-logged in users */}
                                {!user && (
                                    <div className="flex flex-col gap-2 mt-4">
                                        <Button asChild className="w-full">
                                            <Link href="/signup" onClick={closeMobileMenu}>Sign Up</Link>
                                        </Button>
                                        <Button variant="outline" asChild className="w-full">
                                            <Link href="/login" onClick={closeMobileMenu}>Login</Link>
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
        </header>
    );
};
