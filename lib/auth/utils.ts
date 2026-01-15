/**
 * Normalizes user identifier (email or phone) to the internal system format.
 */
export function normalizeIdentifier(identifier: string): string {
    const trimmed = identifier.trim();

    // If it doesn't look like an email, treat as phone number
    if (!trimmed.includes('@')) {
        const cleanPhone = trimmed.replace(/\D/g, '');
        // We require at least some digits to avoid empty identifiers
        if (cleanPhone.length >= 5) {
            return `phone-${cleanPhone}@marketbridge.local`;
        }
    }

    return trimmed.toLowerCase();
}

/**
 * Checks if an identifier is potentially a system-generated phone email.
 */
export function isPhoneIdentifier(email: string): boolean {
    return email.startsWith('phone-') && email.endsWith('@marketbridge.local');
}
