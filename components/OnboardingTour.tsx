'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { X, Sparkles, MapPin, ShieldCheck, Send, ShoppingBag, LayoutDashboard, Activity, Terminal, Shield } from 'lucide-react';

// Define the steps
type TourStep = {
    title: string;
    description: string;
    icon: any;
};

const BUYER_STEPS: TourStep[] = [
    { title: "WELCOME TO MARKETBRIDGE", description: "You're now connected to Abuja's most trusted campus marketplace. Let's walk you through everything you need to get started.", icon: Sparkles },
    { title: "FIND ANYTHING", description: "Search for textbooks, gadgets, and food delivery tailored specifically for your campus zone.", icon: MapPin },
    { title: "SECURE ESCROW", description: "All payments are held in escrow. The seller doesn't get paid until you confirm you've received what you ordered.", icon: ShieldCheck },
    { title: "CHAT DIRECTLY", description: "Message verified sellers instantly, negotiate prices, and coordinate seamless campus deliveries.", icon: Send }
];

const SELLER_STEPS: TourStep[] = [
    { title: "WELCOME TO YOUR DASHBOARD", description: "This is your command center. From here you can manage all your products, track orders, and monitor your campus sales.", icon: LayoutDashboard },
    { title: "ADD LISTINGS", description: "Upload crisp images of your items, set fair prices, and watch the buyers flow in.", icon: ShoppingBag },
    { title: "SECURE PAYOUTS", description: "Withdraw your earnings straight to your bank account after successful deliveries. Simple and secure.", icon: ShieldCheck }
];

const ADMIN_STEPS: TourStep[] = [
    { title: "MISSION CONTROL", description: "Welcome to Executive Command. You have full oversight of the MarketBridge matrix.", icon: Shield },
    { title: "LIVE INTEL RELAY", description: "Monitor real-time system events, user registrations, and potential anomalies through the secure terminal.", icon: Terminal },
    { title: "OPERATIONS & MODERATION", description: "Manage regional saturation, resolve disputes, and maintain the integrity of the ecosystem.", icon: Activity }
];

export function OnboardingTour() {
    const { user, loading } = useAuth();
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [steps, setSteps] = useState<TourStep[]>([]);
    const [tourType, setTourType] = useState<string | null>(null);

    useEffect(() => {
        if (loading || !user) return;

        // Determine which tour to show based on Role and Path
        let type = null;
        let selectedSteps = BUYER_STEPS;

        if (pathname.startsWith('/admin') && (user.role === 'ceo' || user.role === 'admin' || user.role === 'cofounder')) {
            type = 'admin';
            selectedSteps = ADMIN_STEPS;
        } else if (pathname.startsWith('/seller')) {
            type = 'seller';
            selectedSteps = SELLER_STEPS;
        } else if (pathname.startsWith('/marketplace') || pathname === '/') {
            type = 'buyer';
            selectedSteps = BUYER_STEPS;
        }

        if (!type) return;

        // Check LocalStorage to see if they've already completed this specific tour
        const storageKey = `marketbridge_tour_${user.id}_${type}`;
        const hasSeen = localStorage.getItem(storageKey);

        if (!hasSeen) {
            setTourType(storageKey);
            setSteps(selectedSteps);
            setIsOpen(true);
        }
    }, [pathname, user, loading]);

    if (!isOpen || steps.length === 0) return null;

    const Icon = steps[currentStep].icon;

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            handleComplete();
        }
    };

    const handleComplete = () => {
        if (tourType) {
            localStorage.setItem(tourType, 'true');
        }
        setIsOpen(false);
    };

    const handleSkip = () => {
        handleComplete();
    };

    return (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="w-full max-w-[400px] border border-white/10 bg-zinc-950 p-0 shadow-2xl rounded-3xl overflow-hidden animate-in zoom-in-95 duration-300">
                
                {/* Visual Header (Orange Box) */}
                <div className="bg-[#FF6200] p-6 relative h-40">
                    <button 
                        onClick={handleSkip} 
                        className="absolute top-4 right-4 h-8 w-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors text-white"
                        title="Close Tour"
                    >
                        <X className="h-4 w-4" />
                    </button>
                    
                    <p className="text-[9px] font-black tracking-[0.3em] text-white/90 uppercase mt-2 mb-6">
                        STEP {currentStep + 1} OF {steps.length} {currentStep === 0 ? '- START' : ''}
                    </p>

                    <div className="h-14 w-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
                        <Icon className="h-7 w-7 text-white" />
                    </div>
                </div>

                {/* Content Body (Dark Box) */}
                <div className="bg-zinc-950 p-8 flex flex-col items-center text-center">
                    <h2 className="text-xl font-black text-white uppercase tracking-tight italic mb-3 w-full text-left">
                        {steps[currentStep].title}
                    </h2>
                    
                    <p className="text-sm font-medium leading-relaxed text-zinc-400 mb-8 w-full text-left min-h-[60px]">
                        {steps[currentStep].description}
                    </p>

                    {/* Footer Controls */}
                    <div className="flex items-center justify-between w-full mt-auto">
                        <div className="flex gap-1.5">
                            {steps.map((_, idx) => (
                                <div 
                                    key={idx} 
                                    className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentStep ? 'w-6 bg-[#FF6200]' : 'w-1.5 bg-zinc-800'}`} 
                                />
                            ))}
                        </div>

                        <Button 
                            onClick={handleNext}
                            className="bg-[#FF6200] hover:bg-[#FF6200]/90 text-white font-black uppercase text-xs tracking-widest px-6 h-10 rounded-xl shadow-lg transition-transform active:scale-95 border-none"
                        >
                            {currentStep < steps.length - 1 ? 'NEXT' : 'FINISH'} 
                            {currentStep < steps.length - 1 && <span className="ml-2 font-black">&gt;</span>}
                        </Button>
                    </div>
                    
                    <button 
                        onClick={handleSkip} 
                        className="text-[10px] text-zinc-500 hover:text-white uppercase tracking-widest font-black mt-6 transition-colors"
                    >
                        Skip tour
                    </button>
                </div>
            </div>
        </div>
    );
}
