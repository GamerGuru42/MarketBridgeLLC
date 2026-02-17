export const EXECUTIVE_CREDENTIALS = {
    // Mission Control (Technical & Ops)
    CTO: {
        name: 'Terumah',
        email: 'terumah@marketbridge.com.ng',
        role: 'technical_admin',
        default_access_code: 'MB-TECH-2024'
    },
    COO: {
        name: 'AbdulTareeq',
        email: 'abdultareeq@marketbridge.com.ng',
        role: 'operations_admin',
        default_access_code: 'MB-OPS-2024'
    },
    // Marketing Command
    CMO: {
        name: 'Adael',
        email: 'adael@marketbridge.com.ng',
        role: 'marketing_admin',
        default_access_code: 'MB-MKT-2024'
    },
    // Founder
    CEO: {
        role: 'ceo',
        default_access_code: 'MB-FOUNDER-99'
    }
} as const;
