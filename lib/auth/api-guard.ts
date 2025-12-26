import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * Higher-order function to protect API routes based on user role.
 */
export function withAuth(handler: Function, allowedRoles?: string[]) {
    return async (request: Request, ...args: any[]) => {
        const supabase = await createClient();
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user) {
            return NextResponse.json(
                { error: 'Unauthorized: Authentication required.' },
                { status: 401 }
            );
        }

        const role = user.user_metadata?.role || 'customer';

        if (allowedRoles && !allowedRoles.includes(role)) {
            return NextResponse.json(
                { error: `Forbidden: Role '${role}' lacks necessary permissions.` },
                { status: 403 }
            );
        }

        // Inject user into handler context if needed
        return handler(request, user, ...args);
    };
}
