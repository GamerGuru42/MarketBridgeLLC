'use client';

import React, { useState, useEffect } from 'react';
import { X, ArrowUpRight, Loader2, CheckCircle2, AlertCircle, Building2, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';

interface BankAccount {
    id: string;
    bank_name: string;
    account_number: string;
    account_name: string;
    is_default: boolean;
}

interface WithdrawModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    balance: number; // in kobo
    bankAccounts: BankAccount[];
}

export function WithdrawModal({ isOpen, onClose, onSuccess, balance, bankAccounts }: WithdrawModalProps) {
    const { user } = useAuth();
    const [amount, setAmount] = useState('');
    const [selectedAccountId, setSelectedAccountId] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [step, setStep] = useState<'form' | 'confirm' | 'success'>('form');
    const [showAccountDropdown, setShowAccountDropdown] = useState(false);

    const balanceNaira = balance / 100;
    const numericAmount = parseInt(amount) || 0;
    const selectedAccount = bankAccounts.find(a => a.id === selectedAccountId);

    useEffect(() => {
        if (isOpen) {
            const defaultAcc = bankAccounts.find(a => a.is_default);
            if (defaultAcc) setSelectedAccountId(defaultAcc.id);
            else if (bankAccounts.length > 0) setSelectedAccountId(bankAccounts[0].id);
        }
    }, [isOpen, bankAccounts]);

    const formatNaira = (value: number) =>
        new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 2 }).format(value);

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value.replace(/[^0-9]/g, '');
        setAmount(raw);
        setError('');
    };

    const handleProceed = () => {
        if (numericAmount < 500) {
            setError('Minimum withdrawal is ₦500');
            return;
        }
        if (numericAmount > balanceNaira) {
            setError('Insufficient balance');
            return;
        }
        if (!selectedAccountId) {
            setError('Please select a bank account');
            return;
        }
        setStep('confirm');
    };

    const handleConfirmWithdraw = async () => {
        setLoading(true);
        setError('');

        try {
            const supabase = createClient();
            const { error: txError } = await supabase
                .from('transactions')
                .insert({
                    user_id: user?.id,
                    wallet_id: user?.id,
                    type: 'withdrawal',
                    amount: numericAmount * 100, // kobo
                    status: 'pending',
                    reference: `WD-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
                    metadata: {
                        bank_account_id: selectedAccountId,
                        bank_name: selectedAccount?.bank_name,
                        account_number: selectedAccount?.account_number,
                        account_name: selectedAccount?.account_name,
                    },
                });

            if (txError) throw txError;

            setStep('success');
            setTimeout(() => {
                onSuccess();
                handleClose();
            }, 3000);
        } catch (err: any) {
            setError(err.message || 'Failed to submit withdrawal request');
            setStep('form');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setAmount('');
        setError('');
        setStep('form');
        setLoading(false);
        setShowAccountDropdown(false);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />

            <div className="relative w-full max-w-md bg-card rounded-2xl shadow-2xl border border-border overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="relative bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-5">
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
                            <ArrowUpRight className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">Withdraw Funds</h2>
                            <p className="text-xs text-white/70">
                                Available: {formatNaira(balanceNaira)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Body */}
                <div className="p-6 space-y-5">
                    {step === 'success' ? (
                        <div className="text-center py-8 space-y-3">
                            <CheckCircle2 className="w-16 h-16 text-blue-500 mx-auto" />
                            <h3 className="text-lg font-semibold text-foreground">Request Submitted!</h3>
                            <p className="text-sm text-muted-foreground">
                                Your withdrawal of {formatNaira(numericAmount)} is being processed.
                                <br />
                                Funds typically arrive within 24 hours.
                            </p>
                        </div>
                    ) : step === 'confirm' ? (
                        <div className="space-y-5">
                            <div className="text-center">
                                <p className="text-sm text-muted-foreground mb-1">You are withdrawing</p>
                                <p className="text-3xl font-bold text-foreground">{formatNaira(numericAmount)}</p>
                            </div>

                            <div className="bg-muted/50 rounded-xl p-4 space-y-3">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">To</span>
                                    <span className="font-medium text-foreground">{selectedAccount?.account_name}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Bank</span>
                                    <span className="font-medium text-foreground">{selectedAccount?.bank_name}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Account</span>
                                    <span className="font-medium text-foreground font-mono">{selectedAccount?.account_number}</span>
                                </div>
                                <hr className="border-border" />
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Processing time</span>
                                    <span className="font-medium text-foreground">Within 24 hours</span>
                                </div>
                            </div>

                            {error && (
                                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20">
                                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                                </div>
                            )}

                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    onClick={() => setStep('form')}
                                    className="flex-1 h-12 rounded-xl"
                                    disabled={loading}
                                >
                                    Back
                                </Button>
                                <Button
                                    id="withdraw-confirm-btn"
                                    onClick={handleConfirmWithdraw}
                                    disabled={loading}
                                    className="flex-1 h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/25"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        'Confirm Withdrawal'
                                    )}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Amount Input */}
                            <div>
                                <label className="text-sm font-medium text-foreground mb-2 block">
                                    Withdrawal Amount
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-semibold text-muted-foreground">
                                        ₦
                                    </span>
                                    <Input
                                        id="withdraw-amount-input"
                                        type="text"
                                        inputMode="numeric"
                                        placeholder="0"
                                        value={numericAmount > 0 ? numericAmount.toLocaleString() : ''}
                                        onChange={handleAmountChange}
                                        className="pl-8 pr-4 h-14 text-2xl font-bold text-foreground border-2 focus:border-blue-500 rounded-xl"
                                        autoFocus
                                    />
                                </div>
                                <div className="flex items-center justify-between mt-1.5">
                                    <p className="text-xs text-muted-foreground">Min: ₦500</p>
                                    <button
                                        onClick={() => setAmount(String(Math.floor(balanceNaira)))}
                                        className="text-xs text-blue-500 hover:text-blue-600 font-medium"
                                    >
                                        Withdraw All
                                    </button>
                                </div>
                            </div>

                            {/* Bank Account Selector */}
                            <div>
                                <label className="text-sm font-medium text-foreground mb-2 block">
                                    Destination Account
                                </label>
                                {bankAccounts.length === 0 ? (
                                    <div className="border-2 border-dashed border-border rounded-xl p-4 text-center">
                                        <Building2 className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                                        <p className="text-sm text-muted-foreground">No bank accounts added</p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Add a bank account below to withdraw funds
                                        </p>
                                    </div>
                                ) : (
                                    <div className="relative">
                                        <button
                                            onClick={() => setShowAccountDropdown(!showAccountDropdown)}
                                            className="w-full flex items-center justify-between p-3 rounded-xl border-2 border-border hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
                                        >
                                            {selectedAccount ? (
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-blue-50 dark:bg-blue-500/10 rounded-lg">
                                                        <Building2 className="w-4 h-4 text-blue-500" />
                                                    </div>
                                                    <div className="text-left">
                                                        <p className="text-sm font-medium text-foreground">
                                                            {selectedAccount.bank_name}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground font-mono">
                                                            {selectedAccount.account_number} — {selectedAccount.account_name}
                                                        </p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-sm text-muted-foreground">Select account</span>
                                            )}
                                            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${showAccountDropdown ? 'rotate-180' : ''}`} />
                                        </button>

                                        {showAccountDropdown && (
                                            <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-lg z-10 overflow-hidden">
                                                {bankAccounts.map((acc) => (
                                                    <button
                                                        key={acc.id}
                                                        onClick={() => {
                                                            setSelectedAccountId(acc.id);
                                                            setShowAccountDropdown(false);
                                                        }}
                                                        className={`w-full flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors ${
                                                            acc.id === selectedAccountId ? 'bg-blue-50 dark:bg-blue-500/10' : ''
                                                        }`}
                                                    >
                                                        <Building2 className="w-4 h-4 text-blue-500" />
                                                        <div className="text-left">
                                                            <p className="text-sm font-medium text-foreground">
                                                                {acc.bank_name}
                                                                {acc.is_default && (
                                                                    <span className="ml-2 text-[10px] bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded-full font-medium">
                                                                        Default
                                                                    </span>
                                                                )}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground font-mono">
                                                                {acc.account_number}
                                                            </p>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Error */}
                            {error && (
                                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20">
                                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                                </div>
                            )}

                            {/* Submit */}
                            <Button
                                id="withdraw-proceed-btn"
                                onClick={handleProceed}
                                disabled={numericAmount < 500 || !selectedAccountId || bankAccounts.length === 0}
                                className="w-full h-12 text-base font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/25 transition-all duration-200 disabled:opacity-50 disabled:shadow-none"
                            >
                                Continue
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
