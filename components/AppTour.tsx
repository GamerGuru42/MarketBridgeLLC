'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    ChevronRight,
    ChevronLeft,
    ShoppingBag,
    PlusCircle,
    Compass,
    MessageCircle,
    Zap,
    HelpCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { usePathname } from 'next/navigation';

interface Step {
    title: string;
    content: string;
    target?: string; // CSS selector if we want to point to something (optional for this simple version)
    icon: React.ReactNode;
}

const TOUR_STEPS: Step[] = [
    {
        title: "Welcome to MarketBridge",
        content: "You've just unlocked Abuja's most trusted campus network. Let's show you how to dominate the marketplace.",
        icon: <Zap className="h-6 w-6 text-primary" />
    },
    {
        title: "The Marketplace",
        content: "Tap 'Market' to scan for live assets. Filter by campus node or category to find exactly what you need in seconds.",
        icon: <ShoppingBag className="h-6 w-6 text-blue-500" />
    },
    {
        title: "Provision Your Hustle",
        content: "Ready to earn? Use 'Sell' to onboard as a verified dealer. List food, gadgets, or services and start taking orders.",
        icon: <PlusCircle className="h-6 w-6 text-primary" />
    },
    {
        title: "Secure Operations",
        content: "Track your packets in 'Orders'. Our Paystack Escrow protocol ensures your funds are safe until you confirm delivery.",
        icon: <Compass className="h-6 w-6 text-zinc-500" />
    },
    {
        title: "Secure Signals",
        content: "Use 'Chats' for direct, encrypted communication with buyers, sellers, or our executive staff.",
        icon: <MessageCircle className="h-6 w-6 text-green-500" />
    },
    {
        title: "Need Help?",
        content: "I'm Sage, your AI Assistant. If you're ever lost, just ask me anything—from app guides to general campus vibes.",
        icon: <HelpCircle className="h-6 w-6 text-primary" />
    }
];

export function AppTour() {
    const { user } = useAuth();
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);

    // Auto-start logic for new users on main nodes
    useEffect(() => {
        if (!user) return;

        const mainNodes = ['/', '/marketplace', '/seller/dashboard', '/admin', '/admin/operations', '/admin/technical', '/admin/marketing'];
        if (!pathname || !mainNodes.includes(pathname)) return;

        const hasSeenTour = localStorage.getItem('mb-onboarding-complete');
        if (!hasSeenTour) {
            const timer = setTimeout(() => setIsOpen(true), 2000);
            return () => clearTimeout(timer);
        }
    }, [user, pathname]);

    useEffect(() => {
        const handleTrigger = () => {
            setCurrentStep(0);
            setIsOpen(true);
        };
        window.addEventListener('mb-trigger-tour', handleTrigger);
        return () => window.removeEventListener('mb-trigger-tour', handleTrigger);
    }, []);

    const handleNext = () => {
        if (currentStep < TOUR_STEPS.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            completeTour();
        }
    };

    const handlePrev = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const completeTour = () => {
        setIsOpen(false);
        localStorage.setItem('mb-onboarding-complete', 'true');
    };

    const step = TOUR_STEPS[currentStep];

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-md"
                    >
                        <Card className="p-8 border-primary/20 shadow-2xl bg-card overflow-hidden">
                            {/* Progress Bar */}
                            <div className="absolute top-0 left-0 right-0 h-1 flex">
                                {TOUR_STEPS.map((_, i) => (
                                    <div
                                        key={i}
                                        className={`flex-1 transition-colors duration-500 ${i <= currentStep ? 'bg-primary' : 'bg-muted'}`}
                                    />
                                ))}
                            </div>

                            <button
                                onClick={completeTour}
                                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>

                            <div className="space-y-6 text-foreground">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                                        {step.icon}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-xl font-black uppercase tracking-tighter italic">{step.title}</h3>
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Protocol Sync: {currentStep + 1}/{TOUR_STEPS.length}</p>
                                    </div>
                                </div>

                                <p className="text-sm font-medium leading-relaxed italic opacity-80">
                                    {step.content}
                                </p>

                                <div className="flex items-center justify-between pt-4">
                                    <Button
                                        variant="ghost"
                                        onClick={handlePrev}
                                        disabled={currentStep === 0}
                                        className="text-muted-foreground hover:text-foreground hover:bg-transparent p-0 text-[10px] font-black uppercase tracking-widest disabled:opacity-0"
                                    >
                                        <ChevronLeft className="mr-1 h-3 w-3" /> Back
                                    </Button>

                                    <Button
                                        onClick={handleNext}
                                        className="h-12 px-8 bg-primary text-primary-foreground font-black uppercase tracking-widest text-xs rounded-xl shadow-xl shadow-primary/20"
                                    >
                                        {currentStep === TOUR_STEPS.length - 1 ? "Begin Mission" : "Next Segment"}
                                        <ChevronRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
