import { createClient } from '@/lib/supabase/client';

export interface ChatMessage {
    id: string;
    conversation_id: string;
    sender_id: string;
    content: string;
    is_read: boolean;
    created_at: string;
}

export interface Conversation {
    id: string;
    participant1_id: string;
    participant2_id: string;
    listing_id?: string;
    last_message: string;
    last_message_at: string;
    other_user?: {
        display_name: string;
        avatar_url?: string;
    };
    listing_title?: string;
}

const supabase = createClient();

/**
 * Creates a new conversation or returns an existing one.
 */
export async function startConversation(currentUserId: string, otherUserId: string, listingId?: string) {
    if (!currentUserId || !otherUserId) throw new Error('Invalid participants');

    // Check for existing conversation initiated by current user
    const { data: initiated } = await supabase
        .from('conversations')
        .select('id')
        .eq('participant1_id', currentUserId)
        .eq('participant2_id', otherUserId)
        .eq(listingId ? 'listing_id' : 'listing_id', listingId || null);

    if (initiated && initiated.length > 0) return initiated[0].id;

    // Check for existing conversation initiated by other user
    const { data: received } = await supabase
        .from('conversations')
        .select('id')
        .eq('participant1_id', otherUserId)
        .eq('participant2_id', currentUserId)
        .eq(listingId ? 'listing_id' : 'listing_id', listingId || null);

    if (received && received.length > 0) return received[0].id;

    // Create new conversation
    const { data: newConv, error } = await supabase
        .from('conversations')
        .insert({
            participant1_id: currentUserId,
            participant2_id: otherUserId,
            listing_id: listingId || null,
            last_message: 'Started a new conversation',
            last_message_at: new Date().toISOString()
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating conversation:', error);
        throw error;
    }

    return newConv.id;
}

/**
 * Sends a message in a conversation.
 */
export async function sendMessage(conversationId: string, senderId: string, content: string) {
    if (!content.trim()) return null;

    const { data, error } = await supabase
        .from('messages')
        .insert({
            conversation_id: conversationId,
            sender_id: senderId,
            content: content
        })
        .select()
        .single();

    if (error) {
        console.error('Error sending message:', error);
        throw error;
    }

    return data;
}

/**
 * Marks messages as read.
 */
export async function markAsRead(conversationId: string, userId: string) {
    const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .neq('sender_id', userId) // Mark messages sent by others as read
        .eq('is_read', false);

    if (error) console.error('Error marking as read:', error);
}
