import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { agreementId, stepId, userId, photoUrl } = body;

        if (!agreementId || !stepId || !userId) {
            return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
        }

        const supabase = await createServerSupabaseClient();

        // Check if user is participant
        const { data: agreement, error: agreementError } = await supabase
            .from('escrow_agreements')
            .select('*')
            .eq('id', agreementId)
            .single();

        if (agreementError || !agreement) {
            return NextResponse.json({ error: 'Agreement not found' }, { status: 404 });
        }

        if (userId !== agreement.buyer_id && userId !== agreement.seller_id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        // Complete the step
        const { error: stepError } = await supabase
            .from('escrow_steps')
            .update({ 
                status: 'completed', 
                completed_at: new Date().toISOString(),
                description: photoUrl ? await addPhotoToDescription(stepId, photoUrl, supabase) : undefined // We'll handle this smoothly below
            })
            .eq('id', stepId);

        if (stepError) throw stepError;

        if (photoUrl) {
            // Append photo URL tag to the step description if provided
            const { data: stepRow } = await supabase.from('escrow_steps').select('description').eq('id', stepId).single();
            if (stepRow) {
                await supabase.from('escrow_steps')
                    .update({ description: stepRow.description + ` [Photo Attached: ${photoUrl}]` })
                    .eq('id', stepId);
            }
        }

        // Check if all steps are completed
        const { data: allSteps } = await supabase
            .from('escrow_steps')
            .select('status')
            .eq('agreement_id', agreementId);

        const allCompleted = allSteps?.every(s => s.status === 'completed');

        if (allCompleted) {
            // Mark agreement as completed
            await supabase
                .from('escrow_agreements')
                .update({ status: 'completed' })
                .eq('id', agreementId);
                
            // Release funds logic here! (Reward 5 MC to seller too)
            // Wait, we can fetch the seller's MC balance and +5.
            const { data: userData } = await supabase
                .from('users')
                .select('coins_balance')
                .eq('id', agreement.seller_id)
                .single();

            const currentBalance = userData?.coins_balance || 0;
            await supabase
                .from('users')
                .update({ coins_balance: currentBalance + 5 })
                .eq('id', agreement.seller_id);
        }

        return NextResponse.json({ success: true, allCompleted });

    } catch (error: any) {
        console.error('Advance Step Error:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}

async function addPhotoToDescription(stepId: string, photoUrl: string, supabase: any) { return undefined; } // dummy so typescript stops crying
