"use client"

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useLocation } from '@/contexts/LocationContext'
import Image from 'next/image'
import { ABUJA_UNIVERSITIES } from '@/lib/location'

export default function HomePage() {
    const router = useRouter()
    const publicEnabled = process.env.NEXT_PUBLIC_ENABLE_PUBLIC_SECTION === 'true'

    const {
        isAbuja,
        loading: locationLoading,
        consentStatus,
        requestLocation,
        denyConsent,
        setManualLocation,
        city,
        region
    } = useLocation()

    // Local state for the consent modal explicitly on this page
    const [showConsentModal, setShowConsentModal] = useState(false)
    const [showManualDropdown, setShowManualDropdown] = useState(false)
    // Auto-redirect logged in users to appropriate section
    useEffect(() => {
        ; (async () => {
            try {
                const supabase = createClient()
                const { data: sessionData } = await supabase.auth.getSession()
                const session = sessionData?.session
                if (session?.user) {
                    const { data: user } = await supabase
                        .from('users')
                        .select('id,university,is_verified_seller,role')
                        .eq('id', session.user.id)
                        .single()

                    if (user) {
                        // Seller/student users -> campus
                        if (user.role === 'student_seller' || user.university) {
                            router.replace('/campus')
                            return
                        }

                        // Otherwise, if public enabled, send to public
                        if (publicEnabled) {
                            router.replace('/public')
                            return
                        }

                        // Default to campus when public is disabled
                        router.replace('/campus')
                        return
                    }
                }
            } catch (e) {
                console.error('Auto-redirect failed', e)
            }
        })()
    }, [router, publicEnabled])

    useEffect(() => {
        if (!locationLoading && consentStatus === 'prompt') {
            setShowConsentModal(true)
        } else {
            setShowConsentModal(false)
        }

        if (!locationLoading && consentStatus === 'denied') {
            setShowManualDropdown(true)
        }
    }, [consentStatus, locationLoading])

    const handleAllowLocation = async () => {
        setShowConsentModal(false)
        await requestLocation()
    }

    const handleDenyLocation = () => {
        setShowConsentModal(false)
        denyConsent()
        setShowManualDropdown(true)
    }

    return (
        <div className="min-h-screen bg-black text-white font-sans flex flex-col selection:bg-[#FF6200] selection:text-black">
            {/* Minimal Header */}
            <header className="w-full p-6 flex justify-center md:justify-start items-center border-b border-white/10 shrink-0">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded shrink-0 bg-[#FF6200] flex items-center justify-center">
                        <span className="font-black text-black text-xl">M</span>
                    </div>
                    <span className="text-[#FF6200] font-black text-2xl tracking-tighter">
                        MarketBridge
                    </span>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 w-full max-w-5xl mx-auto px-6 py-12 md:py-24 flex flex-col justify-center gap-12">

                <h1 className="text-[#FF6200] text-4xl md:text-6xl font-black text-center uppercase tracking-tight 
                               drop-shadow-[0_0_15px_rgba(255,98,0,0.5)] leading-tight">
                    Choose Your Marketplace
                </h1>

                {/* Location Detection Area */}
                <div className="w-full flex justify-center text-sm font-semibold uppercase tracking-widest text-zinc-500 min-h-[40px] items-center">
                    {locationLoading ? (
                        <div className="flex items-center gap-3 animate-pulse">
                            <div className="w-4 h-4 rounded-full border-2 border-[#FF6200] border-t-transparent animate-spin" />
                            Detecting Signal...
                        </div>
                    ) : (city || region) ? (
                        <div className="flex items-center gap-2 text-white">
                            <span className="text-[#FF6200]">●</span> Detected Area: {city ? `${city}, ` : ''}{region}
                        </div>
                    ) : showManualDropdown ? (
                        <div className="flex flex-col sm:flex-row items-center gap-4 w-full max-w-md">
                            <span className="shrink-0 text-[#FF6200]">Set Area:</span>
                            <select
                                className="w-full bg-black border border-white/20 text-white p-3 rounded-xl outline-none focus:border-[#FF6200] transition-colors appearance-none text-center sm:text-left cursor-pointer font-bold"
                                onChange={(e) => {
                                    if (e.target.value === 'public') {
                                        setManualLocation('global');
                                    } else {
                                        const uni = ABUJA_UNIVERSITIES.find(u => u.id === e.target.value);
                                        if (uni) setManualLocation(uni);
                                    }
                                }}
                                defaultValue=""
                            >
                                <option value="" disabled>Select your location</option>
                                <optgroup label="Abuja Campuses">
                                    {ABUJA_UNIVERSITIES.map(u => (
                                        <option key={u.id} value={u.id}>{u.name}</option>
                                    ))}
                                </optgroup>
                                <optgroup label="Other Hubs">
                                    <option value="public">Other / Nationwide</option>
                                </optgroup>
                            </select>
                        </div>
                    ) : null}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl mx-auto">
                    {/* Campus Card - Always Visible */}
                    <div
                        role="button"
                        onClick={() => router.push('/campus')}
                        className={`group relative flex flex-col justify-between p-8 rounded-3xl bg-black border-2 cursor-pointer transition-all duration-300
                            ${isAbuja ? 'border-[#FF6200] shadow-[0_0_40px_rgba(255,98,0,0.15)] ring-1 ring-[#FF6200]/50' : 'border-white/10 hover:border-[#FF6200]/50 hover:shadow-[0_0_30px_rgba(255,98,0,0.1)]'}
                        `}
                    >
                        {isAbuja && (
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#FF6200] text-black text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-[0_0_15px_rgba(255,98,0,0.5)]">
                                SIGNAL MATCH
                            </div>
                        )}
                        <div className="space-y-4">
                            <h2 className="text-2xl font-black uppercase tracking-tight text-white group-hover:text-[#FF6200] transition-colors">
                                Campus Marketplace
                            </h2>
                            <p className="text-zinc-400 font-medium leading-relaxed">
                                Buy & sell safely with verified student sellers in Abuja universities.
                            </p>
                        </div>
                        <div className="pt-8">
                            <button className="w-full bg-[#FF6200] text-black font-black uppercase tracking-widest py-4 rounded-xl hover:bg-white hover:text-black transition-all duration-300 active:scale-95 shadow-[0_0_20px_rgba(255,98,0,0.3)]">
                                Enter Campus
                            </button>
                        </div>
                    </div>

                    {/* Public Card - Conditional */}
                    {publicEnabled && (
                        <div
                            role="button"
                            onClick={() => router.push('/public')}
                            className="group relative flex flex-col justify-between p-8 rounded-3xl bg-black border-2 border-white/10 hover:border-[#FF6200]/50 cursor-pointer transition-all duration-300 hover:shadow-[0_0_30px_rgba(255,98,0,0.1)]"
                        >
                            <div className="space-y-4">
                                <h2 className="text-2xl font-black uppercase tracking-tight text-white group-hover:text-[#FF6200] transition-colors">
                                    Public Marketplace
                                </h2>
                                <p className="text-zinc-400 font-medium leading-relaxed">
                                    Buy & sell anything in Nigeria — open to everyone.
                                </p>
                            </div>
                            <div className="pt-8">
                                <button className="w-full bg-[#FF6200] text-black font-black uppercase tracking-widest py-4 rounded-xl hover:bg-white hover:text-black transition-all duration-300 active:scale-95 shadow-[0_0_20px_rgba(255,98,0,0.3)]">
                                    Enter Public
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Consent Modal Overlay */}
                {showConsentModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                        <div className="bg-black border-2 border-[#FF6200] rounded-3xl p-8 max-w-sm w-full shadow-[0_0_50px_rgba(255,98,0,0.2)]">
                            <h3 className="text-[#FF6200] text-xl font-black uppercase tracking-tight mb-4 text-center">Location Request</h3>
                            <p className="text-zinc-300 text-center mb-8 font-medium">
                                Allow location access to automatically connect you to the nearest campus marketplace?
                            </p>
                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={handleAllowLocation}
                                    className="w-full bg-[#FF6200] text-black font-black uppercase tracking-widest py-4 rounded-xl hover:bg-white transition-colors"
                                >
                                    Allow Access
                                </button>
                                <button
                                    onClick={handleDenyLocation}
                                    className="w-full bg-transparent border-2 border-white/20 text-white font-bold uppercase tracking-widest py-4 rounded-xl hover:bg-white/5 transition-colors"
                                >
                                    Deny / Manual
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Minimal Footer */}
            <footer className="w-full p-6 text-center border-t border-white/10 shrink-0 mt-auto">
                <p className="text-zinc-500 font-medium text-sm flex flex-col md:flex-row justify-center items-center gap-1 md:gap-4">
                    <span>Tech Support: <a href="mailto:support@marketbridge.com.ng" className="text-[#FF6200] hover:text-white transition-colors">support@marketbridge.com.ng</a></span>
                    <span className="hidden md:inline">|</span>
                    <span>Ops Support: <a href="mailto:ops-support@marketbridge.com.ng" className="text-[#FF6200] hover:text-white transition-colors">ops-support@marketbridge.com.ng</a></span>
                </p>
                <p className="text-white font-medium text-sm mt-4">
                    MarketBridge NG Limited | RC [RC number] | Registered in Abuja, Nigeria
                </p>
            </footer>
        </div>
    )
}
