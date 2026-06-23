const withPWA = require("@ducanh2912/next-pwa").default({
    dest: "public",
    register: true,
    skipWaiting: true,
    disable: process.env.NODE_ENV === "development",
    runtimeCaching: [
        {
            // NEVER cache Supabase auth/API requests
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: "NetworkOnly",
        },
        {
            // NEVER cache Next.js API routes or auth routes
            urlPattern: /^https:\/\/.*\/(api|auth)\/.*/i,
            handler: "NetworkOnly",
        },
        {
            // Cache static assets (images, fonts, CSS, JS)
            urlPattern: /\.(?:js|css|woff|woff2|png|jpg|jpeg|svg|gif|ico|webp)$/i,
            handler: "CacheFirst",
            options: {
                cacheName: "static-assets",
                expiration: {
                    maxEntries: 100,
                    maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
                },
            },
        },
        {
            // Network-first for page navigations
            urlPattern: /^https:\/\/.*/i,
            handler: "NetworkFirst",
            options: {
                cacheName: "pages",
                expiration: {
                    maxEntries: 50,
                    maxAgeSeconds: 24 * 60 * 60, // 1 day
                },
            },
        },
    ],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    env: {
        // Expose public toggle to the client. Server middleware still uses ENABLE_PUBLIC_SECTION.
        NEXT_PUBLIC_ENABLE_PUBLIC_SECTION: process.env.ENABLE_PUBLIC_SECTION || 'false',
    },
    typescript: {
        ignoreBuildErrors: true,
    },
    eslint: {
        ignoreDuringBuilds: true,
    },
    async redirects() {
        return [
            {
                source: '/register',
                destination: '/signup',
                permanent: true,
            },
        ];
    },
    async headers() {
        return [
            {
                source: '/(.*)',
                headers: [
                    {
                        key: 'X-Frame-Options',
                        value: 'DENY',
                    },
                    {
                        key: 'X-Content-Type-Options',
                        value: 'nosniff',
                    },
                    {
                        key: 'Referrer-Policy',
                        value: 'strict-origin-when-cross-origin',
                    },
                    {
                        key: 'Strict-Transport-Security',
                        value: 'max-age=31536000; includeSubDomains; preload',
                    },
                    {
                        key: 'Permissions-Policy',
                        value: 'camera=(self), microphone=(), geolocation=(self), interest-cohort=()',
                    },
                    {
                        key: 'X-XSS-Protection',
                        value: '1; mode=block',
                    }
                ],
            },
        ];
    },
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'firebasestorage.googleapis.com',
            },
            {
                protocol: 'https',
                hostname: 'lh3.googleusercontent.com',
            },
            {
                protocol: 'https',
                hostname: 'placehold.co',
            },
            {
                protocol: 'https',
                hostname: 'images.unsplash.com',
            },
            {
                protocol: 'https',
                hostname: '**.supabase.co',
            },
        ],
    },
};

module.exports = withPWA(nextConfig);
