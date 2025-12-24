'use client';

import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronRight, Check } from 'lucide-react';

interface TourStep {
    title: string;
    description: string;
    icon?: React.ReactNode;
}

interface TourGuideProps {
    pageKey: string;
    steps: TourStep[];
    title: string;
}

export function TourGuide({ pageKey, steps, title }: TourGuideProps) {
    const [open, setOpen] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);

    useEffect(() => {
        const hasSeenTour = localStorage.getItem(`tour_seen_${pageKey}`);
        if (!hasSeenTour) {
            // Small delay for better UX
            const timer = setTimeout(() => setOpen(true), 1000);
            return () => clearTimeout(timer);
        }
    }, [pageKey]);

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            handleClose();
        }
    };

    const handleClose = () => {
        setOpen(false);
        localStorage.setItem(`tour_seen_${pageKey}`, 'true');
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-md bg-slate-900 text-white border-slate-700">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                            {title}
                        </DialogTitle>
                        <span className="text-xs text-slate-400 font-mono">
                            STEP {currentStep + 1}/{steps.length}
                        </span>
                    </div>
                    <DialogDescription className="text-slate-400">
                        Interactive Orientation Protocol
                    </DialogDescription>
                </DialogHeader>

                <div className="py-6 min-h-[150px]">
                    <div className="flex flex-col gap-4">
                        {steps[currentStep].icon && (
                            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-2">
                                {steps[currentStep].icon}
                            </div>
                        )}
                        <h3 className="text-lg font-bold text-primary">
                            {steps[currentStep].title}
                        </h3>
                        <p className="text-sm text-slate-300 leading-relaxed">
                            {steps[currentStep].description}
                        </p>
                    </div>
                </div>

                <DialogFooter className="flex-row justify-between sm:justify-between">
                    <Button variant="ghost" className="text-slate-500 hover:text-white" onClick={handleClose}>
                        Skip Briefing
                    </Button>
                    <Button onClick={handleNext} className="bg-primary hover:bg-primary/90 text-white">
                        {currentStep === steps.length - 1 ? (
                            <>
                                <Check className="mr-2 h-4 w-4" /> Initialize
                            </>
                        ) : (
                            <>
                                Next <ChevronRight className="ml-2 h-4 w-4" />
                            </>
                        )}
                    </Button>
                </DialogFooter>

                {/* Progress Bar */}
                <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-800">
                    <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}
