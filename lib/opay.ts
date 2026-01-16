/**
 * OPay Integration Utility
 * OPay primarily uses a server-side "Express Checkout" (OPay Cashier) flow.
 * To integrate OPay:
 * 1. Your backend makes a POST request to OPay's /cashier/create endpoint.
 * 2. It returns a 'cashierUrl'.
 * 3. Redirect the user to this URL.
 * 4. OPay notifies your webhook on success.
 */

export const initiateOPayCheckout = async (data: {
    amount: number;
    email: string;
    reference: string;
    description: string;
}) => {
    try {
        const response = await fetch(`/api/payments/opay/initialize`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (result.success && result.cashierUrl) {
            window.location.href = result.cashierUrl;
            return { success: true };
        } else {
            throw new Error(result.error || 'Failed to initialize OPay checkout');
        }
    } catch (error: unknown) {
        console.error('OPay Checkout Error:', error);
        return {
            success: false,
            message: error instanceof Error ? error.message : "Could not connect to OPay gateway."
        };
    }
};
