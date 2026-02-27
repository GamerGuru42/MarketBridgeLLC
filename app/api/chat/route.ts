import { streamText, tool } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';
import { COMPREHENSIVE_MOCK_LISTINGS } from '@/lib/mockData';

export const maxDuration = 30;

export async function POST(req: Request) {
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
        return new Response('My advanced Gemini neural link is offline. To unlock my conversational abilities, humor, and intelligence, please configure GOOGLE_GENERATIVE_AI_API_KEY in your environment variables. In the meantime, I am using legacy basic responses!', {
            status: 503,
            headers: { 'Content-Type': 'text/plain' },
        });
    }

    const { messages } = await req.json();

    const result = streamText({
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
                    const terms = query.toLowerCase().split(' ').filter(t => t.length > 2);
                    const results = COMPREHENSIVE_MOCK_LISTINGS.filter(p => {
                        const text = `${p.title} ${p.category} ${p.description}`.toLowerCase();
                        return terms.some(t => text.includes(t)) || query.toLowerCase() === p.category.toLowerCase();
                    }).map(p => ({
                        id: p._id,
                        title: p.title,
                        price: p.price,
                        category: p.category,
                        location: p.location,
                        image: p.images[0] || null,
                    })).slice(0, 4);

                    return results;
                },
            }),
            getProductDetails: tool({
                description: 'Get detailed info about a specific product. Do not use this if the user hasn\'t specified a specific product they are interested in.',
                parameters: z.object({
                    productName: z.string().describe('The name of the product to view'),
                }),
                execute: async ({ productName }) => {
                    const p = COMPREHENSIVE_MOCK_LISTINGS.find(p => p.title.toLowerCase().includes(productName.toLowerCase()));
                    if (!p) return null;
                    return {
                        id: p._id,
                        title: p.title,
                        price: p.price,
                        category: p.category,
                        location: p.location,
                        image: p.images[0] || null,
                        description: p.description
                    };
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

    return result.toDataStreamResponse();
}
