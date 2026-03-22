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
import { OnboardingTour } from "@/components/OnboardingTour";

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
  title: "MarketBridge – Campus Marketplace for Abuja Universities",
  description: "Buy, sell & trade safely with verified student sellers. Textbooks, laptops, wigs, food delivery & more.",
  alternates: {
    canonical: siteUrl,
  },
  // verification: Add Google Search Console and Bing Webmaster codes when available
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "MarketBridge",
  },
  icons: {
    icon: [
      { url: '/favicon-v2.png?v=2', type: 'image/png', sizes: 'any' },
    ],
    apple: [
      { url: '/apple-touch-icon-v2.png?v=2' },
    ],
    shortcut: '/favicon-v2.ico?v=2',
  },

  openGraph: {
    title: "MarketBridge – Campus Marketplace for Abuja Universities",
    description: "Buy, sell & trade safely with verified student sellers. Textbooks, laptops, wigs, food delivery & more.",
    url: siteUrl,
    siteName: "MarketBridge",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "MarketBridge – Campus Marketplace",
      },
    ],
    locale: "en_NG",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MarketBridge – Campus Marketplace for Abuja Universities",
    description: "Buy, sell & trade safely with verified student sellers. Textbooks, laptops, wigs, food delivery & more.",
    images: ["/og-image.png"],
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
                <OnboardingTour />
              </CartProvider>
            </LocationProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
