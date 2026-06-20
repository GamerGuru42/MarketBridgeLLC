'use client';

import React, { useState } from 'react';
import { Eye, EyeOff, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

interface WalletBalanceProps {
    balance: number; // in kobo
    totalDeposits: number;
    totalWithdrawals: number;
    totalSales: number;
    loading?: boolean;
}

export function WalletBalance({ balance, totalDeposits, totalWithdrawals, totalSales, loading }: WalletBalanceProps) {
    const [showBalance, setShowBalance] = useState(true);

    const formatNaira = (kobo: number) => {
        const naira = kobo / 100;
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
            minimumFractionDigits: 2,
        }).format(naira);
    };

    if (loading) {
        return (
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500 via-orange-600 to-amber-600 p-6 md:p-8 animate-pulse">
                <div className="h-8 w-32 bg-white/20 rounded mb-4" />
                <div className="h-12 w-56 bg-white/20 rounded mb-6" />
                <div className="flex gap-4">
                    <div className="h-16 flex-1 bg-white/10 rounded-xl" />
                    <div className="h-16 flex-1 bg-white/10 rounded-xl" />
                    <div className="h-16 flex-1 bg-white/10 rounded-xl" />
                </div>
            </div>
        );
    }

    return (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500 via-orange-600 to-amber-600 p-6 md:p-8 shadow-2xl">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
            <div className="absolute top-1/2 right-1/4 w-32 h-32 bg-white/3 rounded-full" />

            <div className="relative z-10">
                {/* Header */}
                <div className="flex items-center justify-between mb-2">
                    <p className="text-white/80 text-sm font-medium tracking-wide uppercase">Available Balance</p>
                    <button
                        onClick={() => setShowBalance(!showBalance)}
                        className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-200 text-white/90 hover:text-white"
                        aria-label={showBalance ? 'Hide balance' : 'Show balance'}
                        id="wallet-toggle-balance"
                    >
                        {showBalance ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                </div>

                {/* Balance */}
                <div className="mb-6">
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white tracking-tight transition-all duration-300">
                        {showBalance ? formatNaira(balance) : '₦ •••••••'}
                    </h1>
                </div>

                {/* Quick stats */}
                <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10">
                        <div className="flex items-center gap-1.5 mb-1">
                            <ArrowDownLeft className="w-3.5 h-3.5 text-green-300" />
                            <span className="text-[11px] text-white/70 font-medium">Deposits</span>
                        </div>
                        <p className="text-sm font-semibold text-white">
                            {showBalance ? formatNaira(totalDeposits) : '•••'}
                        </p>
                    </div>

                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10">
                        <div className="flex items-center gap-1.5 mb-1">
                            <TrendingUp className="w-3.5 h-3.5 text-blue-300" />
                            <span className="text-[11px] text-white/70 font-medium">Sales</span>
                        </div>
                        <p className="text-sm font-semibold text-white">
                            {showBalance ? formatNaira(totalSales) : '•••'}
                        </p>
                    </div>

                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10">
                        <div className="flex items-center gap-1.5 mb-1">
                            <ArrowUpRight className="w-3.5 h-3.5 text-red-300" />
                            <span className="text-[11px] text-white/70 font-medium">Withdrawn</span>
                        </div>
                        <p className="text-sm font-semibold text-white">
                            {showBalance ? formatNaira(totalWithdrawals) : '•••'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
