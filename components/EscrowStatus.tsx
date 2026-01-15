'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Shield, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface EscrowStatusProps {
    status: 'held' | 'released' | 'refunded' | 'disputed';
    autoReleaseDate?: string;
    className?: string;
}

export function EscrowStatus({ status, autoReleaseDate, className = '' }: EscrowStatusProps) {
    const getStatusConfig = () => {
        switch (status) {
            case 'held':
                return {
                    icon: Shield,
                    label: 'Funds Held',
                    variant: 'default' as const,
                    color: 'text-blue-600',
                    bgColor: 'bg-blue-50',
                    borderColor: 'border-blue-200',
                };
            case 'released':
                return {
                    icon: CheckCircle,
                    label: 'Funds Released',
                    variant: 'default' as const,
                    color: 'text-green-600',
                    bgColor: 'bg-green-50',
                    borderColor: 'border-green-200',
                };
            case 'refunded':
                return {
                    icon: XCircle,
                    label: 'Refunded',
                    variant: 'destructive' as const,
                    color: 'text-red-600',
                    bgColor: 'bg-red-50',
                    borderColor: 'border-red-200',
                };
            case 'disputed':
                return {
                    icon: AlertTriangle,
                    label: 'Under Dispute',
                    variant: 'secondary' as const,
                    color: 'text-yellow-600',
                    bgColor: 'bg-yellow-50',
                    borderColor: 'border-yellow-200',
                };
            default:
                return {
                    icon: Shield,
                    label: 'Unknown',
                    variant: 'outline' as const,
                    color: 'text-gray-600',
                    bgColor: 'bg-gray-50',
                    borderColor: 'border-gray-200',
                };
        }
    };

    const config = getStatusConfig();
    const Icon = config.icon;

    const getDaysUntilRelease = () => {
        if (!autoReleaseDate || status !== 'held') return null;

        const now = new Date();
        const releaseDate = new Date(autoReleaseDate);
        const daysLeft = Math.ceil((releaseDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        return daysLeft > 0 ? daysLeft : 0;
    };

    const daysLeft = getDaysUntilRelease();

    return (
        <div className={`${config.bgColor} border ${config.borderColor} rounded-lg p-3 ${className}`}>
            <div className="flex items-start gap-2">
                <Icon className={`h-5 w-5 ${config.color} flex-shrink-0 mt-0.5`} />
                <div className="flex-1">
                    <div className="flex items-center justify-between">
                        <span className={`font-semibold ${config.color}`}>{config.label}</span>
                        <Badge variant={config.variant} className="ml-2">
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                        </Badge>
                    </div>

                    {status === 'held' && daysLeft !== null && (
                        <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Clock className="h-3.5 w-3.5" />
                            {daysLeft > 0 ? (
                                <span>Auto-release in {daysLeft} day{daysLeft !== 1 ? 's' : ''}</span>
                            ) : (
                                <span>Pending release</span>
                            )}
                        </div>
                    )}

                    {status === 'released' && (
                        <p className="text-xs text-green-700 mt-1">
                            Payment has been transferred to the seller
                        </p>
                    )}

                    {status === 'refunded' && (
                        <p className="text-xs text-red-700 mt-1">
                            Your payment has been refunded to your account
                        </p>
                    )}

                    {status === 'disputed' && (
                        <p className="text-xs text-yellow-700 mt-1">
                            Admin is reviewing your dispute. You'll be notified of the decision.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
