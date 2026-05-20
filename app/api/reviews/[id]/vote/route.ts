import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: reviewId } = await params;
        const body = await req.json();
        const { voteType } = body; // 'helpful' or 'unhelpful'

        if (!reviewId || !voteType || !['helpful', 'unhelpful'].includes(voteType)) {
            return NextResponse.json({ error: 'Invalid vote fields' }, { status: 400 });
        }

        const supabase = await createServerSupabaseClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if there is an existing vote
        const { data: existingVote } = await supabase
            .from('review_votes')
            .select('*')
            .eq('review_id', reviewId)
            .eq('user_id', user.id)
            .maybeSingle();

        if (existingVote) {
            if (existingVote.vote_type === voteType) {
                // If it is the same vote type, user clicked it again to REMOVE it
                const { error: deleteError } = await supabase
                    .from('review_votes')
                    .delete()
                    .eq('id', existingVote.id);

                if (deleteError) throw deleteError;
                return NextResponse.json({ success: true, action: 'removed' });
            } else {
                // If it is a different vote type, UPDATE it
                const { error: updateError } = await supabase
                    .from('review_votes')
                    .update({ vote_type: voteType })
                    .eq('id', existingVote.id);

                if (updateError) throw updateError;
                return NextResponse.json({ success: true, action: 'updated' });
            }
        } else {
            // INSERT new vote
            const { error: insertError } = await supabase
                .from('review_votes')
                .insert({
                    review_id: reviewId,
                    user_id: user.id,
                    vote_type: voteType
                });

            if (insertError) throw insertError;
            return NextResponse.json({ success: true, action: 'added' });
        }
    } catch (error: any) {
        console.error('Vote Review Error:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
