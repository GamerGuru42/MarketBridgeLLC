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

/**
 * Strict Input Sanitization to strip potential XSS and SQL injection patterns.
 * Designed to clean inputs before transmission to database.
 */
export function sanitizeInput(input: string): string {
    if (!input) return '';
    let sanitized = input.trim();
    
    // Strip common script injection tags
    sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
    sanitized = sanitized.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "");
    
    // Strip inline event handlers (onerror, onload, alert)
    sanitized = sanitized.replace(/on\w+\s*=/gi, "");
    sanitized = sanitized.replace(/javascript:/gi, "");
    
    // Convert critical HTML entities to prevent basic DOM manipulation
    const map: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        "/": '&#x2F;',
    };
    
    return sanitized.replace(/[&<>"'/]/g, (match) => map[match]);
}
