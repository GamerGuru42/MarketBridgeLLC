'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    Wallet,
    ArrowDownLeft,
    ArrowUpRight,
    Loader2,
    CheckCircle2,
    AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WalletBalance } from '@/components/wallet/WalletBalance';
import { DepositModal } from '@/components/wallet/DepositModal';
import { WithdrawModal } from '@/components/wallet/WithdrawModal';
import { TransactionHistory } from '@/components/wallet/TransactionHistory';
import { BankAccountManager } from '@/components/wallet/BankAccountManager';

interface WalletData {
    balance: number;
}

interface Transaction {
    id: string;
    type: 'deposit' | 'withdrawal' | 'sale' | 'refund' | 'service_fee' | 'delivery_earning' | 'featured_listing_fee';
    amount: number;
    status: 'pending' | 'success' | 'failed';
    reference: string | null;
    metadata: Record<string, any>;
    created_at: string;
}

interface BankAccount {
    id: string;
    bank_name: string;
    account_number: string;
    account_name: string;
    is_default: boolean;
}

export default function WalletPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const supabase = createClient();

    const [wallet, setWallet] = useState<WalletData | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
    const [loading, setLoading] = useState(true);
    const [showDeposit, setShowDeposit] = useState(false);
    const [showWithdraw, setShowWithdraw] = useState(false);
    const [depositSuccess, setDepositSuccess] = useState(false);

    // Check for deposit callback
    useEffect(() => {
        if (searchParams?.get('deposit') === 'success') {
            setDepositSuccess(true);
            // Clean URL
            const url = new URL(window.location.href);
            url.searchParams.delete('deposit');
            url.searchParams.delete('ref');
            window.history.replaceState({}, '', url.pathname);
            // Auto dismiss after 5s
            setTimeout(() => setDepositSuccess(false), 5000);
        }
    }, [searchParams]);

    const fetchWalletData = useCallback(async () => {
        if (!user?.id) return;

        try {
            // Fetch wallet balance
            const { data: walletData } = await supabase
                .from('wallets')
                .select('balance')
                .eq('user_id', user.id)
                .single();

            setWallet(walletData || { balance: 0 });

            // Fetch transactions
            const { data: txData } = await supabase
                .from('transactions')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(100);

            setTransactions((txData as Transaction[]) || []);

            // Fetch bank accounts
            const { data: bankData } = await supabase
                .from('bank_accounts')
                .select('*')
                .eq('user_id', user.id)
                .order('is_default', { ascending: false });

            setBankAccounts((bankData as BankAccount[]) || []);
        } catch (err) {
            console.error('Failed to fetch wallet data:', err);
        } finally {
            setLoading(false);
        }
    }, [user?.id, supabase]);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login?redirect=/wallet');
            return;
        }
        if (user?.id) {
            fetchWalletData();
        }
    }, [user, authLoading, router, fetchWalletData]);

    // Calculate stats from transactions
    const totalDeposits = transactions
        .filter((t) => t.type === 'deposit' && t.status === 'success')
        .reduce((sum, t) => sum + t.amount, 0);

    const totalWithdrawals = transactions
        .filter((t) => t.type === 'withdrawal' && t.status === 'success')
        .reduce((sum, t) => sum + t.amount, 0);

    const totalSales = transactions
        .filter((t) => t.type === 'sale' && t.status === 'success')
        .reduce((sum, t) => sum + t.amount, 0);

    if (authLoading || (loading && !wallet)) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center space-y-3">
                    <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
                    <p className="text-sm text-muted-foreground">Loading your wallet...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-6 md:py-10 space-y-8">
            {/* Deposit Success Banner */}
            {depositSuccess && (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 animate-in slide-in-from-top duration-300">
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <div className="flex-1">
                        <p className="text-sm font-semibold text-green-700 dark:text-green-400">
                            Deposit Successful!
                        </p>
                        <p className="text-xs text-green-600 dark:text-green-500">
                            Your wallet has been credited. It may take a moment to reflect.
                        </p>
                    </div>
                    <button
                        onClick={() => setDepositSuccess(false)}
                        className="text-green-500 hover:text-green-700"
                    >
                        ✕
                    </button>
                </div>
            )}

            {/* Page Header */}
            <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/10 rounded-xl">
                    <Wallet className="w-5 h-5 text-primary" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-foreground">My Wallet</h1>
                    <p className="text-sm text-muted-foreground">Manage your funds, deposits, and withdrawals</p>
                </div>
            </div>

            {/* Balance Card */}
            <WalletBalance
                balance={wallet?.balance || 0}
                totalDeposits={totalDeposits}
                totalWithdrawals={totalWithdrawals}
                totalSales={totalSales}
                loading={loading}
            />

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
                <Button
                    id="wallet-add-money-btn"
                    onClick={() => setShowDeposit(true)}
                    className="h-14 rounded-xl gap-2 text-base font-semibold bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/20 transition-all duration-200"
                >
                    <ArrowDownLeft className="w-5 h-5" />
                    Add Money
                </Button>
                <Button
                    id="wallet-withdraw-btn"
                    onClick={() => setShowWithdraw(true)}
                    variant="outline"
                    className="h-14 rounded-xl gap-2 text-base font-semibold border-2 hover:bg-muted/50 transition-all duration-200"
                >
                    <ArrowUpRight className="w-5 h-5" />
                    Withdraw
                </Button>
            </div>

            {/* Pending Withdrawals Notice */}
            {transactions.some((t) => t.type === 'withdrawal' && t.status === 'pending') && (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
                    <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                    <div>
                        <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                            Pending Withdrawal
                        </p>
                        <p className="text-xs text-amber-600 dark:text-amber-500">
                            You have a withdrawal request being processed. Funds typically arrive within 24 hours.
                        </p>
                    </div>
                </div>
            )}

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Transaction History — 2/3 width */}
                <div className="lg:col-span-2">
                    <TransactionHistory transactions={transactions} loading={loading} />
                </div>

                {/* Bank Accounts — 1/3 width */}
                <div className="lg:col-span-1">
                    <BankAccountManager accounts={bankAccounts} onRefresh={fetchWalletData} />
                </div>
            </div>

            {/* Modals */}
            <DepositModal
                isOpen={showDeposit}
                onClose={() => setShowDeposit(false)}
                onSuccess={() => {
                    fetchWalletData();
                    setDepositSuccess(true);
                }}
            />
            <WithdrawModal
                isOpen={showWithdraw}
                onClose={() => setShowWithdraw(false)}
                onSuccess={fetchWalletData}
                balance={wallet?.balance || 0}
                bankAccounts={bankAccounts}
            />
        </div>
    );
}
