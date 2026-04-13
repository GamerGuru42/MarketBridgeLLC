'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { X, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TourStep {
    targetId: string;
    title: string;
    description: string;
    position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

interface GuidedTourProps {
    steps: TourStep[];
    tourKey: string;
    onComplete?: () => void;
}

export function GuidedTour({ steps, tourKey, onComplete }: GuidedTourProps) {
    const [currentStep, setCurrentStep] = useState(-1);
    const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);
    const [tooltipStyles, setTooltipStyles] = useState<React.CSSProperties>({});
    const [isVisible, setIsVisible] = useState(false);
    
    // Check if tour should start
    useEffect(() => {
        const hasSeen = localStorage.getItem(`has_seen_tour_${tourKey}`);
        
        // Listen for a global event to trigger the tour manually
        const handleManualTrigger = () => {
             setCurrentStep(0);
             setIsVisible(true);
        };
        
        window.addEventListener(`trigger_tour_${tourKey}`, handleManualTrigger);

        if (!hasSeen) {
            const timer = setTimeout(() => {
                setCurrentStep(0);
                setIsVisible(true);
            }, 2000); // 2 second delay for page load
            return () => {
                clearTimeout(timer);
                window.removeEventListener(`trigger_tour_${tourKey}`, handleManualTrigger);
            };
        }
        
        return () => window.removeEventListener(`trigger_tour_${tourKey}`, handleManualTrigger);
    }, [tourKey]);

    // Update highlight when step changes
    useEffect(() => {
        if (currentStep >= 0 && currentStep < steps.length) {
            const updatePosition = () => {
                const step = steps[currentStep];
                const element = document.getElementById(step.targetId);
                
                if (element) {
                    const rect = element.getBoundingClientRect();
                    setHighlightRect(rect);
                    
                    // Small delay to ensure browser has calculated layout
                    requestAnimationFrame(() => {
                        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        
                        // Recalculate after scroll
                        const updatedRect = element.getBoundingClientRect();
                        setHighlightRect(updatedRect);
                        calculateTooltipPosition(updatedRect, step.position || 'bottom');
                    });
                } else {
                    // If element not found, skip to next or finish
                    console.warn(`Tour target #${step.targetId} not found`);
                    if (currentStep < steps.length - 1) {
                        setCurrentStep(prev => prev + 1);
                    } else {
                        handleFinish();
                    }
                }
            };
            
            updatePosition();
            window.addEventListener('resize', updatePosition);
            return () => window.removeEventListener('resize', updatePosition);
        }
    }, [currentStep, steps]);

    const calculateTooltipPosition = (rect: DOMRect, preferredPos: string) => {
        const padding = 20;
        const styles: React.CSSProperties = {
            position: 'fixed',
            zIndex: 1001,
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
        };

        switch (preferredPos) {
            case 'bottom':
                styles.top = rect.bottom + padding;
                styles.left = rect.left + (rect.width / 2);
                styles.transform = 'translateX(-50%)';
                break;
            case 'top':
                styles.bottom = (window.innerHeight - rect.top) + padding;
                styles.left = rect.left + (rect.width / 2);
                styles.transform = 'translateX(-50%)';
                break;
            case 'right':
                styles.left = rect.right + padding;
                styles.top = rect.top + (rect.height / 2);
                styles.transform = 'translateY(-50%)';
                break;
            case 'left':
                styles.right = (window.innerWidth - rect.left) + padding;
                styles.top = rect.top + (rect.height / 2);
                styles.transform = 'translateY(-50%)';
                break;
            case 'center':
                styles.top = '50%';
                styles.left = '50%';
                styles.transform = 'translate(-50%, -50%)';
                break;
        }

        setTooltipStyles(styles);
    };

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            handleFinish();
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const handleFinish = () => {
        setIsVisible(false);
        setCurrentStep(-1);
        localStorage.setItem(`has_seen_tour_${tourKey}`, 'true');
        if (onComplete) onComplete();
    };

    if (!isVisible || currentStep === -1 || !highlightRect) return null;

    return (
        <div className="fixed inset-0 z-[1000] pointer-events-none">
            {/* Spotlight Overlay using SVG Mask */}
            <svg className="absolute inset-0 w-full h-full pointer-events-auto" style={{ filter: 'drop-shadow(0 0 20px rgba(0,0,0,0.5))' }}>
                <defs>
                    <mask id="spotlight-mask">
                        <rect x="0" y="0" width="100%" height="100%" fill="white" />
                        <rect 
                            x={highlightRect.left - 8} 
                            y={highlightRect.top - 8} 
                            width={highlightRect.width + 16} 
                            height={highlightRect.height + 16} 
                            rx="12" 
                            fill="black" 
                            className="transition-all duration-500 ease-in-out"
                        />
                    </mask>
                </defs>
                <rect 
                    x="0" 
                    y="0" 
                    width="100%" 
                    height="100%" 
                    fill="rgba(0,0,0,0.75)" 
                    mask="url(#spotlight-mask)" 
                    className="backdrop-blur-[2px] transition-all duration-300"
                />
            </svg>

            {/* Clickable area for the highlighted element (to allow interaction if needed, though we block it for tour purity) */}
            <div 
                className="absolute pointer-events-none rounded-xl ring-2 ring-[#FF6200] ring-offset-4 ring-offset-transparent transition-all duration-500 animate-pulse"
                style={{
                    left: highlightRect.left - 8,
                    top: highlightRect.top - 8,
                    width: highlightRect.width + 16,
                    height: highlightRect.height + 16
                }}
            />

            {/* Floating Tooltip */}
            <div 
                style={tooltipStyles}
                className="pointer-events-auto w-[320px] bg-zinc-950 border border-white/10 shadow-2xl rounded-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-500"
            >
                <div className="bg-[#FF6200] h-1.5 w-full">
                   <div 
                      className="h-full bg-white/40 transition-all duration-500" 
                      style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                    />
                </div>

                <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                         <div className="flex items-center gap-2">
                             <Sparkles className="h-3.5 w-3.5 text-[#FF6200]" />
                             <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#FF6200]">Step {currentStep + 1} of {steps.length}</span>
                         </div>
                         <button onClick={handleFinish} className="text-white/20 hover:text-white transition-colors">
                             <X className="h-4 w-4" />
                         </button>
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-lg font-black uppercase tracking-tighter italic text-white flex items-center gap-2">
                            {steps[currentStep].title}
                        </h3>
                        <p className="text-xs font-medium text-white/50 leading-relaxed italic">
                            {steps[currentStep].description}
                        </p>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                         <Button 
                            variant="ghost" 
                            size="sm" 
                            disabled={currentStep === 0}
                            onClick={handleBack}
                            className="text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white hover:bg-white/5 h-8 px-3 rounded-lg disabled:opacity-0 transition-all"
                         >
                            <ChevronLeft className="h-3 w-3 mr-1" /> Back
                         </Button>

                         <Button 
                            size="sm" 
                            onClick={handleNext}
                            className="bg-[#FF6200] text-black hover:bg-[#FF7A29] font-black uppercase tracking-widest text-[10px] h-9 px-5 rounded-xl shadow-lg shadow-[#FF6200]/20 transition-all active:scale-95"
                         >
                            {currentStep === steps.length - 1 ? 'Finish' : 'Next'} <ChevronRight className="ml-1 h-3.5 w-3.5 italic" />
                         </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
