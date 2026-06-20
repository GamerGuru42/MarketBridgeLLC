'use client';

import React, { useState } from 'react';
import { X, Wallet, Shield, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';

interface DepositModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const QUICK_AMOUNTS = [1000, 2000, 5000, 10000, 20000, 50000];

export function DepositModal({ isOpen, onClose, onSuccess }: DepositModalProps) {
    const { user, sessionUser } = useAuth();
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const formatNaira = (value: number) =>
        new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(value);

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value.replace(/[^0-9]/g, '');
        setAmount(raw);
        setError('');
    };

    const selectQuickAmount = (val: number) => {
        setAmount(String(val));
        setError('');
    };

    const numericAmount = parseInt(amount) || 0;

    const handleDeposit = async () => {
        if (numericAmount < 100) {
            setError('Minimum deposit is ₦100');
            return;
        }
        if (numericAmount > 1000000) {
            setError('Maximum single deposit is ₦1,000,000');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const email = sessionUser?.email || user?.email;
            if (!email) {
                setError('No email found. Please log in again.');
                setLoading(false);
                return;
            }

            const res = await fetch('/api/wallet/deposit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: numericAmount * 100, // convert to kobo
                    email,
                    userId: user?.id,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to initialize payment');
            }

            // Redirect to Paystack checkout
            if (data.authorization_url) {
                window.location.href = data.authorization_url;
            } else {
                setSuccess(true);
                setTimeout(() => {
                    onSuccess();
                    handleClose();
                }, 2000);
            }
        } catch (err: any) {
            setError(err.message || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setAmount('');
        setError('');
        setSuccess(false);
        setLoading(false);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />

            {/* Modal */}
            <div className="relative w-full max-w-md bg-card rounded-2xl shadow-2xl border border-border overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="relative bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-5">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                    <button
                        onClick={handleClose}
                        className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white"
                        aria-label="Close"
                    >
                        <X className="w-4 h-4" />
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-white/15 rounded-xl">
                            <Wallet className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">Add Money</h2>
                            <p className="text-xs text-white/70">Fund your MarketBridge wallet</p>
                        </div>
                    </div>
                </div>

                {/* Body */}
                <div className="p-6 space-y-5">
                    {success ? (
                        <div className="text-center py-8 space-y-3">
                            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
                            <h3 className="text-lg font-semibold text-foreground">Payment Initiated!</h3>
                            <p className="text-sm text-muted-foreground">Redirecting to payment gateway...</p>
                        </div>
                    ) : (
                        <>
                            {/* Amount Input */}
                            <div>
                                <label className="text-sm font-medium text-foreground mb-2 block">
                                    Enter Amount
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-semibold text-muted-foreground">
                                        ₦
                                    </span>
                                    <Input
                                        id="deposit-amount-input"
                                        type="text"
                                        inputMode="numeric"
                                        placeholder="0"
                                        value={numericAmount > 0 ? numericAmount.toLocaleString() : ''}
                                        onChange={handleAmountChange}
                                        className="pl-8 pr-4 h-14 text-2xl font-bold text-foreground border-2 focus:border-green-500 rounded-xl"
                                        autoFocus
                                    />
                                </div>
                                {numericAmount > 0 && (
                                    <p className="text-xs text-muted-foreground mt-1.5">
                                        {formatNaira(numericAmount)} will be added to your wallet
                                    </p>
                                )}
                            </div>

                            {/* Quick Amount Buttons */}
                            <div>
                                <label className="text-xs font-medium text-muted-foreground mb-2 block uppercase tracking-wide">
                                    Quick Select
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    {QUICK_AMOUNTS.map((val) => (
                                        <button
                                            key={val}
                                            onClick={() => selectQuickAmount(val)}
                                            className={`py-2.5 px-3 rounded-xl text-sm font-semibold border-2 transition-all duration-150 ${
                                                numericAmount === val
                                                    ? 'border-green-500 bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400'
                                                    : 'border-border hover:border-green-300 dark:hover:border-green-700 text-foreground hover:bg-muted/50'
                                            }`}
                                        >
                                            {formatNaira(val)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Error */}
                            {error && (
                                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20">
                                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                                </div>
                            )}

                            {/* Security Badge */}
                            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50">
                                <Shield className="w-3.5 h-3.5 text-green-500" />
                                <p className="text-[11px] text-muted-foreground">
                                    Secured by Paystack. Your card details are never stored.
                                </p>
                            </div>

                            {/* Submit */}
                            <Button
                                id="deposit-submit-btn"
                                onClick={handleDeposit}
                                disabled={loading || numericAmount < 100}
                                className="w-full h-12 text-base font-semibold rounded-xl bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/25 transition-all duration-200 disabled:opacity-50 disabled:shadow-none"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>Pay {numericAmount >= 100 ? formatNaira(numericAmount) : 'Now'}</>
                                )}
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
