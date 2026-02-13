import React from 'react';

export default function TermsOfService() {
    return (
        <div className="min-h-screen bg-black text-white pt-28 pb-20 px-4">
            <div className="container mx-auto max-w-4xl">
                <h1 className="text-4xl font-black uppercase text-[#FF6600] mb-8">Terms of Service</h1>

                <div className="space-y-6 text-zinc-300">
                    <p><strong>Last Updated:</strong> January 2024</p>
                    <p>Welcome to MarketBridge. By accessing our platform, you agree to be bound by these Terms of Service and our Acceptable Use Policy.</p>

                    <h2 className="text-2xl font-bold text-white mt-8">1. Student-First Platform</h2>
                    <p>MarketBridge is designed primarily for students in Abuja. We reserve the right to verify student status and suspend accounts that fail verification or violate our community standards.</p>

                    <h2 className="text-2xl font-bold text-white mt-8">2. Prohibited Items</h2>
                    <p>Strictly prohibited items include: Illegal substances, weapons, adult content, stolen goods, and items violating academic integrity (e.g., exam malpractice materials).</p>

                    <h2 className="text-2xl font-bold text-white mt-8">3. Payments & Escrow</h2>
                    <p>We provide a secure payment mechanism. However, for offline exchanges, MarketBridge is not liable for safety or product quality once the exchange is completed outside our escrow system.</p>

                    <h2 className="text-2xl font-bold text-white mt-8">4. Zero Tolerance for Fraud</h2>
                    <p>Any attempt to defraud users or manipulate the platform will result in an immediate ban and reporting to appropriate university and legal authorities.</p>

                    <h2 className="text-2xl font-bold text-white mt-8">5. Disclaimer</h2>
                    <p>The service is provided "as is". We make no warranties regarding the accuracy of listings provided by third-party sellers.</p>
                </div>
            </div>
        </div>
    );
}
