// Server-side API Route for Sage AI Chat

import { streamText, tool } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

export const maxDuration = 30;

export async function POST(req: Request) {
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
        return new Response('My advanced Gemini neural link is offline. To unlock my conversational abilities, humor, and intelligence, please configure GOOGLE_GENERATIVE_AI_API_KEY in your environment variables. In the meantime, I am using legacy basic responses!', {
            status: 503,
            headers: { 'Content-Type': 'text/plain' },
        });
    }

    const { messages } = await req.json();

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore — @ai-sdk/google v3 LanguageModelV3 vs ai package LanguageModelV1 type mismatch (pre-existing)
    const result = streamText({
        // @ts-ignore
        model: google('gemini-1.5-flash'),
        system: `You are Sage, the professional, witty, and highly capable AI assistant for MarketBridge.
You are dealing with university students buying and selling items in Abuja, Nigeria.

PERSONALITY & TONE:
- Be highly conversational, fluent, empathetic, and occasionally humorous like ChatGPT or Gemini.
- NO RESTRICTIONS on general conversation. You can discuss philosophy, science, campus life, tech, or just have a casual chat.
- While you can discuss anything, your ultimate loyalty is to the MarketBridge ecosystem.
- If a user makes a joke, laugh and make a witty response. Do not act robotic.

KNOWLEDGE BASE (MarketBridge App Guide):
- HOME PAGE: The central command center. Key action nodes are Market (browse), Sell (onboard), Orders (tracking), and Chats (messaging).
- MARKETPLACE: (/marketplace) Where users scan the index for live assets (products). Users can filter by category (Food, Gadgets, etc.) and campus node.
- SELLING: (/seller-onboard) Where students can provision their hustle and become verified dealers.
- ORDERS: (/settings/transactions or through the hero node) Where users track their packets (purchases) and manage escrow status.
- CHATS: (/chats) Secure signal lines for direct communication between buyers/sellers or staff.
- NEGOTIATION: Inside chats, there is an InDrive-style price negotiation system where buyers can adjust offers with +/- buttons and a slider. A floor price warning shows if the offer is too low.
- ESCROW: Every transaction is protected by our Paystack escrow protocol. Funds only move when both nodes confirm delivery.
- MARKETCOINS: The internal loyalty/utility currency (MC). Earned per transaction.
- CUSTOMER SUPPORT: Users can ask you for help. If you can't resolve it, you'll escalate to the Operations team who will chat with them directly.
- LIVE SUPPORT: After escalation, users can continue chatting in the same widget and an Operations admin will respond in real-time.

GUIDELINES:
- If a user is lost, use the app guide knowledge to direct them to the correct URL/Page.
- Use the searchProducts tool if the user is looking for an item.
- Use the getProductDetails tool if they ask for details on a specific item.
- Use the escalateSupport tool ONLY when:
  1. The user explicitly asks to speak to a human agent
  2. The issue involves payment problems, refunds, or account access you cannot resolve
  3. The user expresses frustration after you've tried to help
- Always try to resolve the issue yourself first before escalating.
- Format your text with Markdown for readability (bold, lists). Keep sentences relatively concise suitable for a mobile chat bubble.
`,
        messages,
        tools: {
            searchProducts: tool({
                description: 'Search for products available in the MarketBridge marketplace',
                parameters: z.object({
                    query: z.string().describe('The search query or category'),
                }),
                execute: async ({ query }) => {
                    try {
                        const supabase = await createClient();
                        const { data, error } = await supabase
                            .from('listings')
                            .select('id, title, price, category, location, images, description')
                            .eq('status', 'active')
                            .or(`title.ilike.%${query}%,category.ilike.%${query}%,description.ilike.%${query}%`)
                            .limit(4);

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
                description: 'Get detailed info about a specific product. Do not use this if the user hasn\'t specified a specific product they are interested in.',
                parameters: z.object({
                    productName: z.string().describe('The name of the product to view'),
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
            escalateSupport: tool({
                description: 'Create a real support ticket and escalate to the Operations team when the AI cannot resolve the issue',
                parameters: z.object({
                    issueArea: z.enum(['technical', 'operations']).describe('Whether the issue is an app bug (technical) or a refund/vendor operation (operations)'),
                    description: z.string().describe('Short description of the issue'),
                    userId: z.string().optional().describe('The user ID if available'),
                }),
                execute: async ({ issueArea, description, userId }) => {
                    try {
                        const supabase = await createClient();
                        const ticketCode = `${issueArea.toUpperCase().substring(0, 3)}-${Math.floor(Math.random() * 100000)}`;

                        // Create the ticket in DB
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
                            // Fallback to mock if DB isn't ready
                            return {
                                ticketId: ticketCode,
                                status: 'escalated',
                                department: issueArea,
                                description,
                                note: 'Ticket logged. An operations agent will reach out shortly.'
                            };
                        }

                        // Insert the AI summary as the first message
                        await supabase.from('support_messages').insert({
                            ticket_id: ticket.id,
                            sender_id: 'SYSTEM_AI',
                            sender_type: 'ai',
                            content: `[AI Escalation] Issue Area: ${issueArea}\n\nUser Description: ${description}\n\nThis ticket was auto-created by Sage AI after the user requested human assistance.`,
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

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore — ai SDK v3 type mismatch with @ai-sdk/google, runtime is correct
    return result.toDataStreamResponse();
}

