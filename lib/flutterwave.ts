import { useEffect } from 'react';
import { loadScript } from '@/utils/loadScript'; // helper to load external scripts

// Helper to build Flutterwave config
export const getFlutterwaveConfig = (
    txRef: string,
    amount: number,
    email: string,
    name: string,
    phoneNumber: string,
    onSuccess: (response: unknown) => void,
    onClose: () => void
) => {
    return {
        public_key: process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY,
        tx_ref: txRef,
        amount: amount.toString(),
        currency: 'NGN',
        payment_options: 'card,banktransfer,ussd',
        customer: {
            email,
            name,
            phonenumber: phoneNumber,
        },
        customizations: {
            title: 'MarketBridge Payment',
            description: 'Escrow payment for order',
            logo: '/logo.png',
        },
        callback: onSuccess,
        onclose: onClose,
    };
};

export const useFlutterwave = () => {
    const initializePayment = (config: unknown) => {
        // Load Flutterwave inline script if not already loaded
        loadScript('https://checkout.flutterwave.com/v3.js')
            .then(() => {
                // @ts-expect-error - flutterwave object injected globally
                const FlutterwaveCheckout = window.FlutterwaveCheckout;
                if (FlutterwaveCheckout) {
                    FlutterwaveCheckout(config);
                } else {
                    console.error('FlutterwaveCheckout not available');
                }
            })
            .catch(err => console.error('Failed to load Flutterwave script', err));
    };

    // Ensure script is loaded on mount
    useEffect(() => {
        loadScript('https://checkout.flutterwave.com/v3.js');
    }, []);

    return { initializePayment };
};
