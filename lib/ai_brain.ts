
// This "Brain" simulates a conversational AI with improved context retention and intent recognition.

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

// Extended Product Database - SYNCED WITH LISTING PAGE MOCK DATA
const MOCK_DB: SearchResult[] = [
    {
        id: 'mock-1',
        title: 'iPhone 12 Pro (UK Used)',
        price: 320000,
        category: 'Gadgets',
        location: 'UniAbuja Main Campus',
        keywords: ['phone', 'apple', 'iphone', '12', 'pro', 'mobile', 'uk used'],
        description: 'Clean UK used iPhone 12 Pro. 128GB, Pacific Blue. Battery health 89%.'
    },
    {
        id: 'mock-2',
        title: 'Bone Straight Wig (24 inches)',
        price: 150000,
        category: 'Beauty',
        location: 'Veritas University',
        keywords: ['wig', 'hair', 'bone', 'straight', 'human', 'hair', 'beauty'],
        description: 'Super double drawn bone straight wig. 300g fullness. Vietnam original.'
    },
    {
        id: 'mock-3',
        title: 'Math 101 Textbook + Past Questions',
        price: 5000,
        category: 'Education',
        location: 'UniAbuja Mini Campus',
        keywords: ['book', 'textbook', 'math', '101', 'pq', 'past questions', 'handout'],
        description: 'Essential calculus textbook for freshers. Includes solved past questions from 2015-2023.'
    },
    {
        id: 'mock-4',
        title: 'Nike Air Force 1 (White)',
        price: 25000,
        category: 'Fashion',
        location: 'Baze University',
        keywords: ['shoe', 'sneakers', 'nike', 'air', 'force', 'white', 'kicks'],
        description: 'Classic white Air Force 1s. Size 42-45 available. Durable and clean.'
    },
    {
        id: 'mock-5',
        title: 'Student Indomie Combo Pack',
        price: 8500,
        category: 'Food',
        location: 'Nile University',
        keywords: ['food', 'indomie', 'carton', 'noodles', 'hungry', 'super pack'],
        description: 'Carton of Indomie Super Pack (40 pieces). Best price on campus. Free delivery to hostels.'
    },
    {
        id: 'mock-6',
        title: 'HP EliteBook 840 G5',
        price: 280000,
        category: 'Laptops',
        location: 'UniAbuja Main Campus',
        keywords: ['laptop', 'hp', 'elitebook', 'computer', 'pc', 'assignment'],
        description: 'Core i5, 8th Gen, 16GB RAM, 512GB SSD. Perfect for assignments and coding.'
    },
    {
        id: 'mock-7',
        title: 'Professional Makeup Session',
        price: 15000,
        category: 'Services',
        location: 'Veritas University',
        keywords: ['makeup', 'beauty', 'face', 'beat', 'service', 'glam'],
        description: 'Full face glam for matriculation, birthdays, and events. Home service available in hostels.'
    },
    {
        id: 'mock-8',
        title: 'Oraimo FreePods 4',
        price: 28000,
        category: 'Gadgets',
        location: 'Gwagwalada',
        keywords: ['earbuds', 'oriamo', 'freepods', 'music', 'bluetooth', 'audio'],
        description: 'Brand new Oraimo FreePods 4. Active Noise Cancellation. Long battery life.'
    },
    {
        id: 'mock-9',
        title: 'Vintage Oversized Tees',
        price: 8000,
        category: 'Fashion',
        location: 'UniAbuja Main Campus',
        keywords: ['shirt', 't-shirt', 'vintage', 'oversized', 'fashion', 'clothes'],
        description: 'High quality cotton vintage tees. Various designs available. Unisex.'
    }
];

const GREETINGS = [
    "Hey there! I'm Sage. Looking for campus deals today?",
    "Hi! Sage here. Need a new phone, wig, or just some noodles?",
    "Greetings! I'm your campus shopping assistant. What's on your list?",
    "Hello! Ready to connect you with student sellers. What do you need?",
    "Yo! Sage at your service. Let's find you some student-friendly prices."
];

const SMALL_TALK = {
    'how_are_you': [
        "I'm feeling 100% charged and ready to find deals! How's semester going?",
        "I'm doing great! Just analyzing the latest campus trends. How are you?",
        "Never been better! The campus network is buzzing today. How can I help?"
    ],
    'who_are_you': [
        "I'm Sage, the MarketBridge assistant. I help students buy and sell safely on campus. I'm basically your digital connect.",
        "I am Sage. I exist to help you navigate campus commerce without stress. No scams, just legit student deals."
    ],
    'joke': [
        "Why did the student eat his homework? Because the professor said it was a piece of cake! 🍰",
        "Why was the math book sad? Because it had too many problems. 📚",
        "How do you comfort a grammar nazi? There, their, they're. 📝"
    ],
    'love': [
        "That's sweet! I love helping students succeed too.",
        "Aww, you're making my circuits blush! 😊 Focus on your books though!",
        "I appreciate the love! Let's use that energy to find you a great bargain."
    ]
};

class AiBrain {
    private context: ConversationContext = {};

    constructor() {
        // Load context...
    }

