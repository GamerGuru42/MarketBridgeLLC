import type { Metadata, Viewport } from "next";
import { Geist_Mono, Outfit, Manrope } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { AiAssistant } from "@/components/AiAssistant";
import { CookieConsent } from "@/components/CookieConsent";
import { LocationChecker } from "@/components/location-checker";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_CLIENT_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "MarketBridge - Nigeria's Most Trusted Business Marketplace",
  description: "Starting with new and used cars, MarketBridge connects verified dealers with customers through escrow-protected transactions. From small businesses to large enterprises, shop with confidence.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "MarketBridge",
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: '/favicon.svg',
  },
  openGraph: {
    title: "MarketBridge - Nigeria's Most Trusted Business Marketplace",
    description: "Starting with new and used cars. Escrow-protected transactions for businesses of all sizes.",
    url: siteUrl,
    siteName: "MarketBridge",
    images: [
      {
        url: "/marketbridge_logo_branding.png",
        width: 1200,
        height: 630,
      },
    ],
    locale: "en_NG",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MarketBridge - Nigeria's Most Trusted Business Marketplace",
    description: "Starting with new and used cars. Escrow-protected transactions for businesses of all sizes.",
    images: ["/marketbridge_logo_branding.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Prevent zooming for app-like feel
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${manrope.variable} ${geistMono.variable} ${outfit.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
        >
          <AuthProvider>
            <CartProvider>
              <LocationChecker>
                {children}
              </LocationChecker>
              <AiAssistant />
              <CookieConsent />
            </CartProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
