"use client"
import React, { useState } from 'react'

export default function SubscriptionCheckout() {
  const [loading, setLoading] = useState(false)

  async function startSubscription() {
    setLoading(true)
    try {
      const res = await fetch('/api/subscriptions/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ plan: 'monthly' }) })
      const data = await res.json()
      const payload = data?.data || data

      // Prefer redirect URL if provided
      const authUrl = payload?.authorization_url || payload?.gateway_url || payload?.authorization_url
      if (authUrl) {
        window.location.href = authUrl
        return
      }

      // If Paystack reference present and public key configured, try inline
      const reference = payload?.reference
      const PAYSTACK_PUBLIC = (window as any).__NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || (process?.env as any)?.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY
      if (reference && PAYSTACK_PUBLIC) {
        try {
          const { loadPaystackInline, openPaystackInline } = await import('@/lib/paystack/client')
          await loadPaystackInline()
          openPaystackInline({ key: PAYSTACK_PUBLIC as string, email: '', amount: 0, reference, onSuccess: (res: any) => { console.log('Payment success', res); window.location.href = '/subscriptions/thank-you' } })
          return
        } catch (e) {
          console.warn('Inline paystack failed', e)
        }
      }

      console.warn('UI_ALERT:', )
      console.error(data)
    } catch (e) {
      console.error(e)
      console.warn('UI_ALERT:', )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: 20, color: '#FFF', background: '#000', minHeight: '100vh' }}>
      <h2 style={{ color: '#FF6200' }}>Subscribe (Seller)</h2>
      <div style={{ marginTop: 12 }}>
        <div style={{ background: '#111', padding: 12, borderRadius: 8 }}>
          <div style={{ fontWeight: 800 }}>Monthly Seller Plan</div>
          <div style={{ color: '#FF6200', fontWeight: 900, marginTop: 6 }}>₦1,000 / month</div>
          <button onClick={startSubscription} disabled={loading} style={{ marginTop: 12, background: '#FF6200', color: '#000', padding: '8px 12px', borderRadius: 8, border: 'none' }}>{loading ? 'Starting…' : 'Subscribe'}</button>
        </div>
      </div>
    </div>
  )
}
