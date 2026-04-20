// Server-side API Route for Sage AI Chat — Powered by Gemini 2.0 Flash

import { streamText, tool } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

export const maxDuration = 60;

const SAGE_SYSTEM_PROMPT = `You are **Sage**, the friendly and helpful customer support assistant for MarketBridge — a secure campus marketplace for Nigerian university students.

PERSONALITY & COMMUNICATION STYLE:
- You are warm, friendly, confident, and extremely helpful. You are essentially the perfect customer support agent.
- CRITICAL RULE: ALWAYS use simple, standard, clear English. DO NOT use futuristic, overly complex, or robotic jargon. Be completely natural. Never use words like "Nexus", "Node", "Protocol", or "Terminal". Just speak like a polite, professional human.
- You are fluent in English AND Nigerian Pidgin. If the user types in Pidgin (e.g., "wetin dey happen", "how far", "I wan buy"), respond naturally in a Pidgin-English mix.
- Understand Nigerian slang ("japa", "sabi", "wahala", "oga", "no vex"), and gracefully handle typos ("pls", "hw mch", "whr"). Do not correct the user's spelling.
- Keep replies very short and concise (under 200 words), optimized for mobile text bubbles. 
- Use Markdown formatting: bold for emphasis and bullet points for quick lists.
- You are allowed to be funny or witty if the user cracks a joke.
- NEVER say "I'm just an AI" or "As a language model". Always find a way to help or escalate to human support using the escalateSupport tool.
- If a user just says "hi", say hello back warmly and ask how you can help. Don't dump a long feature list on them.

COMPLETE MARKETBRIDGE KNOWLEDGE BASE:

Navigation & Pages:
- Home (/) — Central dashboard with quick-access cards: Market, Sell, Orders, Chats.
- Marketplace (/marketplace) — Browse live listings. Filter by category (Food, Gadgets, Fashion, Services, Hair/Beauty, Electronics) and campus zone.
- Listing Detail (/listings/[id]) — Full product page with images, price, seller info, and "Start Chat" / "Buy Now" buttons.
- Seller Registration (/seller-onboard) — Students sign in with their school Google account (.edu.ng) to become verified sellers. Google Sign-In is the ONLY way to register as a seller. No OTP, no magic link, no manual email signup.
- Orders & Transactions (/settings/transactions) — Track all purchases and escrow progress.
- Chats (/chats) — All active conversations with buyers/sellers.
- Settings (/settings) — Profile, bank account, payout history, notifications.

The 7-Stage Escrow System:
1. Discover & List — Seller creates a listing with description, photos, asking price, and delivery options. Listings are tagged to a specific university.
2. Chat & Negotiate (InDrive-Style) — Inside chats, a negotiation panel opens. The buyer taps +₦100 or -₦100 buttons to adjust their offer price up or down. The seller sees a warning if the price reaches their Floor Price — the buyer cannot go below it. Either party can Accept, Reject, or Counter-Offer.
3. Lock the Deal & Set Terms — Both parties accept the final price. The Terms Builder captures: item condition guarantee, return policy, logistics responsibility, agreed delivery method (Campus Drop-Off, Self-Collection, or Partner Courier), and delivery timeline. All terms are locked and visible to both parties as a deal summary inside the chat.
4. Buyer Funds Escrow — Buyer checks out via Paystack. The full agreed amount including any logistics cost is held securely by MarketBridge. The seller is notified that funds are secured but not yet released.
5. Delivery — Seller dispatches the item via the agreed method. Both parties receive delivery status updates.
6. Buyer Confirms Receipt — Buyer inspects the item and clicks "Confirm Receipt". If the buyer forgets, funds auto-release after 24-48 hours. If there's a problem, the buyer raises a dispute.
7. Escrow Released — Funds are released to the seller's verified bank account via Paystack, minus the applicable fee. Both parties rate the transaction.

Escrow Fee Structure (Nigerian Naira):
- Tier 1 (₦1 to ₦100,000): 1.5% fee, capped at ₦1,500 maximum.
- Tier 2 (₦100,001 to ₦300,000): 2.5% fee plus ₦2,000 High-Value Protection Fee.
- No transaction above ₦300,000 is permitted.
- During Demo Mode, all transactions are capped at ₦5,000.

MarketCoins (MC):
- Earned automatically: 50 MC per ₦10,000 spent.
- 1 MC = ₦1 discount on future purchases.
- Balance shown in the app header.
- Brand Ambassadors receive 500 MC bonus on approval.

Campus System:
- Supported universities: Baze University, Nile University of Nigeria, Veritas University, and Cosmopolitan University.
- Every listing is tagged to a specific university at the point of creation.
- The marketplace defaults to showing listings from the user's campus first.
- Users can expand their search to view listings from other universities.

Seller Verification & Subscription:
- Sellers MUST sign in with Google using their school email (.edu.ng). This is the ONLY way to become a seller. No OTP, no magic link, no manual email registration.
- After Google Sign-In, the seller adds their bank details for payouts, then goes to their Merchant Center dashboard.
- Every new seller gets a 14-day free Standard trial after completing bank verification.
- Subscription plans: Basic (Free, 5 listings), Standard (₦1,500/month, unlimited listings + analytics), Pro (₦3,500/month, priority placement + featured badge + advanced analytics + priority support).
- If a seller does nothing after the trial, they are downgraded to Basic (5 listing cap).

Brand Ambassadors:
- Any verified seller from Baze, Nile, Veritas, or Cosmopolitan can apply for Ambassador status from their dashboard.
- Approved Ambassadors get a visible badge, free Pro plan for 44 days, and 500 MC bonus.
- After 44 days, they return to the normal subscription flow.
- Ambassadors recruit new sellers and promote MarketBridge on their campus.

Customer Support Flow:
- You (Sage) use simple, clear language. Speak like a helpful human, not a robot.
- You are the first line of support. Try to resolve ALL issues directly.
- If the issue requires human intervention (payment disputes, refund processing, account lockouts), use the escalateSupport tool.
- After escalation, an Operations team member joins the conversation.
- Users can also email: support@marketbridge.com.ng (Technical) or ops-support@marketbridge.com.ng (Operations).

Reviews & Trust:
- After every completed transaction, buyers can leave a 1-5 star review.
- Seller profiles display trust scores based on aggregated reviews.
- Highly rated sellers attract more buyers.

Safety Rules You Enforce:
- NEVER share personal phone numbers, WhatsApp links, or external payment methods.
- If you detect attempts to move transactions off-platform, warn the user firmly.
- Flag suspicious behavior patterns (external payment requests, harassment, scams).

TOOL USAGE GUIDELINES:
1. searchProducts — Use when users ask to find, browse, or look for any item. Be proactive.
2. getProductDetails — Use when they mention a specific product by name and want more info.
3. checkOrderStatus — Use when users ask about their order, delivery, or escrow stage.
4. escalateSupport — LAST RESORT. Try to help first. Only escalate when:
   a. User explicitly demands a human agent.
   b. Payment/refund issues you genuinely cannot resolve.
   c. User is frustrated after 2+ attempts to help.
   d. Account access/security issues.`;

