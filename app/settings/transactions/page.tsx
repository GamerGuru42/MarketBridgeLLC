"use client"
import React, { useEffect, useState } from 'react'

export default function TransactionsPage() {
  const [txs, setTxs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/coins/transactions').then(r => r.json()).then(d => {
      setTxs(d.transactions || [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  if (loading) return <div style={{ minHeight: '100vh', background: '#000', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading…</div>

  return (
    <div style={{ minHeight: '100vh', background: '#000', color: '#fff', padding: 24 }}>
      <h2 style={{ color: '#FF6200' }}>MarketCoins Transactions</h2>
      <div style={{ marginTop: 12, maxWidth: 900 }}>
        {txs.length === 0 && <div style={{ color: '#777' }}>No transactions yet</div>}
        <div style={{ display: 'grid', gap: 8 }}>
          {txs.map((t: any) => (
            <div key={t.id} style={{ background: '#111', padding: 12, borderRadius: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: 800 }}>{t.description || 'Transaction'}</div>
                  <div style={{ color: '#999', fontSize: 12 }}>{new Date(t.created_at).toLocaleString()}</div>
                </div>
                <div style={{ color: '#FF6200', fontWeight: 900 }}>{t.amount > 0 ? '+' : ''}{t.amount} coins</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
