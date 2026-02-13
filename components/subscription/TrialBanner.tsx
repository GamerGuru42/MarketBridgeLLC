'use client';

import React, { useEffect, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Clock, Zap, X } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { getCurrentSubscription, getTrialCountdownMessage, checkAndHandleExpiredTrial } from '@/lib/subscription/utils';

export function TrialBanner() {
    const { user } = useAuth();
    const [trialInfo, setTrialInfo] = useState<{
        isTrialing: boolean;
        daysRemaining: number | null;
        message: string;
        urgency: 'low' | 'medium' | 'high';
        color: string;
    } | null>(null);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        if (!user) return;

        const fetchTrialInfo = async () => {
            // Check if trial expired and needs downgrade first
            await checkAndHandleExpiredTrial(user.id);

            const { isTrialing, trialDaysRemaining } = await getCurrentSubscription(user.id);

            if (isTrialing && trialDaysRemaining !== null) {
                const countdown = getTrialCountdownMessage(trialDaysRemaining);
                setTrialInfo({
                    isTrialing,
                    daysRemaining: trialDaysRemaining,
                    ...countdown,
                });
            }
        };

        fetchTrialInfo();
    }, [user]);

    if (!trialInfo || !trialInfo.isTrialing || dismissed) {
        return null;
    }

    const getBgColor = () => {
        switch (trialInfo.urgency) {
            case 'high':
                return 'bg-red-500/10 border-red-500/30';
            case 'medium':
                return 'bg-orange-500/10 border-orange-500/30';
            default:
                return 'bg-[#FFB800]/10 border-[#FFB800]/30';
        }
    };

    const getTextColor = () => {
        switch (trialInfo.urgency) {
            case 'high':
                return 'text-red-400';
            case 'medium':
                return 'text-orange-400';
            default:
                return 'text-[#FFB800]';
        }
    };

    return (
        <Alert className={`${getBgColor()} border relative mb-6 rounded-2xl`}>
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1">
                    <Clock className={`h-5 w-5 ${getTextColor()}`} />
                    <AlertDescription className="text-white font-medium">
                        {trialInfo.message}
                    </AlertDescription>
                </div>

                <div className="flex items-center gap-3">
                    {trialInfo.urgency === 'high' && (
                        <Button
                            asChild
                            size="sm"
                            className="bg-[#FFB800] text-black hover:bg-[#FFD700] font-black uppercase tracking-widest text-[10px]"
                        >
                            <Link href="/pricing">
                                <Zap className="h-4 w-4 mr-2" />
                                Upgrade Now
                            </Link>
                        </Button>
                    )}

                    {trialInfo.urgency !== 'high' && (
                        <Button
                            asChild
                            variant="ghost"
                            size="sm"
                            className="text-zinc-400 hover:text-white text-[10px] font-black uppercase tracking-widest"
                        >
                            <Link href="/pricing">View Plans</Link>
                        </Button>
                    )}

                    <button
                        onClick={() => setDismissed(true)}
                        className="text-zinc-500 hover:text-white transition-colors"
                        aria-label="Dismiss"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </Alert>
    );
}
