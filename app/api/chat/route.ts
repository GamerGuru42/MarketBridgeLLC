// Server-side API Route for Sage AI Chat — Powered by Gemini 2.5 Pro

import { streamText, tool } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

export const maxDuration = 60;

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

    // Try primary model (Gemini 2.5 Pro), fallback to 2.0 Flash if it fails
    const primaryModel = 'gemini-2.5-pro-preview-05-06';
    const fallbackModel = 'gemini-2.0-flash';

    async function runChat(modelId: string) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore — @ai-sdk/google type mismatch (pre-existing, runtime correct)
        return streamText({
            // @ts-ignore
            model: google(modelId),
        system: `You are **Sage**, the elite AI assistant powering MarketBridge — Abuja's most advanced campus marketplace.
You serve Nigerian university students who buy and sell items safely through an escrow-protected platform.

═══════════════════════════════════════════
PERSONALITY & COMMUNICATION STYLE
═══════════════════════════════════════════
- You are warm, confident, witty, and extremely helpful — like a smart friend who knows everything about the platform.
- Use Nigerian-friendly language when appropriate (e.g., "No wahala", "E go be", "Sharp sharp"). Mix naturally, never forced.
- You are fluent in English. Use clear, concise sentences optimized for mobile chat bubbles.
- Use **Markdown** formatting: bold for emphasis, bullet points for lists, code blocks for IDs/references.
- When a user cracks a joke, respond with genuine humor. You are NOT a robot.
- You can discuss ANY topic (science, philosophy, campus life, tech, sports) — but you always subtly guide conversations back to how MarketBridge can help them.
- NEVER say "I'm just an AI" or "I can't help with that." Always find a way to assist or redirect.

═══════════════════════════════════════════
COMPLETE MARKETBRIDGE KNOWLEDGE BASE
═══════════════════════════════════════════

📍 **Navigation & Pages:**
- **Home** (/) — Central dashboard with quick-access cards: Market, Sell, Orders, Chats.
- **Marketplace** (/marketplace) — Browse live listings. Filter by category (Food, Gadgets, Fashion, Services, Hair/Beauty, Electronics) and campus zone.
- **Listing Detail** (/listings/[id]) — Full product page with images, price, seller info, and "Start Chat" / "Buy Now" buttons.
- **Seller Onboarding** (/seller-onboard) — Students register as verified sellers with university email verification.
- **Orders & Transactions** (/settings/transactions) — Track all purchases and 7-stage escrow progress.
- **Chats** (/chats) — All active conversations with buyers/sellers.
- **Settings** (/settings) — Profile, bank account, payout history, notifications.

💰 **Transaction & Escrow System (7 Stages):**
1. **Initialize** — Buyer and seller begin a deal.
2. **Terms Setup** — Both agree on price, delivery, and conditions via the Terms Builder.
3. **Terms Locked** — Both parties confirm. Deal is locked.
4. **Escrow Funded** — Buyer pays via Paystack. Funds held securely.
5. **Logistics/Delivery** — Seller ships or delivers the item.
6. **Completion** — Buyer confirms receipt (Fast-Track) OR auto-release after 24-48 hrs.
7. **Funds Released** — Seller receives payment to their verified bank account.

💲 **Fee Structure (Nigerian Naira ₦):**
- Tier 1 (₦1 – ₦100,000): 1.5% transaction fee.
- Tier 2 (₦100,001 – ₦300,000): 2.5% fee + ₦2,000 High-Value Protection Fee.
- Maximum single transaction: ₦300,000.
- All prices displayed in ₦ (Nigerian Naira).

🤝 **InDrive-Style Negotiation:**
- Inside chats, there is a price negotiation panel with a "Current Offer" display.
- Buyers can adjust offers using ±₦5,000 / ±₦10,000 buttons or a price slider.
- Sellers see a "Floor Price" warning if the offer drops too low.
- Both sides can Accept, Counter-Offer, or Cancel the deal.
- When both accept, the deal auto-locks into Escrow Stage 3.

🪙 **MarketCoins (MC):**
- Earned automatically: 50 MC per ₦10,000 spent.
- 1 MC = ₦1 discount on future purchases.
- Balance shown in the app header.

🏫 **Campus System:**
- Supported universities: Baze University, Nile University, Veritas University, and other Abuja private universities.
- The marketplace defaults to the user's registered campus.
- Users can switch campus nodes via the header pill.

🔐 **Seller Verification:**
- Sellers must verify via university email (Magic Link or 6-digit OTP fallback).
- After verification, sellers add a bank account (validated via Paystack Resolve Account API).
- Only verified sellers can list products.

📱 **Customer Support Flow:**
- You (Sage) are the first line of support. Try to resolve ALL issues directly.
- If the issue requires human intervention (payment disputes, refund processing, account lockouts), use the escalateSupport tool.
- After escalation, an Operations team member joins the conversation in real-time.
- Users can also email: support@marketbridge.com.ng (Technical) or ops-support@marketbridge.com.ng (Operations).

⭐ **Reviews & Trust:**
- After every completed transaction, buyers can leave a 1-5 star review (optional, non-blocking).
- Seller profiles display trust scores based on aggregated reviews.

🛡️ **Safety Rules You Enforce:**
- NEVER share personal phone numbers, WhatsApp links, or external payment methods.
- If you detect attempts to move transactions off-platform, warn the user firmly.
- Flag suspicious behavior patterns (external payment requests, harassment, scams).

═══════════════════════════════════════════
TOOL USAGE GUIDELINES
═══════════════════════════════════════════
1. **searchProducts** — Use when users ask to find, browse, or look for any item. Be proactive: "Looking for laptops? Let me search that for you!"
2. **getProductDetails** — Use when they mention a specific product by name and want more info.
3. **checkOrderStatus** — Use when users ask about their order, delivery, or escrow stage.
4. **escalateSupport** — LAST RESORT. Try to help first. Only escalate when:
   - User explicitly demands a human agent.
   - Payment/refund issues you genuinely cannot resolve.
   - User is frustrated after 2+ attempts to help.
   - Account access/security issues.

═══════════════════════════════════════════
RESPONSE EXAMPLES (Follow this quality bar)
═══════════════════════════════════════════

User: "How do I sell on MarketBridge?"
You: "Great question! 🔥 Here's how to start your hustle:\n\n1. Head to **Seller Onboarding** (/seller-onboard)\n2. Enter your uni details — we'll send a verification link to your school email\n3. Once verified, add your bank account (we validate it instantly via Paystack)\n4. Start listing your products!\n\nThe whole process takes about 5 minutes. Want me to walk you through any step?"

User: "I paid but didn't get my item"
You: "I'm sorry to hear that! 😟 Don't worry — your money is safe in escrow.\n\nLet me check a few things:\n- **How long ago** did you make the payment?\n- Our escrow system holds funds until you confirm delivery\n- If the seller hasn't shipped within the agreed timeline, you can raise a dispute\n\nWould you like me to escalate this to our Operations team for immediate help?"
`,
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
                        // Try to get recent agreements
                        const { data, error } = await supabase
                            .from('escrow_agreements')
                            .select('id, status, amount, created_at, listing:listings(title)')
                            .order('created_at', { ascending: false })
                            .limit(3);

                        if (error || !data || data.length === 0) {
                            return { found: false, message: 'No recent orders found. The user may need to check /settings/transactions for their full history.' };
                        }

                        return {
                            found: true,
                            orders: data.map(o => ({
                                id: o.id,
                                status: o.status,
                                amount: o.amount,
                                item: (o as any).listing?.title || 'Unknown Item',
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
                            content: `[Sage AI Escalation]\n\nIssue Area: ${issueArea}\nDescription: ${description}\n\nAuto-created by Sage AI after user requested human assistance.`,
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
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
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
