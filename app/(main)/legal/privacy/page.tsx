import React from 'react';

export default function PrivacyPolicy() {
    return (
        <div className="min-h-screen bg-black text-white pt-28 pb-20 px-4">
            <div className="container mx-auto max-w-4xl">
                <h1 className="text-4xl font-black uppercase text-[#FFB800] mb-8">Privacy Policy</h1>

                <div className="space-y-6 text-zinc-300">
                    <p><strong>Effective Date:</strong> January 2024</p>
                    <p>MarketBridge ("we", "us", or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclosure, and safeguard your information when you visit our website or use our services.</p>

                    <h2 className="text-2xl font-bold text-white mt-8">1. Collection of Data</h2>
                    <p>We collect information that you provide directly to us when you register, create a listing, or communicate with us. This includes:</p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>Personal Identification Data (Name, Email address, Phone number).</li>
                        <li>University Verification Data (Student ID, Matriculation Number).</li>
                        <li>Transaction Data (details about payments to and from you).</li>
                    </ul>

                    <h2 className="text-2xl font-bold text-white mt-8">2. Use of Data</h2>
                    <p>We use your data to:</p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>Facilitate transactions and verify student status.</li>
                        <li>Maintain the safety and security of the marketplace.</li>
                        <li>Comply with the Nigeria Data Protection Act (NDPA) 2023.</li>
                    </ul>

                    <h2 className="text-2xl font-bold text-white mt-8">3. Data Protection</h2>
                    <p>We implement appropriate technical and organizational measures to ensure a level of security appropriate to the risk, in compliance with the NDPA 2023 and NDPR.</p>

                    <h2 className="text-2xl font-bold text-white mt-8">4. Sharing of Data</h2>
                    <p>We do not sell your personal data. We may share data with third-party vendors (e.g., payment processors like Flutterwave/OPay) strictly for the purpose of enabling our services.</p>

                    <h2 className="text-2xl font-bold text-white mt-8">5. Your Rights</h2>
                    <p>Under Nigerian law, you have the right to request access to, correction of, or deletion of your personal data. Contact our Data Protection Officer at privacy@marketbridge.ng.</p>
                </div>
            </div>
        </div>
    );
}
