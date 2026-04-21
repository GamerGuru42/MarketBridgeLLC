
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

// Real-time search is now handled via the /api/chat route using Supabase.
// This client-side brain handles general intent and knowledge.
const MOCK_DB: SearchResult[] = [];

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
        requirements: ["NIN (National Identity Number)", "Institution ID Card"],
        process: "Upload your documents in the Settings > Verification tab. ID reviews take 12-24 hours."
    },
    location: {
        hq: "Wuse II, Abuja, FCT",
        nodes: "Currently operational across major Abuja institutions (UniAbuja, Baze, Nile, Veritas, Bingham, and more)."
    },
    roles: {
        ceo: "Central Command (CEO) has absolute oversight. Access via the MarketBridge HQ Portal.",
        admin: "Sector Admins (Operations, Marketing, Systems) manage specific departments. Access via the MarketBridge HQ Portal.",
        student_seller: "Student Sellers are the heartbeat of the platform. Verified university community members selling goods."
    },
    support: {
        tech: {
            email: "support@marketbridge.com.ng",
            for: ["App bugs", "Login issues", "Errors", "Loading problems", "Technical features"],
            description: "Technical support for app bugs, login issues, and system errors"
        },
        ops: {
            email: "ops-support@marketbridge.com.ng",
            for: ["Refunds", "Subscriptions", "Seller questions", "Payments", "Account help", "General assistance"],
            description: "Operations support for refunds, subscriptions, seller questions, and account help"
        }
    },
    rewards: {
        marketcoins: "Earn 1 coin per ₦100 spent (Buyer) or 1 coin per ₦200 sold (Student Seller). 1 coin = ₦1 discount at checkout.",
        referral: "Earn ₦300 credit (coins) for every friend who makes their first purchase of ₦5,000 or more."
    },
    branding: {
        colors: ["#FF6200 Orange", "#000000 Black", "#FFFFFF White"],
        vibe: "Mobile-first, hyper-local, student-focused commerce."
    }
};

