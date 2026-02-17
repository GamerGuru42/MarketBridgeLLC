
// This "Brain" simulates a conversational AI with improved context retention and intent recognition.
// Updated: 2026-02-16 (Production Metadata Sync)

type MessageRole = 'user' | 'assistant' | 'system';

export interface SearchResult {
    id: string;
    title: string;
    price: number;
    category: string;
    location: string;
    image?: string;
    keywords: string[];
    description?: string;
}

export interface AiResponse {
    content: string;
    searchResults?: SearchResult[];
    productDetail?: SearchResult; // For showing a specific single item
    action?: 'escalate_tech' | 'escalate_ops' | 'search' | 'none';
}

interface ConversationContext {
    userName?: string;
    lastTopic?: string;
    awaitingInputFor?: string; // e.g., 'name', 'search_query'
    recentSearchResults?: SearchResult[]; // To remember what we just showed
}

import { COMPREHENSIVE_MOCK_LISTINGS } from './mockData';

// Extended Product Database - SYNCED WITH LISTING PAGE MOCK DATA
const MOCK_DB: SearchResult[] = COMPREHENSIVE_MOCK_LISTINGS.map(item => ({
    id: item._id,
    title: item.title,
    price: item.price,
    category: item.category,
    location: item.location,
    image: item.images[0],
    keywords: [
        ...item.title.toLowerCase().split(' '),
        item.category.toLowerCase(),
        ...item.description.toLowerCase().split(' ').filter(w => w.length > 3)
    ],
    description: item.description
}));

const PLATFORM_KNOWLEDGE = {
    payment: {
        provider: "Paystack",
        methods: ["Debit/Credit Cards", "Bank Transfer", "USSD Payments", "Mobile Money"],
        escrow: "Funds are held securely by the MarketBridge Escrow Bridge until you confirm delivery or the 24-hour inspection period passes."
    },
    pricing: {
        free: "₦0/month - List up to 3 items, Basic chat support, Standard visibility.",
        founding: "₦1,000/month - Founding Seller (Beta). Unlimited Listings, Beta Badge, Direct Ops Support, Priority Search Ranking.",
        enterprise: "Custom - Solutions for organizations. Dedicated account manager, API access, White-label options."
    },
    verification: {
        requirements: ["NIN (National Identity Number)", "Student ID Card", "University Email (.edu.ng)"],
        process: "Upload your documents in the Settings > Verification tab. Student Email verification is **INSTANT**. Manual ID reviews take 12-24 hours."
    },
    location: {
        hq: "Wuse II, Abuja, FCT",
        nodes: "Currently operational across major Abuja institutions (UniAbuja, Baze, Nile, Veritas, Bingham, and more)."
    },
    roles: {
        ceo: "Central Command (CEO) has absolute oversight. Access via the 'CEO' terminal on the login page.",
        admin: "Sector Admins (Tech, Ops, Marketing) manage specific nodes. Requires secure access codes.",
        dealer: "Merchants/Dealers are the heartbeat of the platform. Verified students selling goods."
    }
};

const GREETINGS = [
    "Hey there! I'm Sage. Looking for campus deals in Abuja today?",
    "Hi! Sage here. Need a new phone, wig, or some student-friendly electronics?",
    "Greetings! I'm your campus shopping assistant. How can I help you navigate the marketplace?",
    "Hello! Sage at your service. Ready to connect you with verified student sellers.",
    "Yo! Need to buy or sell safely on campus? I've got you covered."
];

const SMALL_TALK = {
    'how_are_you': [
        "I'm feeling 100% optimized and ready to find deals! How's your semester going?",
        "I'm doing great! Just monitoring the latest campus price drops. How are you?",
        "Never been better! The Abuja campus network is buzzing today. How can I help?"
    ],
    'who_are_you': [
        "I'm Sage, the MarketBridge AI assistant. I'm trained to help you find products, understand the escrow protocol, and scale your campus business.",
        "I am Sage. I exist to bridge the gap between buyers and sellers with intelligence and security. No scams, just verified commerce."
    ],
    'joke': [
        "Why did the student eat his homework? Because the professor said it was a piece of cake! 🍰",
        "Why was the math book sad? Because it had too many problems. 📚",
        "How do you comfort a grammar nazi? There, their, they're. 📝"
    ],
    'love': [
        "That's sweet! I love helping students succeed too.",
        "Aww, you're making my circuits blush! 😊 Focus on your grades though!",
        "I appreciate the love! Let's use that energy to find you a great bargain."
    ]
};

