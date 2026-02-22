"use client"

import React, { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'

export default function SettingsPage() {
    const { user, loading, refreshUser } = useAuth()
    const supabase = createClient()
    const [coins, setCoins] = useState<number | null>(null)

    useEffect(() => {
        if (!user) return
        setCoins(Number(user.coins_balance || 0))
    }, [user])

    if (loading) return <div className="min-h-screen bg-black text-white flex items-center justify-center">Loading...</div>

    return (
        <div style={{ minHeight: '100vh', background: '#000', color: '#fff', padding: 24 }}>
            <h1 style={{ color: '#FF6200', fontWeight: 900 }}>Account Settings</h1>
            <div style={{ marginTop: 18, display: 'grid', gridTemplateColumns: '1fr', gap: 12, maxWidth: 760 }}>
                <div style={{ background: '#111', padding: 16, borderRadius: 12, border: '1px solid #222' }}>
                    <div style={{ fontSize: 12, color: '#fff', fontWeight: 800 }}>MarketCoins Balance</div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: '#FF6200', marginTop: 8 }}>{coins?.toLocaleString() ?? '0'} coins</div>
                    <div style={{ marginTop: 8, color: '#fff' }}>1 coin = ₦1. Earned on purchases and sales. Redeem at checkout.</div>
                    <div style={{ marginTop: 10 }}>
                        <a href="/settings/transactions" style={{ background: '#FF6200', color: '#000', padding: '8px 10px', borderRadius: 8, textDecoration: 'none', fontWeight: 800 }}>View Transactions</a>
                    </div>
                </div>

                <div style={{ background: '#111', padding: 16, borderRadius: 12, border: '1px solid #222' }}>
                    <div style={{ fontSize: 12, color: '#fff', fontWeight: 800 }}>Referral Link</div>
                    <div style={{ marginTop: 8 }}>
                        <input readOnly value={`${window.location.origin}/signup?ref=${user?.referral_code || user?.referral_link_code || ''}`} style={{ width: '100%', padding: 10, background: '#000', border: '1px solid #222', color: '#fff', borderRadius: 8 }} />
                        <div style={{ marginTop: 8, color: '#fff' }}>Share this link. Earn ₦300 (coins) when referred users complete ₦5,000+ purchases.</div>
                    </div>
                </div>
            </div>
        </div>
    )
}
