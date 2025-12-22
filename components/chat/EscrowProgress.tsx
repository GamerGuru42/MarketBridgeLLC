'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Circle, Clock, AlertTriangle, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface EscrowStep {
    id: string;
    step_order: number;
    description: string;
    status: 'pending' | 'completed';
    buyer_confirmed_at: string | null;
    seller_confirmed_at: string | null;
}

interface EscrowAgreement {
    id: string;
    amount: number;
    status: string;
    current_step_index: number;
    buyer_id: string;
    seller_id: string;
}

interface EscrowProgressProps {
    agreement: EscrowAgreement;
    steps: EscrowStep[];
    onUpdate: () => void;
}

export function EscrowProgress({ agreement, steps, onUpdate }: EscrowProgressProps) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);

    const currentStep = steps.find(s => s.step_order === agreement.current_step_index);
    const isBuyer = user?.id === agreement.buyer_id;
    const isSeller = user?.id === agreement.seller_id;
    const isParticipant = isBuyer || isSeller;

    const handleConfirmStep = async () => {
        if (!currentStep || !user) return;

        setLoading(true);
        try {
            const updateData: any = {};
            if (isBuyer) updateData.buyer_confirmed_at = new Date().toISOString();
            if (isSeller) updateData.seller_confirmed_at = new Date().toISOString();

            // 1. Update the step confirmation
            const { error: stepError } = await supabase
                .from('escrow_steps')
                .update(updateData)
                .eq('id', currentStep.id);

            if (stepError) throw stepError;

            // 2. Check if both confirmed
            // We need to fetch the fresh step data to check the OTHER person's confirmation
            // But since we just updated ours, we can check if the OTHER field was already set in the prop
            // OR we can just check if both are set now.
            // A safer way is to rely on the backend trigger or check explicitly.
            // For now, let's check client-side logic + optimistic update.

            const otherConfirmed = isBuyer ? currentStep.seller_confirmed_at : currentStep.buyer_confirmed_at;

            if (otherConfirmed) {
                // Both have confirmed!
                // 1. Mark step as completed
                await supabase
                    .from('escrow_steps')
                    .update({ status: 'completed' })
                    .eq('id', currentStep.id);

                // 2. Advance agreement step index
                const nextIndex = agreement.current_step_index + 1;
                const isLastStep = nextIndex >= steps.length;

                await supabase
                    .from('escrow_agreements')
                    .update({
                        current_step_index: nextIndex,
                        status: isLastStep ? 'completed' : 'active'
                    })
                    .eq('id', agreement.id);
            }

            onUpdate();
        } catch (error) {
            console.error('Error confirming step:', error);
        } finally {
            setLoading(false);
        }
    };

    const hasUserConfirmed = isBuyer ? !!currentStep?.buyer_confirmed_at : !!currentStep?.seller_confirmed_at;

    return (
        <Card className="mb-4 border-primary/20 bg-primary/5">
            <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <Badge variant="outline" className="bg-background">
                            Smart Escrow
                        </Badge>
                        <span className="text-primary">₦{agreement.amount.toLocaleString()}</span>
                    </CardTitle>
                    <Badge variant={agreement.status === 'completed' ? 'success' : 'secondary'}>
                        {agreement.status.toUpperCase()}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {/* Progress Bar */}
                    <div className="relative pt-1">
                        <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-primary/20">
                            <div
                                style={{ width: `${(agreement.current_step_index / steps.length) * 100}%` }}
                                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary transition-all duration-500"
                            ></div>
                        </div>
                    </div>

                    {/* Steps List */}
                    <div className="space-y-3">
                        {steps.map((step, index) => {
                            const isCompleted = index < agreement.current_step_index;
                            const isCurrent = index === agreement.current_step_index;
                            const isPending = index > agreement.current_step_index;

                            return (
                                <div
                                    key={step.id}
                                    className={`flex items-start gap-3 p-2 rounded-lg transition-colors ${isCurrent ? 'bg-background shadow-sm border border-primary/20' : 'opacity-70'
                                        }`}
                                >
                                    <div className="mt-0.5">
                                        {isCompleted ? (
                                            <CheckCircle className="h-5 w-5 text-green-500" />
                                        ) : isCurrent ? (
                                            <Loader2 className="h-5 w-5 text-primary animate-spin" />
                                        ) : (
                                            <Circle className="h-5 w-5 text-muted-foreground" />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <p className={`text-sm font-medium ${isCurrent ? 'text-foreground' : 'text-muted-foreground'}`}>
                                            {step.description}
                                        </p>
                                        {isCurrent && (
                                            <div className="mt-2 flex gap-2 text-xs text-muted-foreground">
                                                <span className={`flex items-center gap-1 ${step.buyer_confirmed_at ? 'text-green-600' : ''}`}>
                                                    {step.buyer_confirmed_at ? <CheckCircle className="h-3 w-3" /> : <Circle className="h-3 w-3" />} Buyer
                                                </span>
                                                <span className={`flex items-center gap-1 ${step.seller_confirmed_at ? 'text-green-600' : ''}`}>
                                                    {step.seller_confirmed_at ? <CheckCircle className="h-3 w-3" /> : <Circle className="h-3 w-3" />} Seller
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    {isCurrent && isParticipant && !hasUserConfirmed && (
                                        <Button
                                            size="sm"
                                            onClick={handleConfirmStep}
                                            disabled={loading}
                                            className="ml-auto shrink-0"
                                        >
                                            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Confirm'}
                                        </Button>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {agreement.status === 'completed' && (
                        <div className="bg-green-500/10 text-green-700 p-3 rounded-lg flex items-center gap-2 text-sm font-medium">
                            <CheckCircle className="h-4 w-4" />
                            Escrow completed successfully! Funds released.
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
