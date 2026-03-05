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
    Flag,
    HelpCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

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
    const [isOpen, setIsOpen] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);

    useEffect(() => {
        const hasSeenTour = localStorage.getItem('mb-onboarding-complete');
        if (!hasSeenTour) {
            // Delay slightly for better entrance
            const timer = setTimeout(() => setIsOpen(true), 1500);
            return () => clearTimeout(timer);
        }
    }, []);

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

    if (!isOpen) return null;

    const step = TOUR_STEPS[currentStep];

    return (
        <AnimatePresence>
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

                        <div className="space-y-6">
                            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-2 mx-auto sm:mx-0">
                                {step.icon}
                            </div>

                            <div className="space-y-2 text-center sm:text-left">
                                <h3 className="text-2xl font-black uppercase italic tracking-tighter text-foreground leading-tight">
                                    {step.title}
                                </h3>
                                <p className="text-muted-foreground leading-relaxed italic">
                                    {step.content}
                                </p>
                            </div>

                            <div className="flex items-center justify-between pt-4">
                                <Button
                                    variant="ghost"
                                    onClick={handlePrev}
                                    disabled={currentStep === 0}
                                    className="text-[10px] font-black uppercase tracking-widest opacity-60 hover:opacity-100 disabled:opacity-0"
                                >
                                    <ChevronLeft className="mr-2 h-4 w-4" /> Back
                                </Button>

                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-black tabular-nums opacity-40">
                                        {currentStep + 1} / {TOUR_STEPS.length}
                                    </span>
                                    <Button
                                        onClick={handleNext}
                                        className="h-12 px-8 bg-primary text-primary-foreground font-black uppercase tracking-widest text-xs rounded-xl shadow-xl shadow-primary/20"
                                    >
                                        {currentStep === TOUR_STEPS.length - 1 ? "Begin Mission" : "Next Segment"}
                                        <ChevronRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </Card>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
