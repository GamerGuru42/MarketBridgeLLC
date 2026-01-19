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
    onClose: () => void,
    paymentOptions: string = 'card,banktransfer,ussd'
) => {
    return {
        public_key: process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY,
        tx_ref: txRef,
        amount: amount.toString(),
        currency: 'NGN',
        payment_options: paymentOptions,
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
    const initializePayment = async (config: unknown): Promise<boolean> => {
        try {
            // Load Flutterwave inline script if not already loaded
            await loadScript('https://checkout.flutterwave.com/v3.js');

            // @ts-expect-error - flutterwave object injected globally
            const FlutterwaveCheckout = window.FlutterwaveCheckout;

            if (FlutterwaveCheckout) {
                FlutterwaveCheckout(config);
                return true;
            } else {
                console.error('FlutterwaveCheckout not available');
                return false;
            }
        } catch (err) {
            console.error('Failed to load Flutterwave script', err);
            return false;
        }
    };

    // Ensure script is loaded on mount
    useEffect(() => {
        loadScript('https://checkout.flutterwave.com/v3.js');
    }, []);

    return { initializePayment };
};
