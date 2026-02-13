'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Clock, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export type EscrowStep = {
    id: string;
    step_order: number;
    description: string;
    status: 'pending' | 'completed' | 'disputed';
    completed_at?: string;
};

export type EscrowAgreement = {
    id: string;
    amount: number;
    status: 'pending' | 'active' | 'completed' | 'disputed' | 'cancelled';
    buyer_id: string;
    seller_id: string;
    tos_accepted_buyer: boolean;
    tos_accepted_seller: boolean;
};

interface EscrowProgressProps {
    agreement: EscrowAgreement;
    steps: EscrowStep[];
    onUpdate: () => void; // Callback to refresh data after action
}

export function EscrowProgress({ agreement, steps, onUpdate }: EscrowProgressProps) {
    if (!agreement) return null;

    const currentStepIndex = steps.findIndex(s => s.status === 'pending');
    const isComplete = currentStepIndex === -1 && steps.every(s => s.status === 'completed');

    // Status visual
    const statusColor = {
        pending: 'text-zinc-500 bg-zinc-500/10 border-zinc-500/20',
        active: 'text-[#FFB800] bg-[#FFB800]/10 border-[#FFB800]/20',
        completed: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
        disputed: 'text-red-500 bg-red-500/10 border-red-500/20',
        cancelled: 'text-zinc-500 bg-zinc-500/10 border-zinc-500/20',
    }[agreement.status] || 'text-zinc-500';

    return (
        <Card className="bg-black/40 border-white/10 mb-4 overflow-hidden">
            <CardHeader className="py-3 px-4 flex flex-row items-center justify-between border-b border-white/5 bg-white/5">
                <div className="flex items-center gap-2">
                    <div className={cn("h-2 w-2 rounded-full animate-pulse",
                        agreement.status === 'active' ? "bg-[#FFB800]" : "bg-zinc-500"
                    )} />
                    <span className="font-mono text-[10px] uppercase tracking-widest text-[#FFB800]">
                        SECURE TRANSACTION #{agreement.id.slice(0, 8)}
                    </span>
                </div>
                <div className={cn("px-2 py-0.5 rounded text-[10px] uppercase font-black tracking-wider border", statusColor)}>
                    {agreement.status}
                </div>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
                <div className="flex justify-between items-end border-b border-white/5 pb-4">
                    <div>
                        <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Amount Held</p>
                        <p className="text-2xl font-black text-white">
                            ₦{agreement.amount.toLocaleString()}
                        </p>
                    </div>
                    {/* Action Buttons could go here */}
                </div>

                <div className="relative pl-2 space-y-6">
                    {/* Vertical Line */}
                    <div className="absolute left-[11px] top-2 bottom-2 w-[2px] bg-white/10" />

                    {steps.map((step, index) => {
                        const isDone = step.status === 'completed';
                        const isCurrent = step.status === 'pending' && (index === 0 || steps[index - 1].status === 'completed');

                        return (
                            <div key={step.id} className="relative flex gap-4 items-start">
                                <div className={cn(
                                    "z-10 h-6 w-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors bg-black",
                                    isDone ? "border-emerald-500 text-emerald-500" :
                                        isCurrent ? "border-[#FFB800] text-[#FFB800]" : "border-zinc-700 text-zinc-700"
                                )}>
                                    {isDone ? <Check className="h-3 w-3" /> :
                                        isCurrent ? <Clock className="h-3 w-3 animate-pulse" /> :
                                            <span className="h-1.5 w-1.5 rounded-full bg-zinc-700" />}
                                </div>
                                <div className="flex-1 pt-0.5">
                                    <p className={cn(
                                        "text-xs font-bold uppercase tracking-wide",
                                        isDone ? "text-emerald-500 line-through opacity-70" :
                                            isCurrent ? "text-white" : "text-zinc-600"
                                    )}>
                                        {step.description}
                                    </p>
                                    {isCurrent && (
                                        <p className="text-[10px] text-[#FFB800] mt-1 animate-pulse">
                                            Awaiting Action...
                                        </p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