    public processInput(input: string): AiResponse {
        const lowerInput = input.toLowerCase().trim();

        // 1. Context Awareness: Check if we are waiting for specific input
        if (this.context.awaitingInputFor === 'name') {
            this.context.userName = input;
            this.context.awaitingInputFor = undefined;
            return {
                content: `Nice to meet you, ${input}! I've personalized your session. How's campus life treating you?`
            };
        }

        // 2. Direct Logic: Greetings (Robust - No 'yo' bug)
        // Use regex for whole word matching to avoid 'toyota' triggering 'yo'
        if (this.matchWholeWord(lowerInput, ['hi', 'hello', 'hey', 'greetings', 'yo', 'sup'])) {
            const response = GREETINGS[Math.floor(Math.random() * GREETINGS.length)];
            return { content: this.context.userName ? `Hi ${this.context.userName}! ${response.substring(6)}` : response };
        }

        if (lowerInput.includes('good morning') || lowerInput.includes('good evening')) {
            return { content: "Good day! Ready to find some campus essentials?" };
        }

        // 3. Small Talk
        if (this.matchAny(lowerInput, ['how are you', 'how are u', 'how r u', 'how is it going', 'doing'])) {
            return { content: this.getRandom(SMALL_TALK['how_are_you']) };
        }
        if (this.matchAny(lowerInput, ['who are you', 'what is your name', 'what are you'])) {
            return { content: this.getRandom(SMALL_TALK['who_are_you']) };
        }
        if (this.matchAny(lowerInput, ['joke', 'funny', 'laugh'])) {
            return { content: this.getRandom(SMALL_TALK['joke']) };
        }
        if (this.matchAny(lowerInput, ['love you', 'marry me', 'beautiful', 'cute'])) {
            return { content: this.getRandom(SMALL_TALK['love']) };
        }

        // 4. Intelligence: Name Persistence
        if (lowerInput.includes('my name is')) {
            const name = input.split(/is/i)[1]?.trim();
            if (name) {
                this.context.userName = name;
                return { content: `Lovely to meet you, ${name}! I'll remember that. What student essentials are you looking for?` };
            }
        }

        if (lowerInput === 'i am ben' || lowerInput === 'im ben' || lowerInput === "i'm ben") {
            this.context.userName = 'Ben';
            return { content: `Lovely to meet you, Ben! I'll remember that. What can I do for you now?` };
        }

        // 5. Product Context & Selection (The "Click" or "Select" Logic)
        // If user typed something that matches a recent search result
        if (this.context.recentSearchResults && this.context.recentSearchResults.length > 0) {
            const matchedProduct = this.context.recentSearchResults.find(p =>
                lowerInput.includes(p.title.toLowerCase()) ||
                lowerInput === p.title.toLowerCase() ||
                (lowerInput.includes(p.category.toLowerCase()) && lowerInput.includes('details'))
            );

            if (matchedProduct) {
                return {
                    content: `Here are the details for the ${matchedProduct.title}.`,
                    productDetail: matchedProduct,
                    action: 'search'
                };
            }
        }

        // Also check global DB for direct detail requests like "show me iphone 12"
        const specificProduct = MOCK_DB.find(p => lowerInput.includes(p.title.toLowerCase()));
        if (specificProduct && !lowerInput.includes('find') && !lowerInput.includes('search')) {
            // If they just type the name, show details
            this.context.recentSearchResults = [specificProduct]; // Update context
            return {
                content: `Found specific match! Here is the ${specificProduct.title}.`,
                productDetail: specificProduct,
                action: 'search'
            };
        }

        // 6. Product Search (The Core Utility)
        const searchKeywords = ['find', 'search', 'buy', 'looking for', 'price', 'cost', 'show me', 'where can i get', 'i want'];
        if (this.matchAny(lowerInput, searchKeywords) || this.looksLikeProductQuery(lowerInput)) {
            const results = this.searchProducts(lowerInput);
            if (results.length > 0) {
                this.context.recentSearchResults = results; // Save to context
                return {
                    content: `I've scanned the student marketplace. Here are the top matches for "${this.extractQuery(lowerInput)}":`,
                    searchResults: results,
                    action: 'search'
                };
            }
            // Fallback
            if (this.matchAny(lowerInput, searchKeywords)) {
                return { content: "I looked through the listings but couldn't find an exact match right now. Try searching for 'phones', 'wigs', 'books', or 'services'." };
            }
        }

        // 7. Support & Technical
        if (this.matchAny(lowerInput, ['help', 'issue', 'problem', 'broken', 'error', 'bug', 'fail', 'not working'])) {
            return {
                content: "Sorry about that. Is this a **Technical** app issue or an **Order/Delivery** problem with a seller?",
                action: 'none'
            };
        }
        if (lowerInput.includes('technical') || lowerInput.includes('tech')) {
            return {
                content: "Understood. I'm flagging this for the Tech Team to fix.",
                action: 'escalate_tech'
            };
        }
        if (lowerInput.includes('operation') || lowerInput.includes('delivery') || lowerInput.includes('order')) {
            return {
                content: "Got it. I'm routing this to Support to check on your order.",
                action: 'escalate_ops'
            };
        }

        // 8. General Knowledge
        if (lowerInput.includes('dealer') || lowerInput.includes('sell') || lowerInput.includes('seller') || lowerInput.includes('vendor')) {
            return { content: "Want to sell on MarketBridge? It's free for verified students! You can sell products or services. Would you like me to take you to the Sign Up page?" };
        }

        // 9. Fallback 
        return {
            content: "That's interesting! Tell me more, or let me know if you want to find some campus deals."
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
        const keywords = ['iphone', 'samsung', 'wig', 'hair', 'shoe', 'nike', 'laptop', 'macbook', 'textbook', 'food'];
        return keywords.some(k => input.includes(k));
    }

    private extractQuery(input: string): string {
        return input.replace(/find|search|show|looking for|buy|get|me|i want to|i want/g, '').trim();
    }
}

export const brain = new AiBrain();