const GREETINGS = [
    "Hey there! I'm Sage. Looking for university deals in Abuja today?",
    "Hi! Sage here. Need a new phone, wig, or some community-friendly electronics?",
    "Greetings! I'm your university shopping assistant. How can I help you navigate the marketplace?",
    "Hello! Sage at your service. Ready to connect you with verified community sellers.",
    "Yo! Need to buy or sell safely within the university community? I've got you covered."
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
    love: [
        "That's sweet! I love helping our community members succeed too.",
        "Aww, you're making my circuits blush! 😊 Focus on your goals though!",
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
                content: `Nice to meet you, ${input}! I've personalized your security protocol. What community essentials are you looking for?`
            };
        }

        // 2. Direct Logic: Greetings & Small Talk
        if (this.matchAny(lowerInput, ['good morning', 'good afternoon', 'good evening', 'morning', 'afternoon', 'evening'])) {
            const timeOfDay = lowerInput.includes('morning') ? 'morning' : lowerInput.includes('afternoon') ? 'afternoon' : 'evening';
            return { content: `Good ${timeOfDay}${this.context.userName ? ', ' + this.context.userName : ''}! Hope your day is going well. Ready to browse some campus deals?` };
        }

        if (this.matchAny(lowerInput, ['what\'s up', 'whats up', 'how far', 'wetin dey sup'])) {
            return { content: `I'm just over here monitoring the Lagos-Abuja trade routes! Everything is optimized. What's on your mind today?` };
        }

        if (this.matchWholeWord(lowerInput, ['hi', 'hello', 'hey', 'greetings', 'yo', 'sup'])) {
            const response = GREETINGS[Math.floor(Math.random() * GREETINGS.length)];
            return { content: this.context.userName ? `Hi ${this.context.userName}! ${response.substring(6)}` : response };
        }

        // 3. Platform Knowledge Queries
        // Google Identity Hub & Login
        if (this.matchAny(lowerInput, ['google', 'gmail', 'identity', 'hub', 'automatic', 'prefill'])) {
            return {
                content: `Our new **Google Identity Hub** allows you to sign up or log in with a single click. It automatically pre-fills your profile data from your Google account to get you into the marketplace faster. Would you like me to guide you to the login terminal?`
            };
        }

        // Executive Terminal / Admin Chat
        if (this.matchAny(lowerInput, ['terminal', 'executive', 'cto', 'coo', 'admin chat', 'direct message'])) {
            return {
                content: `We've recently upgraded the **Executive Terminal**. CEOs and Admins can now initiate direct secure streams with the CTO Hub and other sector admins for real-time coordination. If you're an admin, make sure to use your secure access key.`
            };
        }

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
                    `• **Founding Student Seller (Beta)**: ${PLATFORM_KNOWLEDGE.pricing.founding}\n` +
                    `• **Enterprise**: ${PLATFORM_KNOWLEDGE.pricing.enterprise}\n\n` +
                    `Would you like me to take you to the Pricing page?`
            };
        }

        // MarketCoins & Rewards
        if (this.matchAny(lowerInput, ['coin', 'marketcoin', 'reward', 'point', 'earn', 'discount', 'refer', 'referral', 'bonus'])) {
            if (lowerInput.includes('refer') || lowerInput.includes('bonus')) {
                return {
                    content: `Earning is easy! ${PLATFORM_KNOWLEDGE.rewards.referral} You can track your referrals in your profile dashboard.`
                };
            }
            return {
                content: `Our **MarketCoins** loyalty engine lets you save big. ${PLATFORM_KNOWLEDGE.rewards.marketcoins} You can apply them at checkout for instant discounts!`
            };
        }

        // Verification
        if (this.matchAny(lowerInput, ['verify', 'verification', 'nin', 'student id', 'approve', 'sell'])) {
            return {
                content: `To become a verified Student Seller, you need: ${PLATFORM_KNOWLEDGE.verification.requirements.join(', ')}. ${PLATFORM_KNOWLEDGE.verification.process}`
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
                    content: `I've scanned the Abuja university marketplace. Here are the top matches for "${this.extractQuery(lowerInput)}":`,
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

        // 7. Support Escalation with Dual Channels
        if (this.matchAny(lowerInput, ['help', 'support', 'contact', 'email', 'reach'])) {
            return {
                content: `MarketBridge has two support channels:\n\n🔴 **Tech Support** (${PLATFORM_KNOWLEDGE.support.tech.email}):\n${PLATFORM_KNOWLEDGE.support.tech.for.join(', ')}\n\n🟢 **Ops Support** (${PLATFORM_KNOWLEDGE.support.ops.email}):\n${PLATFORM_KNOWLEDGE.support.ops.for.join(', ')}\n\nWhat kind of help do you need?`,
                action: 'none'
            };
        }

        // Technical Issues
        if (this.matchAny(lowerInput, ['bug', 'error', 'broken', 'crash', 'glitch', 'technical', 'tech', 'login', 'loading', 'not working'])) {
            return {
                content: `🔴 **Technical Issue Detected**\n\nI'm escalating this to our Tech Support team. They'll investigate immediately.\n\nFor urgent tech issues, email: ${PLATFORM_KNOWLEDGE.support.tech.email}\n\nTicket created and logged.`,
                action: 'escalate_tech'
            };
        }

        // Operations Issues
        if (this.matchAny(lowerInput, ['refund', 'payment', 'subscription', 'seller', 'order', 'dispute', 'escrow', 'delivery', 'cancel', 'account'])) {
            return {
                content: `🟢 **Operations Request Logged**\n\nI'm connecting you with our Ops Support team. They handle refunds, subscriptions, and student seller matters.\n\nFor faster resolution, email: ${PLATFORM_KNOWLEDGE.support.ops.email}\n\nYour request has been escalated.`,
                action: 'escalate_ops'
            };
        }

        // General catch-all for issues
        if (this.matchAny(lowerInput, ['issue', 'problem', 'scam', 'shame'])) {
            return {
                content: `I'm here to help! Is this a **Technical** issue (app bugs, login, errors) or an **Operations** matter (refunds, payments, seller questions)?\n\n🔴 Tech: ${PLATFORM_KNOWLEDGE.support.tech.email}\n🟢 Ops: ${PLATFORM_KNOWLEDGE.support.ops.email}`,
                action: 'none'
            };
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
            content: "I'm not quite sure how to process that request. You can ask me about product prices, our escrow security system, or how to become a verified Student Seller!"
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
