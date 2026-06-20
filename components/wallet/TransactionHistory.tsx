'use client';

import React, { useState } from 'react';
import {
    ArrowDownLeft,
    ArrowUpRight,
    ShoppingBag,
    RotateCcw,
    Sparkles,
    Clock,
    CheckCircle2,
    XCircle,
    Filter,
    Search,
    Receipt,
} from 'lucide-react';

interface Transaction {
    id: string;
    type: 'deposit' | 'withdrawal' | 'sale' | 'refund' | 'service_fee' | 'delivery_earning' | 'featured_listing_fee';
    amount: number; // kobo
    status: 'pending' | 'success' | 'failed';
    reference: string | null;
    metadata: Record<string, any>;
    created_at: string;
}

interface TransactionHistoryProps {
    transactions: Transaction[];
    loading?: boolean;
}

type FilterType = 'all' | 'deposit' | 'withdrawal' | 'sale' | 'refund';

const FILTERS: { key: FilterType; label: string; icon: React.ElementType }[] = [
    { key: 'all', label: 'All', icon: Receipt },
    { key: 'deposit', label: 'Deposits', icon: ArrowDownLeft },
    { key: 'sale', label: 'Sales', icon: ShoppingBag },
    { key: 'withdrawal', label: 'Withdrawals', icon: ArrowUpRight },
    { key: 'refund', label: 'Refunds', icon: RotateCcw },
];

const TYPE_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string; sign: '+' | '-' }> = {
    deposit: { label: 'Deposit', icon: ArrowDownLeft, color: 'text-green-500', sign: '+' },
    withdrawal: { label: 'Withdrawal', icon: ArrowUpRight, color: 'text-red-500', sign: '-' },
    sale: { label: 'Sale', icon: ShoppingBag, color: 'text-blue-500', sign: '+' },
    refund: { label: 'Refund', icon: RotateCcw, color: 'text-amber-500', sign: '+' },
    service_fee: { label: 'Service Fee', icon: Sparkles, color: 'text-purple-500', sign: '-' },
    delivery_earning: { label: 'Delivery', icon: ShoppingBag, color: 'text-teal-500', sign: '+' },
    featured_listing_fee: { label: 'Boost Fee', icon: Sparkles, color: 'text-orange-500', sign: '-' },
};

const STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType; className: string }> = {
    pending: { label: 'Pending', icon: Clock, className: 'text-amber-500 bg-amber-50 dark:bg-amber-500/10' },
    success: { label: 'Completed', icon: CheckCircle2, className: 'text-green-500 bg-green-50 dark:bg-green-500/10' },
    failed: { label: 'Failed', icon: XCircle, className: 'text-red-500 bg-red-50 dark:bg-red-500/10' },
};

export function TransactionHistory({ transactions, loading }: TransactionHistoryProps) {
    const [filter, setFilter] = useState<FilterType>('all');
    const [searchQuery, setSearchQuery] = useState('');

    const formatNaira = (kobo: number) =>
        new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 2 }).format(kobo / 100);

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;

        return date.toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
    };

    const filteredTransactions = transactions
        .filter((t) => filter === 'all' || t.type === filter)
        .filter((t) => {
            if (!searchQuery) return true;
            const q = searchQuery.toLowerCase();
            return (
                t.reference?.toLowerCase().includes(q) ||
                t.type.toLowerCase().includes(q) ||
                formatNaira(t.amount).toLowerCase().includes(q)
            );
        })
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Group transactions by date
    const groupedTransactions: Record<string, Transaction[]> = {};
    filteredTransactions.forEach((t) => {
        const date = new Date(t.created_at);
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        let key: string;
        if (date.toDateString() === today.toDateString()) key = 'Today';
        else if (date.toDateString() === yesterday.toDateString()) key = 'Yesterday';
        else key = date.toLocaleDateString('en-NG', { weekday: 'long', month: 'short', day: 'numeric' });

        if (!groupedTransactions[key]) groupedTransactions[key] = [];
        groupedTransactions[key].push(t);
    });

    if (loading) {
        return (
            <div className="space-y-4">
                <div className="h-10 bg-muted rounded-xl animate-pulse" />
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-4">
                        <div className="w-10 h-10 bg-muted rounded-xl animate-pulse" />
                        <div className="flex-1 space-y-2">
                            <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                            <div className="h-3 w-16 bg-muted rounded animate-pulse" />
                        </div>
                        <div className="h-4 w-20 bg-muted rounded animate-pulse" />
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-foreground">Transaction History</h2>
                <span className="text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
                    {filteredTransactions.length} {filteredTransactions.length === 1 ? 'transaction' : 'transactions'}
                </span>
            </div>

            {/* Filters */}
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
                {FILTERS.map(({ key, label, icon: Icon }) => (
                    <button
                        key={key}
                        onClick={() => setFilter(key)}
                        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150 border ${
                            filter === key
                                ? 'border-primary bg-primary/10 text-primary'
                                : 'border-border text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                        }`}
                    >
                        <Icon className="w-3.5 h-3.5" />
                        {label}
                    </button>
                ))}
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                    type="text"
                    placeholder="Search by reference or type..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    id="transaction-search"
                />
            </div>

            {/* Transaction List */}
            {filteredTransactions.length === 0 ? (
                <div className="text-center py-12">
                    <Receipt className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-sm font-medium text-muted-foreground">No transactions found</p>
                    <p className="text-xs text-muted-foreground/70 mt-1">
                        {filter !== 'all' ? 'Try a different filter' : 'Your transaction history will appear here'}
                    </p>
                </div>
            ) : (
                <div className="space-y-5">
                    {Object.entries(groupedTransactions).map(([dateGroup, txns]) => (
                        <div key={dateGroup}>
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 pl-1">
                                {dateGroup}
                            </p>
                            <div className="bg-card rounded-xl border border-border overflow-hidden divide-y divide-border">
                                {txns.map((tx) => {
                                    const config = TYPE_CONFIG[tx.type] || TYPE_CONFIG.deposit;
                                    const statusConfig = STATUS_CONFIG[tx.status];
                                    const Icon = config.icon;
                                    const StatusIcon = statusConfig.icon;

                                    return (
                                        <div
                                            key={tx.id}
                                            className="flex items-center gap-3 px-4 py-3.5 hover:bg-muted/30 transition-colors"
                                        >
                                            {/* Icon */}
                                            <div className={`p-2.5 rounded-xl bg-muted/50 ${config.color}`}>
                                                <Icon className="w-4 h-4" />
                                            </div>

                                            {/* Details */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <p className="text-sm font-semibold text-foreground">{config.label}</p>
                                                    <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${statusConfig.className}`}>
                                                        <StatusIcon className="w-2.5 h-2.5" />
                                                        {statusConfig.label}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                                    {tx.reference || 'No reference'} · {formatDate(tx.created_at)}
                                                </p>
                                            </div>

                                            {/* Amount */}
                                            <p className={`text-sm font-bold whitespace-nowrap ${
                                                config.sign === '+' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                                            }`}>
                                                {config.sign}{formatNaira(tx.amount)}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
