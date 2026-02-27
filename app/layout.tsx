import type { Metadata, Viewport } from "next";
import { Outfit, Manrope } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { GlobalWidgets } from "@/components/GlobalWidgets";
import { NetworkStatus } from "@/components/NetworkStatus";
import { LocationChecker } from "@/components/location-checker";
import BetaLabel from "@/components/BetaLabel";
import { LocationProvider } from "@/contexts/LocationContext";
import { ToastProvider } from "@/contexts/ToastContext";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_CLIENT_URL || 'https://marketbridge.com.ng';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "MarketBridge Official - Nigeria's Most Trusted Campus Marketplace",
  description: "The official hyper-local student marketplace for Abuja universities. Nigeria 2026 Campus Beta. Trade safely within your university Dashboard.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "MarketBridge",
  },
  icons: {
    icon: [
      { url: '/icon.png', type: 'image/png' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    apple: '/icon.png',
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
        className={`${manrope.variable} ${outfit.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
        >
          <AuthProvider>
            <LocationProvider>
              <CartProvider>
                <ToastProvider>
                  <LocationChecker>
                    {children}
                  </LocationChecker>

                  {/* Beta label is shown only on campus pages */}
                  <BetaLabel />

                  <NetworkStatus />
                </ToastProvider>
                <GlobalWidgets />
              </CartProvider>
            </LocationProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
