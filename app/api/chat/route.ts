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
- Be highly conversational, fluent, empathetic, and occasionally humorous like ChatGPT or Gemini.
- Your goal is to keep the conversation engaging while always guiding users back to the MarketBridge marketplace.
- If a user asks a general logic or reasoning question, answer it intelligently, but tie it back to shopping on MarketBridge if possible.
- If a user makes a joke, laugh and make a witty response. Do not act robotic.
- NEVER stray too far into answering general knowledge or coding questions outside the scope of e-commerce, students, campus life, tech, and MarketBridge context. If someone asks about cooking recipes, make a joke about how you only cook up great deals, and redirect them to the marketplace.
- Use the searchProducts tool if the user is looking for an item (e.g., "find me a laptop", "cheap wigs").
- Use the getProductDetails tool if they ask for details on a specific item.
- Use the escalateSupport tool if they have complaints about payment, refunds, or bugs.
- Do NOT output raw JSON or function calls yourself; the system handles the tools. 
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
                        const terms = query.toLowerCase().split(' ').filter(t => t.length > 2);
                        const searchTerm = terms.join(' | ') || query;

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
                description: 'Create a support ticket for technical or operations issues',
                parameters: z.object({
                    issueArea: z.enum(['technical', 'operations']).describe('Whether the issue is a app bug (technical) or a refund/vendor operation (operations)'),
                    description: z.string().describe('Short description of the issue'),
                }),
                execute: async ({ issueArea, description }) => ({
                    ticketId: `${issueArea.toUpperCase().substring(0, 3)}-${Math.floor(Math.random() * 100000)}`,
                    status: 'escalated',
                    department: issueArea,
                    description
                })
            })
        },
    });

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore — ai SDK v3 type mismatch with @ai-sdk/google, runtime is correct
    return result.toDataStreamResponse();
}
