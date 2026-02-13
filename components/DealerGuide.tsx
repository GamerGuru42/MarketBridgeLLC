'use client';

import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ChevronRight, X, BookOpen, ShieldCheck, Box } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const GUIDE_STEPS = [
    {
        title: "Welcome to MarketBridge",
        description: "You've joined Nigeria's first trustless marketplace. As a verified dealer, you are the backbone of this ecosystem.",
        icon: ShieldCheck
    },
    {
        title: "Create Your First Listing",
        description: "Navigate to 'Deploy Asset' to list your vehicles. High-quality images and accurate descriptions are mandatory for the protocol.",
        icon: Box
    },
    {
        title: "Handle Orders",
        description: "When a customer places an order, funds are locked in Escrow. You will be notified to prepare for delivery.",
        icon: CheckCircle2
    },
    {
        title: "Get Paid",
        description: "Once the customer verifies the asset, funds are instantly released to your wallet. No delays.",
        icon: BookOpen
    }
];

export function DealerGuide() {
    const [open, setOpen] = useState(false);
    const [step, setStep] = useState(0);

    useEffect(() => {
        const hasSeenGuide = localStorage.getItem('marketbridge_dealer_guide_seen');
        if (!hasSeenGuide) {
            setOpen(true);
        }
    }, []);

    const handleNext = () => {
        if (step < GUIDE_STEPS.length - 1) {
            setStep(step + 1);
        } else {
            handleClose();
        }
    };

    const handleClose = () => {
        localStorage.setItem('marketbridge_dealer_guide_seen', 'true');
        setOpen(false);
    };

    const CurrentIcon = GUIDE_STEPS[step].icon;

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="bg-black border border-white/10 sm:max-w-[500px] p-0 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-white/10">
                    <div
                        className="h-full bg-[#FF6600] transition-all duration-300"
                        style={{ width: `${((step + 1) / GUIDE_STEPS.length) * 100}%` }}
                    />
                </div>

                <div className="p-8 pt-10 text-center">
                    <div className="mx-auto w-16 h-16 rounded-full bg-[#FF6600]/10 flex items-center justify-center mb-6">
                        <CurrentIcon className="h-8 w-8 text-[#FF6600]" />
                    </div>

                    <DialogTitle className="text-2xl font-black text-white uppercase tracking-tighter mb-2">
                        {GUIDE_STEPS[step].title}
                    </DialogTitle>

                    <DialogDescription className="text-zinc-400 text-base">
                        {GUIDE_STEPS[step].description}
                    </DialogDescription>
                </div>

                <div className="bg-zinc-900/50 p-6 flex justify-between items-center border-t border-white/5">
                    <Button
                        variant="ghost"
                        onClick={handleClose}
                        className="text-zinc-500 hover:text-white"
                    >
                        Skip Protocol
                    </Button>
                    <Button
                        onClick={handleNext}
                        className="bg-[#FF6600] text-black font-bold hover:bg-[#FF6600]"
                    >
                        {step === GUIDE_STEPS.length - 1 ? "Initialize" : "Next Step"} <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
