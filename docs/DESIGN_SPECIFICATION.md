# MarketBridge UI/UX Design Specification (v1.0 - Baseline)

This document serves as the official design system and UX manifest for the MarketBridge platform. This configuration is the "Golden Thread" to be maintained for the official production launch.

## 1. Visual Identity & Aesthetic
*   **The Look**: "Radical Institutional" / "Cyber-Merchant". 
*   **Theme**: Dark-first, minimalist but high-fidelity. 
*   **Core Colors**:
    *   **Primary Action**: `#FF6600` (MarketBridge Orange) - Used for buttons, active states, and highlights.
    *   **Background**: `#000000` (Pure Black for OLED depth).
    *   **Surface/Cards**: `#09090B` with `backdrop-blur-xl` and `border-white/5`.
    *   **Status/Trust**: `#00FF85` (Cyber Green) - Used for verified badges and active nodes.
*   **Typography**:
    *   **Headings**: `Outfit` - Black weight, Uppercase, Tracking-tighter, Italic (used for impact).
    *   **Body/UI**: `Manrope` - Bold to Black weights, Uppercase tracking for meta-data.

## 2. Global Layout Standards
*   **Header**: Fixed, transparent to black-blur on scroll. Left-aligned logo, central nav, right-aligned action cluster.
*   **Mobile Experience**: 
    *   **Mobile Bottom Nav**: Floating glassmorphism tab bar.
    *   **Safe Areas**: Bottom padding (`pb-20`) to prevent overlap with the floating nav.
    *   **Beta Banner**: Dismissible rolling marquee at the bottom.
*   **Scroll Experience**: Custom sleek scrollbars (Webkit/Firefox) with `scrollbar-gutter: stable` to prevent layout shifts.

## 3. Component Architecture
*   **Buttons**:
    *   `Primary`: Rounded-xl or full, black text on orange background (`bg-[#FF6600]`), font-black.
    *   `Ghost/Outline`: Rounded-xl, muted text, border-white/10, scales slightly on hover.
*   **Dropdowns/Modals**: 
    *   Institutional style: `rounded-3xl` (not standard 2xl).
    *   Padding: Generous (`p-10` for dialogs, `p-2` for dropdowns).
    *   Shadows: Heavy, deep elevation (`shadow-[0_20px_50px_rgba(0,0,0,0.9)]`).
*   **Cards**: Standardized `rounded-none` for marketplace listings (industrial feel) vs `rounded-3xl` for landing page highlights (premium feel).

## 4. Key Specialized Features
*   **Hero Section**: Dynamic item bridge with floating product cards using Framer Motion constants.
*   **Sage AI**: Floating assistant with "institutional intelligence" personality. Integrated product visual cards in-chat.
*   **Dealer Nodes**: Verification-first display. Every merchant profile must lead with institutional trust marks.

## 5. Production Launch (Non-Beta) Adjustments
When transitioning from the current "Beta" to "Official Launch":
1.  **Remove**: `BetaBanner.tsx` and all "Sample Data" notices.
2.  **Toggle**: Set `is_verified` as the default filter for high-value categories.
3.  **Consistency**: Maintain the current orange/black contrast and "cyber-institutional" terminology (e.g., "Disconnect" instead of "Logout", "Node" instead of "City").

---
**Status**: Recorded as Master UI/UX Baseline.
**Last Updated**: 2026-02-15
