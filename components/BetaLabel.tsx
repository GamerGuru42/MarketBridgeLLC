import React from 'react'
import { usePathname } from 'next/navigation'
import { useSystem } from '@/contexts/SystemContext'

export default function BetaLabel() {
  const pathname = usePathname() || ''
  const { isDemoMode } = useSystem()

  // Show if on campus route OR if system-wide Demo Mode is active
  if (!pathname.startsWith('/campus') && !isDemoMode) return null

  return (
    <div className="fixed bottom-4 left-4 z-[9999] pointer-events-none">
      <div className="bg-[#FF6200] text-black text-[9px] sm:text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow-[0_0_15px_rgba(255,98,0,0.3)] border border-black/10 backdrop-blur-md italic flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-black opacity-40"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-black"></span>
        </span>
        {isDemoMode ? 'LIVE DEMO – Production Testing' : 'MarketBridge Campus Beta'}
      </div>
    </div>
  )
}
