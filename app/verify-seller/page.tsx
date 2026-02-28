"use client"

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { useRouter } from 'next/navigation'
import { ArrowLeft, CheckCircle, Loader2, ShieldCheck, Mail, AlertCircle, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function VerifySeller() {
  const supabase = createClient()
  const { user, loading, refreshUser } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState(1) // 1: Email, 2: OTP, 3: Success
  const [verifying, setVerifying] = useState(false)
  const [emailError, setEmailError] = useState('')

  useEffect(() => {
    if (user && user.email) setEmail(user.email)
  }, [user])

  const validateEmail = (val: string) => {
    setEmail(val)
    if (!val) {
      setEmailError('Email is required')
      return false
    }
    const lower = val.toLowerCase()
    const isUni = /\.edu(\.ng)?$/.test(lower) || /@(uni|unilag|uniabuja|ui|unn|abuja|nile|baze|veritas|bauchi)\./.test(lower)
    if (!isUni) {
      setEmailError('Please use your official university email (e.g. you@uni.edu.ng)')
      return false
    }
    setEmailError('')
    return true
  }

  async function sendOtp() {
    if (!validateEmail(email)) return

    setVerifying(true)
    try {
      const res = await fetch('/api/verification/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      if (!res.ok) throw new Error('Failed to send OTP')
      setStep(2)
      toast('OTP requested. Check your email.', 'info')
    } catch (err) {
      toast('Failed to send OTP. Please try again.', 'error')
    } finally {
      setVerifying(false)
    }
  }

  async function verify() {
    if (!code || !user) return toast('Verification code required', 'error')
    setVerifying(true)
    try {
      const res = await fetch('/api/verification/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, userId: user.id })
      })
      const d = await res.json()
      if (d?.success) {
        toast('OTP verified successfully', 'success')
        await refreshUser()
        setStep(3)
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

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center text-white">
      <Loader2 className="h-8 w-8 animate-spin text-[#FF6200]" />
    </div>
  )

  return (
    <div className="min-h-screen bg-black text-white selection:bg-[#FF6200] selection:text-black py-12 px-4 relative">
      <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10 pointer-events-none" />

      <div className="max-w-xl mx-auto relative z-10">
        <Link href="/seller/dashboard" className="inline-flex items-center text-white/50 hover:text-white transition-colors mb-8 text-sm font-bold uppercase tracking-widest">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </Link>

        {/* Progress Bar */}
        <div className="flex items-center justify-between mb-12 relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-white/10 rounded-full" />
          <div
            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-[#FF6200] rounded-full transition-all duration-500"
            style={{ width: `${(step - 1) * 50}%` }}
          />
          {[1, 2, 3].map((num) => (
            <div
              key={num}
              className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm transition-all duration-500 ${step >= num ? 'bg-[#FF6200] text-black shadow-[0_0_15px_rgba(255,98,0,0.5)]' : 'bg-zinc-900 border-2 border-white/20 text-white/40'
                }`}
            >
              {step > num ? <CheckCircle className="h-4 w-4" /> : num}
            </div>
          ))}
        </div>

        <div className="bg-[#111111] rounded-3xl p-8 border border-white/5 shadow-2xl">
          <div className="flex items-start gap-4 p-4 bg-[#FF6200]/10 border border-[#FF6200]/20 rounded-2xl mb-8">
            <ShieldCheck className="h-6 w-6 text-[#FF6200] shrink-0 mt-0.5" />
            <div>
              <h3 className="text-[#FF6200] font-black uppercase tracking-widest text-sm mb-1">Seller Verification</h3>
              <p className="text-white/70 text-sm font-medium">Campus selling requires student verification – complete now to start listing.</p>
            </div>
          </div>

          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <div className="space-y-4">
                <label className="text-xs uppercase font-black tracking-widest text-white/50 block">University Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/30" />
                  <input
                    value={email}
                    onChange={(e) => validateEmail(e.target.value)}
                    placeholder="you@uni.edu.ng"
                    className="w-full h-14 pl-12 pr-4 rounded-xl bg-black border border-white/10 focus:border-[#FF6200] focus:ring-1 focus:ring-[#FF6200] outline-none transition-all font-medium"
                  />
                </div>
                {emailError && (
                  <div className="flex items-center gap-2 text-red-400 text-xs font-bold mt-2 px-2">
                    <AlertCircle className="h-3 w-3" />
                    {emailError}
                  </div>
                )}
              </div>
              <Button
                onClick={sendOtp}
                disabled={verifying || !!emailError || !email}
                className="w-full h-14 bg-[#FF6200] hover:bg-[#ff7a29] text-black font-black uppercase tracking-widest rounded-xl transition-all flex items-center gap-2 justify-center"
              >
                {verifying ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Send Verification Code <ArrowRight className="h-4 w-4" /></>}
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <div className="space-y-4">
                <label className="text-xs uppercase font-black tracking-widest text-white/50 block">Verification Code</label>
                <p className="text-sm font-medium text-white/70 mb-4">We sent a 6-digit code to <strong className="text-white">{email}</strong></p>
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="123456"
                  className="w-full h-14 px-4 rounded-xl bg-black border border-white/10 focus:border-[#FF6200] focus:ring-1 focus:ring-[#FF6200] outline-none transition-all font-medium text-center text-xl tracking-[0.5em]"
                  maxLength={6}
                />
              </div>
              <div className="flex gap-4">
                <Button
                  onClick={() => setStep(1)}
                  variant="outline"
                  className="h-14 px-6 border-white/10 bg-transparent text-white hover:bg-white/5 font-black uppercase tracking-widest rounded-xl"
                >
                  Back
                </Button>
                <Button
                  onClick={verify}
                  disabled={verifying || code.length < 5}
                  className="flex-1 h-14 bg-[#FF6200] hover:bg-[#ff7a29] text-black font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  {verifying ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Verify Code'}
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="text-center space-y-6 animate-in zoom-in-95 duration-500">
              <div className="w-20 h-20 bg-[#FF6200]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="h-10 w-10 text-[#FF6200]" />
              </div>
              <h2 className="text-2xl font-black uppercase tracking-tighter text-[#FF6200]">Verification Complete</h2>
              <p className="text-white/70 font-medium leading-relaxed">
                Your university email has been verified. You can now start creating listings on MarketBridge.
              </p>
              <Button
                asChild
                className="w-full h-14 mt-4 bg-[#FF6200] hover:bg-[#ff7a29] text-black font-black uppercase tracking-widest rounded-xl transition-all"
              >
                <Link href="/seller/dashboard">
                  Go to Dashboard
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
