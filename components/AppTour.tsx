'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
    HelpCircle,
    MapPin,
    Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { usePathname } from 'next/navigation';

interface Step {
    title: string;
    content: string;
    icon: React.ReactNode;
    accent: string;
    tag: string;
}

const TOUR_STEPS: Step[] = [
    {
        title: 'Welcome to MarketBridge',
        content: "You're now connected to Abuja's most trusted campus marketplace. Let's walk you through everything you need to get started.",
        icon: <Sparkles className="h-6 w-6" />,
        accent: 'from-orange-500 to-orange-400',
        tag: 'START',
    },
    {
        title: 'The Marketplace',
        content: "Tap 'Market' in the navigation to browse live listings. Filter by category, campus zone, or price to find exactly what you need.",
        icon: <ShoppingBag className="h-6 w-6" />,
        accent: 'from-blue-500 to-blue-400',
        tag: 'BROWSE',
    },
    {
        title: 'Start Selling',
        content: "Want to earn on campus? Hit 'Sell' to register as a verified dealer. List food, gadgets, fashion, services — anything the campus needs.",
        icon: <PlusCircle className="h-6 w-6" />,
        accent: 'from-orange-500 to-orange-400',
        tag: 'SELL',
    },
    {
        title: 'Track Your Orders',
        content: "Every purchase is protected. Head to 'Orders' to track deliveries in real time. Funds are held in escrow until you confirm receipt.",
        icon: <Compass className="h-6 w-6" />,
        accent: 'from-zinc-500 to-zinc-400',
        tag: 'ORDERS',
    },
    {
        title: 'Chat Directly',
        content: "Use 'Messages' to chat with buyers, sellers, or our support team. Secure, fast, and built for campus deals.",
        icon: <MessageCircle className="h-6 w-6" />,
        accent: 'from-green-500 to-green-400',
        tag: 'MESSAGES',
    },
    {
        title: 'Find Your Campus',
        content: 'MarketBridge is node-based — every campus has its own local feed. Tap the campus pill in the header to switch your active node.',
        icon: <MapPin className="h-6 w-6" />,
        accent: 'from-purple-500 to-purple-400',
        tag: 'CAMPUS',
    },
    {
        title: 'Meet Sage, Your AI',
        content: "Stuck? Tap the ✨ button anytime to ask Sage anything — from how to list a product to finding the best deals near you.",
        icon: <HelpCircle className="h-6 w-6" />,
        accent: 'from-orange-500 to-orange-400',
        tag: 'AI HELP',
    },
];

const TOUR_STORAGE_KEY = 'mb-onboarding-complete';