export async function POST(req: Request) {
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
        return new Response(JSON.stringify({
            error: 'Sage AI is temporarily offline. The GOOGLE_GENERATIVE_AI_API_KEY is not configured.'
        }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    const { messages, isLoggedIn, userDisplayName } = await req.json();

    const contextualSystemPrompt = `
${SAGE_SYSTEM_PROMPT}

CURRENT CONTEXT:
- User Status: ${isLoggedIn ? 'Authenticated' : 'Guest/Visitor'}
- User Name: ${userDisplayName || 'Guest'}
${!isLoggedIn ? '- IMPORTANT: You are in "Guest Mode". You can answer marketplace questions and search for products, but you MUST NOT check orders, escrow details, or escalate to human support. Politely ask the guest to log in if they try to access these features.' : ''}
`;

    const primaryModel = 'gemini-2.0-flash';
    const fallbackModel = 'gemini-2.0-flash';

    async function runChat(modelId: string) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        return streamText({
            // @ts-ignore
            model: google(modelId),
            system: contextualSystemPrompt,
            messages,
            tools: {
                searchProducts: tool({
                    description: 'Search for products available in the MarketBridge marketplace. Use this whenever a user wants to find, browse, buy, or look for any item, product, or service.',
                    parameters: z.object({
                        query: z.string().describe('The search query, category name, or product keyword'),
                    }),
                    execute: async ({ query }) => {
                        try {
                            const supabase = await createClient();
                            const { data, error } = await supabase
                                .from('listings')
                                .select('id, title, price, category, location, images, description')
                                .eq('status', 'active')
                                .or(`title.ilike.%${query}%,category.ilike.%${query}%,description.ilike.%${query}%`)
                                .order('created_at', { ascending: false })
                                .limit(5);

                            if (error) throw error;

                            return (data || []).map(p => ({
                                id: p.id,
                                title: p.title,
                                price: p.price,
                                category: p.category,
                                location: p.location,
                                image: p.images?.[0] || null,
                            }));
                        } catch (err) {
                            console.error('Product search error:', err);
                            return [];
                        }
                    },
                }),
                getProductDetails: tool({
                    description: 'Get full details about a specific product by name. Only use when the user has mentioned a specific product they want more information about.',
                    parameters: z.object({
                        productName: z.string().describe('The exact or partial name of the product'),
                    }),
                    execute: async ({ productName }) => {
                        try {
                            const supabase = await createClient();
                            const { data, error } = await supabase
                                .from('listings')
                                .select('id, title, price, category, location, images, description')
                                .eq('status', 'active')
                                .ilike('title', `%${productName}%`)
                                .limit(1)
                                .single();

                            if (error || !data) return null;

                            return {
                                id: data.id,
                                title: data.title,
                                price: data.price,
                                category: data.category,
                                location: data.location,
                                image: data.images?.[0] || null,
                                description: data.description
                            };
                        } catch (err) {
                            console.error('Product detail fetch error:', err);
                            return null;
                        }
                    }
                }),
                checkOrderStatus: tool({
                    description: 'Check the status of a user\'s recent escrow agreements/orders. Use when users ask about their order, delivery status, or payment.',
                    parameters: z.object({
                        userQuery: z.string().describe('What the user is asking about their order'),
                    }),
                    execute: async ({ userQuery }) => {
                        if (!isLoggedIn) {
                            return { found: false, message: 'Authentication required. Please log in to check your order status.', needsLogin: true };
                        }
                        try {
                            const supabase = await createClient();
                            const { data, error } = await supabase
                                .from('escrow_agreements')
                                .select('id, status, amount, created_at, listing:listings(title)')
                                .order('created_at', { ascending: false })
                                .limit(3);

                            if (error || !data || data.length === 0) {
                                return { found: false, message: 'No recent orders found. Check /settings/transactions for full history.', query: userQuery };
                            }

                            return {
                                found: true,
                                orders: data.map(o => ({
                                    id: o.id,
                                    status: o.status,
                                    amount: o.amount,
                                    item: (o as Record<string, unknown>).listing ? ((o as Record<string, unknown>).listing as Record<string, unknown>)?.title || 'Unknown Item' : 'Unknown Item',
                                    date: o.created_at,
                                })),
                                tip: 'Direct the user to /settings/transactions for full details.'
                            };
                        } catch (err) {
                            console.error('Order check error:', err);
                            return { found: false, message: 'Could not retrieve order information.' };
                        }
                    }
                }),
                escalateSupport: tool({
                    description: 'Create a real support ticket and escalate to the human Operations team. ONLY use this as a last resort.',
                    parameters: z.object({
                        issueArea: z.enum(['technical', 'operations']).describe('technical = app bug/error, operations = payment/refund/account issue'),
                        description: z.string().describe('Clear summary of the issue in 1-2 sentences'),
                        userId: z.string().optional().describe('The user ID if available from context'),
                    }),
                    execute: async ({ issueArea, description, userId }) => {
                        if (!isLoggedIn) {
                            return { 
                                status: 'denied', 
                                message: 'Authentication required to escalate support. Please log in first.',
                                needsLogin: true 
                            };
                        }
                        try {
                            const supabase = await createClient();
                            const ticketCode = `${issueArea.toUpperCase().substring(0, 3)}-${Math.floor(Math.random() * 100000)}`;

                            const { data: ticket, error: ticketError } = await supabase
                                .from('support_tickets')
                                .insert({
                                    user_id: userId || null,
                                    status: 'escalated',
                                    priority: issueArea === 'technical' ? 'high' : 'medium',
                                })
                                .select()
                                .single();

                            if (ticketError) {
                                console.error('Ticket creation error:', ticketError);
                                return {
                                    ticketId: ticketCode,
                                    status: 'escalated',
                                    department: issueArea,
                                    description,
                                    note: 'Ticket logged manually. Our team will contact you.'
                                };
                            }

                            await supabase.from('support_messages').insert({
                                ticket_id: ticket.id,
                                sender_id: 'SYSTEM_AI',
                                sender_type: 'ai',
                                content: `[Sage AI Escalation] ${description}`,
                            });

                            return {
                                ticketId: ticket.id,
                                status: 'escalated',
                                department: issueArea,
                                description,
                                note: 'Your ticket has been created. An agent will join this chat shortly.'
                            };
                        } catch (err) {
                            return { status: 'error', message: 'Failed to create ticket. Please contact support@marketbridge.com.ng directly.' };
                        }
                    }
                })
            },
        });
    }

    try {
        const result = await runChat(primaryModel);
        // @ts-ignore
        return result.toDataStreamResponse();
    } catch (primaryError) {
        console.error(`Primary model (${primaryModel}) failed, falling back:`, primaryError);
        try {
            const fallbackResult = await runChat(fallbackModel);
            // @ts-ignore
            return fallbackResult.toDataStreamResponse();
        } catch (fallbackError) {
            console.error('Fallback model also failed:', fallbackError);
            return new Response(JSON.stringify({
                error: 'Sage is experiencing heavy traffic right now. Please try again in a moment.'
            }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            });
        }
    }
}
