import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// POST /api/escrow/[id]/refund
export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: orderId } = await params;

        const { error } = await supabase
            .from('orders')
            .update({
                status: 'cancelled',
                updated_at: new Date().toISOString()
            })
            .eq('id', orderId);

        if (error) throw error;

        return NextResponse.json({
            success: true,
            message: 'Refund processed successfully'
        });
    } catch (error: unknown) {
        console.error('Refund Escrow Error:', error);
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
    }
}
