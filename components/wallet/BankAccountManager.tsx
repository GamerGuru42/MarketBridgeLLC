'use client';

import React, { useState } from 'react';
import { Building2, Plus, Trash2, Star, Loader2, AlertCircle, CheckCircle2, X } from 'lucide-react';
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

interface BankAccountManagerProps {
    accounts: BankAccount[];
    onRefresh: () => void;
}

const NIGERIAN_BANKS = [
    'Access Bank', 'Citibank Nigeria', 'Ecobank Nigeria', 'Fidelity Bank',
    'First Bank of Nigeria', 'First City Monument Bank', 'Globus Bank',
    'Guaranty Trust Bank', 'Heritage Bank', 'Jaiz Bank', 'Keystone Bank',
    'Kuda Bank', 'Opay', 'Palmpay', 'Parallex Bank', 'Polaris Bank',
    'Providus Bank', 'Stanbic IBTC Bank', 'Standard Chartered Bank',
    'Sterling Bank', 'SunTrust Bank', 'TAJBank', 'Titan Trust Bank',
    'Union Bank of Nigeria', 'United Bank for Africa', 'Unity Bank',
    'VFD Microfinance Bank', 'Wema Bank', 'Zenith Bank', 'Moniepoint',
];

export function BankAccountManager({ accounts, onRefresh }: BankAccountManagerProps) {
    const { user } = useAuth();
    const [showAddForm, setShowAddForm] = useState(false);
    const [bankName, setBankName] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [accountName, setAccountName] = useState('');
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [bankSearch, setBankSearch] = useState('');
    const [showBankList, setShowBankList] = useState(false);

    const filteredBanks = NIGERIAN_BANKS.filter((b) =>
        b.toLowerCase().includes(bankSearch.toLowerCase())
    );

    const handleAddAccount = async () => {
        if (!bankName.trim()) { setError('Select a bank'); return; }
        if (accountNumber.length !== 10) { setError('Account number must be 10 digits'); return; }
        if (!accountName.trim()) { setError('Enter account name'); return; }

        setSaving(true);
        setError('');

        try {
            const supabase = createClient();
            const isFirst = accounts.length === 0;

            const { error: insertError } = await supabase.from('bank_accounts').insert({
                user_id: user?.id,
                bank_name: bankName,
                account_number: accountNumber,
                account_name: accountName,
                is_default: isFirst,
            });

            if (insertError) throw insertError;

            setBankName('');
            setAccountNumber('');
            setAccountName('');
            setBankSearch('');
            setShowAddForm(false);
            onRefresh();
        } catch (err: any) {
            setError(err.message || 'Failed to add account');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        setDeleting(id);
        try {
            const supabase = createClient();
            const { error } = await supabase.from('bank_accounts').delete().eq('id', id);
            if (error) throw error;
            onRefresh();
        } catch (err: any) {
            setError(err.message || 'Failed to remove account');
        } finally {
            setDeleting(null);
        }
    };

    const handleSetDefault = async (id: string) => {
        try {
            const supabase = createClient();
            // First unset all defaults
            await supabase
                .from('bank_accounts')
                .update({ is_default: false })
                .eq('user_id', user?.id);
            // Then set the new default
            await supabase
                .from('bank_accounts')
                .update({ is_default: true })
                .eq('id', id);
            onRefresh();
        } catch (err: any) {
            setError(err.message || 'Failed to set default');
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-foreground">Bank Accounts</h2>
                {!showAddForm && (
                    <Button
                        id="add-bank-account-btn"
                        onClick={() => setShowAddForm(true)}
                        variant="outline"
                        size="sm"
                        className="gap-1.5 rounded-xl text-xs"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        Add Account
                    </Button>
                )}
            </div>

            {/* Account List */}
            {accounts.length === 0 && !showAddForm ? (
                <div className="border-2 border-dashed border-border rounded-xl p-8 text-center">
                    <Building2 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-sm font-medium text-muted-foreground">No bank accounts yet</p>
                    <p className="text-xs text-muted-foreground/70 mt-1 mb-4">
                        Add a bank account to enable withdrawals
                    </p>
                    <Button
                        onClick={() => setShowAddForm(true)}
                        variant="outline"
                        size="sm"
                        className="gap-1.5 rounded-xl"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        Add Bank Account
                    </Button>
                </div>
            ) : (
                <div className="space-y-2">
                    {accounts.map((acc) => (
                        <div
                            key={acc.id}
                            className="flex items-center gap-3 p-3.5 bg-card rounded-xl border border-border hover:border-primary/20 transition-colors group"
                        >
                            <div className="p-2.5 bg-blue-50 dark:bg-blue-500/10 rounded-xl">
                                <Building2 className="w-4 h-4 text-blue-500" />
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <p className="text-sm font-semibold text-foreground">{acc.bank_name}</p>
                                    {acc.is_default && (
                                        <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-medium flex items-center gap-0.5">
                                            <Star className="w-2.5 h-2.5 fill-current" />
                                            Default
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground font-mono mt-0.5">
                                    {acc.account_number} — {acc.account_name}
                                </p>
                            </div>

                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {!acc.is_default && (
                                    <button
                                        onClick={() => handleSetDefault(acc.id)}
                                        className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-primary transition-colors"
                                        title="Set as default"
                                    >
                                        <Star className="w-3.5 h-3.5" />
                                    </button>
                                )}
                                <button
                                    onClick={() => handleDelete(acc.id)}
                                    disabled={deleting === acc.id}
                                    className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors"
                                    title="Remove account"
                                >
                                    {deleting === acc.id ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                        <Trash2 className="w-3.5 h-3.5" />
                                    )}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add Account Form */}
            {showAddForm && (
                <div className="bg-card rounded-xl border border-border p-5 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-foreground">Add New Account</h3>
                        <button
                            onClick={() => { setShowAddForm(false); setError(''); }}
                            className="p-1 rounded-lg hover:bg-muted text-muted-foreground"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Bank Name */}
                    <div className="relative">
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Bank Name</label>
                        <Input
                            id="bank-name-input"
                            placeholder="Search bank..."
                            value={bankSearch || bankName}
                            onChange={(e) => {
                                setBankSearch(e.target.value);
                                setBankName('');
                                setShowBankList(true);
                            }}
                            onFocus={() => setShowBankList(true)}
                            className="rounded-xl"
                        />
                        {showBankList && bankSearch && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-lg z-10 max-h-40 overflow-y-auto">
                                {filteredBanks.length === 0 ? (
                                    <p className="p-3 text-xs text-muted-foreground">No banks found</p>
                                ) : (
                                    filteredBanks.map((bank) => (
                                        <button
                                            key={bank}
                                            onClick={() => {
                                                setBankName(bank);
                                                setBankSearch('');
                                                setShowBankList(false);
                                            }}
                                            className="w-full text-left px-3 py-2 text-sm hover:bg-muted/50 transition-colors"
                                        >
                                            {bank}
                                        </button>
                                    ))
                                )}
                            </div>
                        )}
                        {bankName && (
                            <div className="flex items-center gap-1.5 mt-1.5">
                                <CheckCircle2 className="w-3 h-3 text-green-500" />
                                <span className="text-xs text-green-600 dark:text-green-400 font-medium">{bankName}</span>
                            </div>
                        )}
                    </div>

                    {/* Account Number */}
                    <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Account Number</label>
                        <Input
                            id="account-number-input"
                            type="text"
                            inputMode="numeric"
                            placeholder="0123456789"
                            maxLength={10}
                            value={accountNumber}
                            onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                            className="rounded-xl font-mono"
                        />
                        <p className="text-[11px] text-muted-foreground mt-1">{accountNumber.length}/10 digits</p>
                    </div>

                    {/* Account Name */}
                    <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Account Name</label>
                        <Input
                            id="account-name-input"
                            placeholder="e.g. John Doe"
                            value={accountName}
                            onChange={(e) => setAccountName(e.target.value)}
                            className="rounded-xl"
                        />
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
                        id="save-bank-account-btn"
                        onClick={handleAddAccount}
                        disabled={saving}
                        className="w-full h-10 rounded-xl gap-2"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Plus className="w-4 h-4" />
                                Save Account
                            </>
                        )}
                    </Button>
                </div>
            )}
        </div>
    );
}
