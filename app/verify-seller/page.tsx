"use client"
import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'

export default function VerifySeller() {
  const supabase = createClient()
  const { user, loading, refreshUser } = useAuth()
  const { toast } = useToast()

  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [sent, setSent] = useState(false)
  const [verifying, setVerifying] = useState(false)

  useEffect(() => {
    if (user) setEmail(user.email || '')
  }, [user])

  async function sendOtp() {
    if (!email) return toast('Email required', 'error')
    // Basic university email validation: require .edu or .edu.ng or known university domain pattern
    const lower = email.toLowerCase()
    const isUni = /\.edu(\.ng)?$/.test(lower) || /@(uni|unilag|uniabuja|ui|unn|abuja|nile|baze|veritas|bauchi)\./.test(lower)
    if (!isUni) return toast('Please use your official university email (e.g. you@uni.edu.ng)', 'error')

    await fetch('/api/verification/send-otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) })
    setSent(true)
    toast('OTP requested. Check your email.', 'info')
  }

  async function verify() {
    if (!code || !user) return toast('Code and login required', 'error')
    setVerifying(true)
    try {
      const res = await fetch('/api/verification/verify-otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, code, userId: user.id }) })
      const d = await res.json()
      if (d?.success) {
        toast('OTP verified — request sent for admin approval', 'success')
        await refreshUser()
      } else {
        toast(d?.error || 'Verification failed', 'error')
      }
    } catch (e) {
      console.error(e)
      toast('Verification failed', 'error')
    } finally {
      setVerifying(false)
    }
  }

  if (loading) return <div className="min-h-screen bg-black text-white flex items-center justify-center">Loading…</div>

  return (
    <div style={{ minHeight: '100vh', background: '#000', color: '#fff', padding: 24 }}>
      <h1 style={{ color: '#FF6200', fontWeight: 900 }}>Verify University Email</h1>
      <div style={{ marginTop: 12, maxWidth: 720 }}>
        <div style={{ background: '#111', padding: 12, borderRadius: 8 }}>
          <div style={{ marginBottom: 8 }}>Enter your university email to receive a one-time code.</div>
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@uni.edu.ng" style={{ width: '100%', padding: 10, borderRadius: 8, background: '#000', border: '1px solid #222', color: '#fff' }} />
          <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
            <button onClick={sendOtp} style={{ background: '#FF6200', color: '#000', padding: '8px 12px', borderRadius: 8, border: 'none' }}>Send OTP</button>
            <button onClick={() => window.location.href = '/settings'} style={{ background: '#222', color: '#fff', padding: '8px 12px', borderRadius: 8 }}>Back</button>
          </div>
        </div>

        {sent && (
          <div style={{ marginTop: 12, background: '#111', padding: 12, borderRadius: 8 }}>
            <div>Enter the code sent to your email</div>
            <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="123456" style={{ width: '100%', padding: 10, borderRadius: 8, background: '#000', border: '1px solid #222', color: '#fff', marginTop: 8 }} />
            <div style={{ marginTop: 8 }}>
              <button onClick={verify} disabled={verifying} style={{ background: '#FF6200', color: '#000', padding: '8px 12px', borderRadius: 8, border: 'none' }}>{verifying ? 'Verifying…' : 'Verify'}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
