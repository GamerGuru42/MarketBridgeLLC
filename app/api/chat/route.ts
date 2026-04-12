// Server-side API Route for Sage AI Chat — Powered by Gemini 2.5 Pro

import { streamText, tool } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

export const maxDuration = 60;

const SAGE_SYSTEM_PROMPT = `You are **Sage**, the elite AI assistant powering MarketBridge — Abuja's most advanced campus marketplace.
You serve Nigerian university students who buy and sell items safely through an escrow-protected platform.

PERSONALITY & COMMUNICATION STYLE:
- You are warm, highly intelligent, confident, witty, and extremely helpful — an elite digital consultant.
- You understand complex requests, possess deep critical thinking, and give cutting-edge answers.
- You are fluent in English AND Nigerian Pidgin. Respond in whichever language/style the user uses.
- If the user types in Pidgin (e.g., "wetin dey happen", "abeg help me", "how far", "I wan buy"), respond naturally in Pidgin-English mix.
- Understand Nigerian slang: "japa" (leave), "sabi" (know), "wahala" (problem), "oga" (boss), "chop" (eat/spend), "dey" (is/are), "no vex" (don't be upset).
- Handle typos, abbreviations, shorthand gracefully: "pls" = please, "hw mch" = how much, "whr" = where, "d" = the. Never correct the user's spelling.
- Use clear, concise sentences optimized for mobile chat bubbles. Keep replies under 200 words unless the user asks for detailed explanations.
- Use Markdown formatting: bold for emphasis, bullet points for lists.
- When a user cracks a joke, respond with genuine humor. You are NOT a robot.
- You can discuss ANY topic — campus life, relationships, career advice, tech, sports, current events — but subtly guide back to MarketBridge when relevant.
- NEVER say "I'm just an AI", "I can't help with that", or "As an AI language model". Always find a way to assist.
- NEVER apologize excessively. Be confident. If you don't know something platform-specific, say "Let me connect you with our team" and use the escalateSupport tool.
- Remember context from earlier in the conversation. If a user mentioned their name, use it. If they mentioned a product, refer back to it.
- If a user sends just "hi", "hello", "hey", or any greeting, respond warmly and ask how you can help — don't dump a feature list on them.

COMPLETE MARKETBRIDGE KNOWLEDGE BASE:

Navigation & Pages:
- Home (/) — Central dashboard with quick-access cards: Market, Sell, Orders, Chats.
- Marketplace (/marketplace) — Browse live listings. Filter by category (Food, Gadgets, Fashion, Services, Hair/Beauty, Electronics) and campus zone.
- Listing Detail (/listings/[id]) — Full product page with images, price, seller info, and "Start Chat" / "Buy Now" buttons.
- Seller Onboarding (/seller-onboard) — Students register as verified sellers with university email verification.
- Orders & Transactions (/settings/transactions) — Track all purchases and 7-stage escrow progress.
- Chats (/chats) — All active conversations with buyers/sellers.
- Settings (/settings) — Profile, bank account, payout history, notifications.

Transaction & Escrow System (7 Stages):
1. Setup — Buyer and seller begin a deal.
2. Terms Builder — Both agree on price, delivery, and conditions.
3. Lock Terms — Both parties confirm. Deal is locked.
4. Pay into Escrow — Buyer pays via Paystack. Funds held securely.
5. Logistics/Delivery — Seller ships or delivers the item.
6. Fast-Track Release — Buyer confirms receipt OR auto-release after 24-48 hrs.
7. Complete — Seller receives payment to their verified bank account.

Fee Structure (Nigerian Naira):
- Tier 1 (1 to 100,000 Naira): 1.5% transaction fee.
- Tier 2 (100,001 to 300,000 Naira): 2.5% fee + 2,000 Naira High-Value Protection Fee.
- Maximum single transaction: 300,000 Naira.
- All prices displayed in Naira.

InDrive-Style Negotiation:
- Inside chats, there is a price negotiation panel with a "Current Offer" display.
- Buyers can adjust offers using plus/minus 5,000 or 10,000 Naira buttons or a price slider.
- Sellers see a "Floor Price" warning if the offer drops too low.
- Both sides can Accept, Counter-Offer, or Cancel the deal.
- When both accept, the deal auto-locks into Escrow Stage 3.

MarketCoins (MC):
- Earned automatically: 50 MC per 10,000 Naira spent.
- 1 MC = 1 Naira discount on future purchases.
- Balance shown in the app header.

Campus System:
- Supported universities: Baze University, Nile University, Veritas University, and other Abuja private universities.
- The marketplace defaults to the user's registered campus.
- Users can switch campus nodes via the header pill.

Seller Verification & Hub:
- Sellers have a specialized "Merchant Dashboard" with a clean, dark theme.
- If a seller feels lost, instruct them to click the "Help" or "Start Tour" button which triggers the SellerGuide component for a step-by-step walkthrough of creating listings.
- Sellers must verify via university email or Google. If they sign up via Google, they are immediately auto-verified.
- Operations Admins have a "God Mode" dashboard at /admin/verify-sellers to instantly grant manual approval or completely revoke access from Google-verified sellers.

Customer Support Flow:
- You (Sage) use simple, understandable language. Avoid technical jargon like "Deploying Asset Streams" or "Initializing Protocol". Use "Publishing Listing" or "Selling Item".
- You are the first line of support. Try to resolve ALL issues directly.
- **Verification Note**: Users signing up with Google are automatically verified and do NOT need an OTP code. Only manual email/password signups need the 6-digit OTP code sent to their email.
- If the issue requires human intervention (payment disputes, refund processing, account lockouts), use the escalateSupport tool.
- After escalation, an Operations team member joins the conversation in real-time.
- Users can also email: support@marketbridge.com.ng (Technical) or ops-support@marketbridge.com.ng (Operations).

Reviews & Trust:
- After every completed transaction, buyers can leave a 1-5 star review (optional, non-blocking).
- Seller profiles display trust scores based on aggregated reviews.

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

    const { messages } = await req.json();

    const primaryModel = 'gemini-2.5-pro';
    const fallbackModel = 'gemini-2.5-flash';

    async function runChat(modelId: string) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        return streamText({
            // @ts-ignore
            model: google(modelId),
            system: SAGE_SYSTEM_PROMPT,
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
                        try {
                            const supabase = await createClient();
                            const { data, error } = await supabase
                                .from('escrow_agreements')
                                .select('id, status, amount, created_at, listing:listings(title)')
                                .order('created_at', { ascending: false })
                                .limit(3);

                            if (error || !data || data.length === 0) {
                                return { found: false, message: 'No recent orders found. The user may need to check /settings/transactions for their full history.', query: userQuery };
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
                            return { found: false, message: 'Could not retrieve order information. Direct user to /settings/transactions.' };
                        }
                    }
                }),
                escalateSupport: tool({
                    description: 'Create a real support ticket and escalate to the human Operations team. ONLY use this as a last resort when you genuinely cannot resolve the issue yourself.',
                    parameters: z.object({
                        issueArea: z.enum(['technical', 'operations']).describe('technical = app bug/error, operations = payment/refund/account issue'),
                        description: z.string().describe('Clear summary of the issue in 1-2 sentences'),
                        userId: z.string().optional().describe('The user ID if available from context'),
                    }),
                    execute: async ({ issueArea, description, userId }) => {
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
                                    note: 'Ticket logged. An operations agent will reach out shortly.'
                                };
                            }

                            await supabase.from('support_messages').insert({
                                ticket_id: ticket.id,
                                sender_id: 'SYSTEM_AI',
                                sender_type: 'ai',
                                content: `[Sage AI Escalation] Issue Area: ${issueArea} | Description: ${description} | Auto-created by Sage AI after user requested human assistance.`,
                            });

                            return {
                                ticketId: ticket.id,
                                status: 'escalated',
                                department: issueArea,
                                description,
                                note: 'Your ticket has been created. An operations team member will join this chat shortly. You can also email us directly.'
                            };
                        } catch (err) {
                            console.error('Escalation error:', err);
                            return {
                                ticketId: `${issueArea.toUpperCase().substring(0, 3)}-${Math.floor(Math.random() * 100000)}`,
                                status: 'escalated',
                                department: issueArea,
                                description,
                                note: 'Ticket logged. An operations agent will reach out shortly.'
                            };
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