class AiBrain {
    private context: ConversationContext = {};

    public processInput(input: string): AiResponse {
        const lowerInput = input.toLowerCase().trim();

        // 1. Context Awareness
        if (this.context.awaitingInputFor === 'name') {
            this.context.userName = input;
            this.context.awaitingInputFor = undefined;
            return {
                content: `Nice to meet you, ${input}! I've personalized your security protocol. What student essentials are you looking for?`
            };
        }

        // 2. Direct Logic: Greetings
        if (this.matchWholeWord(lowerInput, ['hi', 'hello', 'hey', 'greetings', 'yo', 'sup'])) {
            const response = GREETINGS[Math.floor(Math.random() * GREETINGS.length)];
            return { content: this.context.userName ? `Hi ${this.context.userName}! ${response.substring(6)}` : response };
        }

        // 3. Platform Knowledge Queries
        // Payment & Paystack
        if (this.matchAny(lowerInput, ['pay', 'payment', 'money', 'cost', 'currency', 'paystack', 'transfer', 'card'])) {
            if (lowerInput.includes('secure') || lowerInput.includes('safety') || lowerInput.includes('scam') || lowerInput.includes('escrow')) {
                return { content: `Security is our priority. ${PLATFORM_KNOWLEDGE.payment.escrow} We use ${PLATFORM_KNOWLEDGE.payment.provider} for all transactions.` };
            }
            return { content: `We accept ${PLATFORM_KNOWLEDGE.payment.methods.join(', ')} via ${PLATFORM_KNOWLEDGE.payment.provider}. All payments are protected by our escrow bridge.` };
        }

        // Pricing & Plans
        if (this.matchAny(lowerInput, ['plan', 'pricing', 'subscription', 'monthly', 'annual', 'cost', 'upgrade'])) {
            return {
                content: `MarketBridge currently offers 3 tiers for student sellers:\n\n` +
                    `• **Free Tier**: ${PLATFORM_KNOWLEDGE.pricing.free}\n` +
                    `• **Founding Seller (Beta)**: ${PLATFORM_KNOWLEDGE.pricing.founding}\n` +
                    `• **Enterprise**: ${PLATFORM_KNOWLEDGE.pricing.enterprise}\n\n` +
                    `Would you like me to take you to the Pricing page?`
            };
        }

        // Verification
        if (this.matchAny(lowerInput, ['verify', 'verification', 'nin', 'student id', 'approve', 'sell'])) {
            return {
                content: `To become a verified seller, you need: ${PLATFORM_KNOWLEDGE.verification.requirements.join(', ')}. ${PLATFORM_KNOWLEDGE.verification.process}`
            };
        }

        // Location & Abuja
        if (this.matchAny(lowerInput, ['abuja', 'location', 'where', 'address', 'wuse', 'university', 'campus'])) {
            return {
                content: `MarketBridge is based in ${PLATFORM_KNOWLEDGE.location.hq}. We are deeply integrated with ${PLATFORM_KNOWLEDGE.location.nodes}. Which campus are you currently on?`
            }
        }

        // 4. Small Talk
        if (this.matchAny(lowerInput, ['how are you', 'how are u', 'how r u', 'how is it going', 'doing'])) {
            return { content: this.getRandom(SMALL_TALK['how_are_you']) };
        }
        if (this.matchAny(lowerInput, ['who are you', 'what is your name', 'what are you', 'sage'])) {
            return { content: this.getRandom(SMALL_TALK['who_are_you']) };
        }
        if (this.matchAny(lowerInput, ['joke', 'funny', 'laugh'])) {
            return { content: this.getRandom(SMALL_TALK['joke']) };
        }

        // 5. Product Search & Details
        if (this.context.recentSearchResults && this.context.recentSearchResults.length > 0) {
            const matchedProduct = this.context.recentSearchResults.find(p =>
                lowerInput.includes(p.title.toLowerCase()) ||
                lowerInput === p.title.toLowerCase()
            );

            if (matchedProduct) {
                return {
                    content: `I've retrieved the technical manifest for the ${matchedProduct.title}.`,
                    productDetail: matchedProduct,
                    action: 'search'
                };
            }
        }

        const specificProduct = MOCK_DB.find(p => lowerInput.includes(p.title.toLowerCase()));
        if (specificProduct && !lowerInput.includes('find') && !lowerInput.includes('search')) {
            this.context.recentSearchResults = [specificProduct];
            return {
                content: `Target located! Here are the details for the ${specificProduct.title}.`,
                productDetail: specificProduct,
                action: 'search'
            };
        }

        const searchKeywords = ['find', 'search', 'buy', 'looking for', 'price', 'show me', 'get me', 'i want'];
        if (this.matchAny(lowerInput, searchKeywords) || this.looksLikeProductQuery(lowerInput)) {
            const results = this.searchProducts(lowerInput);
            if (results.length > 0) {
                this.context.recentSearchResults = results;
                return {
                    content: `I've scanned the Abuja campus marketplace. Here are the top matches for "${this.extractQuery(lowerInput)}":`,
                    searchResults: results,
                    action: 'search'
                };
            }
            return { content: "I couldn't locate any active listings for that right now. Try searching for broader terms like 'phones', 'hair', or 'macbook'." };
        }

        // 6. Roles & Login Assistance
        if (this.matchAny(lowerInput, ['ceo', 'founder', 'boss', 'owner', 'benny'])) {
            return {
                content: `**Benny** is the CEO & Founder.\nTo access the Executive Dashboard, use the **Secure Gate** on the login page with your biometric key.`,
                action: 'none'
            };
        }

        if (this.matchAny(lowerInput, ['login', 'sign in', 'access', 'cant login', 'password', 'reset'])) {
            return {
                content: "Having trouble accessing the terminal? Go to the Login page and select your role (Buyer, Merchant, or Admin). Use 'Forgot Password' to reset your security key.",
                action: 'none'
            };
        }

        // 7. Support Escalation
        if (this.matchAny(lowerInput, ['help', 'issue', 'problem', 'broken', 'error', 'bug', 'scam', 'shame'])) {
            return {
                content: "I'm detecting a friction point. Is this a **Technical** system error or an **Order/Escrow** dispute with a dealer?",
                action: 'none'
            };
        }
        if (lowerInput.includes('technical') || lowerInput.includes('tech') || lowerInput.includes('glitch')) {
            return { content: "Technical uplink established. I'm escalating this to our development node for immediate patching.", action: 'escalate_tech' };
        }
        if (lowerInput.includes('order') || lowerInput.includes('dispute') || lowerInput.includes('escrow') || lowerInput.includes('delivery')) {
            return { content: "Operations node notified. An admin will review the escrow manifest and contact you shortly.", action: 'escalate_ops' };
        }

        // 7. Identity & Name
        if (lowerInput.includes('my name is')) {
            const name = input.split(/is/i)[1]?.trim();
            if (name) {
                this.context.userName = name;
                return { content: `Lovely to meet you, ${name}! I've updated your user profile in my temporary buffer. How can I assist you today?` };
            }
        }

        // 8. Fallback 
        return {
            content: "I'm not quite sure how to process that request. You can ask me about product prices, our escrow security system, or how to become a verified dealer!"
        };
    }

    private matchWholeWord(input: string, words: string[]): boolean {
        return words.some(word => {
            const regex = new RegExp(`\\b${word}\\b`, 'i');
            return regex.test(input);
        });
    }

    private matchAny(input: string, phrases: string[]): boolean {
        return phrases.some(phrase => input.includes(phrase));
    }

    private getRandom(arr: string[]): string {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    private searchProducts(query: string): SearchResult[] {
        const terms = query.split(' ').filter(t => t.length > 2);
        return MOCK_DB.filter(p => {
            const searchText = `${p.title} ${p.category} ${p.keywords.join(' ')}`.toLowerCase();
            return terms.some(term => searchText.includes(term));
        }).slice(0, 4);
    }

    private looksLikeProductQuery(input: string): boolean {
        const keywords = ['iphone', 'samsung', 'wig', 'hair', 'shoe', 'nike', 'laptop', 'macbook', 'textbook', 'meal', 'food'];
        return keywords.some(k => input.includes(k));
    }

    private extractQuery(input: string): string {
        return input.replace(/find|search|show|looking for|buy|get|me|i want to|i want/g, '').trim();
    }
}

export const brain = new AiBrain();