export function AppTour() {
    const { user } = useAuth();
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [direction, setDirection] = useState<'forward' | 'back'>('forward');

    // Auto-start for new users on main pages
    useEffect(() => {
        if (!user) return;

        const mainNodes = [
            '/',
            '/marketplace',
            '/seller/dashboard',
            '/admin',
            '/admin/operations',
            '/admin/technical',
            '/admin/marketing',
        ];
        if (!pathname || !mainNodes.includes(pathname)) return;

        const hasSeenTour = localStorage.getItem(TOUR_STORAGE_KEY);
        if (!hasSeenTour) {
            const timer = setTimeout(() => setIsOpen(true), 1800);
            return () => clearTimeout(timer);
        }
    }, [user, pathname]);

    // Manual trigger via custom event (e.g. from a Help button)
    useEffect(() => {
        const handleTrigger = () => {
            setCurrentStep(0);
            setDirection('forward');
            setIsOpen(true);
        };
        window.addEventListener('mb-trigger-tour', handleTrigger);
        return () => window.removeEventListener('mb-trigger-tour', handleTrigger);
    }, []);

    const handleNext = useCallback(() => {
        if (currentStep < TOUR_STEPS.length - 1) {
            setDirection('forward');
            setCurrentStep((s) => s + 1);
        } else {
            completeTour();
        }
    }, [currentStep]);

    const handlePrev = useCallback(() => {
        if (currentStep > 0) {
            setDirection('back');
            setCurrentStep((s) => s - 1);
        }
    }, [currentStep]);

    const completeTour = () => {
        setIsOpen(false);
        localStorage.setItem(TOUR_STORAGE_KEY, 'true');
    };

    const goToStep = (index: number) => {
        setDirection(index > currentStep ? 'forward' : 'back');
        setCurrentStep(index);
    };

    const step = TOUR_STEPS[currentStep];
    const isLastStep = currentStep === TOUR_STEPS.length - 1;

    const slideVariants = {
        enter: (dir: string) => ({
            x: dir === 'forward' ? 40 : -40,
            opacity: 0,
        }),
        center: { x: 0, opacity: 1 },
        exit: (dir: string) => ({
            x: dir === 'forward' ? -40 : 40,
            opacity: 0,
        }),
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        key="tour-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm"
                        onClick={completeTour}
                    />

                    {/* Card */}
                    <motion.div
                        key="tour-card"
                        initial={{ opacity: 0, scale: 0.92, y: 24 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.92, y: 24 }}
                        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                        className="fixed inset-0 z-[201] flex items-center justify-center p-4 pointer-events-none"
                    >
                        <div className="relative w-full max-w-sm pointer-events-auto">
                            {/* Glow */}
                            <div className={`absolute -inset-[1px] rounded-[2rem] bg-gradient-to-br ${step.accent} opacity-20 blur-xl`} />

                            {/* Main Panel */}
                            <div className="relative bg-card border border-border rounded-[2rem] overflow-hidden shadow-2xl">

                                {/* Top progress bar */}
                                <div className="flex h-1">
                                    {TOUR_STEPS.map((_, i) => (
                                        <div
                                            key={i}
                                            className={`flex-1 transition-all duration-500 ${i < currentStep
                                                ? 'bg-primary'
                                                : i === currentStep
                                                    ? 'bg-primary/60'
                                                    : 'bg-muted'
                                                }`}
                                        />
                                    ))}
                                </div>

                                {/* Header */}
                                <div className={`bg-gradient-to-br ${step.accent} p-6 pb-8`}>
                                    <div className="flex items-start justify-between">
                                        <span className="text-[9px] font-black text-white/60 uppercase tracking-[0.35em]">
                                            Step {currentStep + 1} of {TOUR_STEPS.length} · {step.tag}
                                        </span>
                                        <button
                                            onClick={completeTour}
                                            className="h-7 w-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors -mt-1 -mr-1"
                                            aria-label="Close tour"
                                        >
                                            <X className="h-3.5 w-3.5 text-white" />
                                        </button>
                                    </div>
                                    <div className="mt-4 h-12 w-12 rounded-2xl bg-white/15 flex items-center justify-center text-white">
                                        {step.icon}
                                    </div>
                                </div>

                                {/* Body — animated per step */}
                                <div className="relative overflow-hidden min-h-[120px]">
                                    <AnimatePresence custom={direction} mode="wait">
                                        <motion.div
                                            key={currentStep}
                                            custom={direction}
                                            variants={slideVariants}
                                            initial="enter"
                                            animate="center"
                                            exit="exit"
                                            transition={{ duration: 0.22, ease: 'easeInOut' }}
                                            className="p-6 space-y-2"
                                        >
                                            <h3 className="text-lg font-black uppercase tracking-tight text-foreground leading-tight">
                                                {step.title}
                                            </h3>
                                            <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                                                {step.content}
                                            </p>
                                        </motion.div>
                                    </AnimatePresence>
                                </div>

                                {/* Dot indicators */}
                                <div className="flex justify-center gap-1.5 px-6 pb-2">
                                    {TOUR_STEPS.map((_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => goToStep(i)}
                                            aria-label={`Go to step ${i + 1}`}
                                            className={`transition-all duration-300 rounded-full ${i === currentStep
                                                ? 'w-5 h-2 bg-primary'
                                                : 'w-2 h-2 bg-muted-foreground/25 hover:bg-muted-foreground/50'
                                                }`}
                                        />
                                    ))}
                                </div>

                                {/* Footer */}
                                <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-border">
                                    <Button
                                        variant="ghost"
                                        onClick={handlePrev}
                                        disabled={currentStep === 0}
                                        className="gap-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground hover:bg-transparent px-0 h-auto disabled:opacity-0 disabled:pointer-events-none"
                                    >
                                        <ChevronLeft className="h-3 w-3" /> Back
                                    </Button>

                                    <Button
                                        onClick={handleNext}
                                        className={`h-11 px-6 font-black uppercase tracking-widest text-[11px] rounded-xl border-none transition-all bg-gradient-to-r ${step.accent} text-white shadow-lg hover:opacity-90 hover:scale-105`}
                                    >
                                        {isLastStep ? (
                                            <>
                                                <Zap className="h-3.5 w-3.5 mr-1.5" />
                                                Start Exploring
                                            </>
                                        ) : (
                                            <>
                                                Next
                                                <ChevronRight className="h-3.5 w-3.5 ml-1" />
                                            </>
                                        )}
                                    </Button>
                                </div>

                                {/* Skip link */}
                                {!isLastStep && (
                                    <button
                                        onClick={completeTour}
                                        className="w-full pb-4 text-center text-[10px] font-bold text-muted-foreground/40 hover:text-muted-foreground transition-colors"
                                    >
                                        Skip tour
                                    </button>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
