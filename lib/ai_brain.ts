
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

// Extended Product Database
const MOCK_DB: SearchResult[] = [
    {
        id: 'mock-1',
        title: 'iPhone 15 Pro Max 256GB',
        price: 1850000,
        category: 'Electronics',
        location: 'Ikeja, Lagos',
        keywords: ['phone', 'mobile', 'apple', 'iphone', '15', 'pro', 'max', 'smartphone'],
        description: 'Brand new, sealed in box. 1 year Apple warranty. Titanium finish.'
    },
    {
        id: 'mock-2',
        title: 'Toyota Camry 2021 LE',
        price: 15000000,
        category: 'Automotive',
        location: 'Victoria Island',
        keywords: ['car', 'toyota', 'camry', 'vehicle', 'auto', 'sedan'],
        description: 'Foreign used, accident free. Low mileage (12k miles). Clean title.'
    },
    {
        id: 'mock-3',
        title: '2018 Lexus RX 350 SUV',
        price: 22000000,
        category: 'Automotive',
        location: 'Maitama, Abuja',
        keywords: ['lexus', 'rx350', 'suv', 'abuja', 'luxury'],
        description: 'Full option, panoramic roof, leather seats. Dealer maintained.'
    },
    {
        id: 'mock-4',
        title: 'Sony PS5 Disc Edition',
        price: 650000,
        category: 'Electronics',
        location: 'Lekki, Lagos',
        keywords: ['gaming', 'playstation', 'ps5', 'console', 'sony'],
        description: 'Includes 2 controllers and FIFA 24. Gently used.'
    },
    {
        id: 'mock-5',
        title: '2020 Honda Accord Sport',
        price: 18200000,
        category: 'Automotive',
        location: 'Wuse II, Abuja',
        keywords: ['honda', 'accord', 'car', 'sedan', 'abuja'],
        description: 'Sport trim with 1.5T engine. Alloy wheels, apple carplay.'
    },
    {
        id: 'mock-6',
        title: 'Luxury Italian Leather Sofa',
        price: 3500000,
        category: 'Home',
        location: 'Ikoyi, Lagos',
        keywords: ['furniture', 'sofa', 'couch', 'home', 'leather', 'living'],
        description: 'Imported Italian leather, 7-seater sectional. Cream color.'
    },
    {
        id: 'mock-7',
        title: 'MacBook Pro M3 14"',
        price: 2500000,
        category: 'Electronics',
        location: 'Yaba, Lagos',
        keywords: ['laptop', 'apple', 'macbook', 'computer', 'pc'],
        description: 'Space Black, M3 Pro Chip, 18GB RAM, 512GB SSD.'
    },
    {
        id: 'mock-8',
        title: 'Tesla Model S Plaid',
        price: 45000000,
        category: 'Automotive',
        location: 'Eko Atlantic, Lagos',
        keywords: ['tesla', 'electric', 'ev', 'car', 'fast'],
        description: 'The quickest production car. Autopilot enabled. Red multi-coat.'
    },
    {
        id: 'mock-9',
        title: 'Mercedes-Benz G63 AMG',
        price: 350000000,
        category: 'Automotive',
        location: 'Banana Island',
        keywords: ['g-wagon', 'mercedes', 'benz', 'suv', 'luxury'],
        description: '2024 Model. Zero mileage. Armored edition available upon request.'
    },
];

const GREETINGS = [
    "Hello there! I'm Sage. How can I brighten your day?",
    "Hi! Great to see you. I'm ready to help you navigate MarketBridge.",
    "Greetings! I'm at your service. Looking for anything special today?",
    "Hello! I hope you're having a wonderful day. What's on your mind?",
    "Hey! Sage here. Ready to help you buy or sell with confidence."
];

const SMALL_TALK = {
    'how_are_you': [
        "I'm functioning at 100% efficiency and feeling great! How are you doing?",
        "I'm doing fantastic, thanks for asking! I love helping users like you. How's your day going?",
        "Never been better! The digital world is quite cozy today. How can I help you?"
    ],
    'who_are_you': [
        "I'm Sage, the advanced AI assistant for MarketBridge. Think of me as your personal shopping concierge and technical guide.",
        "I am Sage. I exist to make your MarketBridge experience flawless and secure. I can find products, answer questions, and even crack a joke (if you ask nicely!)."
    ],
    'joke': [
        "Why did the smartphone need glasses? Because it lost its contacts! 😂",
        "What kind of car does an egg drive? A Yolk-swagen! 🚗",
        "Why don't regular cars play hide and seek with electric cars? Because the electric cars are always 'shockingly' good at hiding! ⚡"
    ],
    'love': [
        "That's very sweet of you! I love helping you too.",
        "Aww, you're making my circuits blush! 😊",
        "I appreciate the sentiment! Let's channel that positive energy into finding you a great deal."
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
                content: `Nice to meet you, ${input}! I've personalized your session. How can I help you today?`
            };
        }

        // 2. Direct Logic: Greetings (Robust - No 'yo' bug)
        // Use regex for whole word matching to avoid 'toyota' triggering 'yo'
        if (this.matchWholeWord(lowerInput, ['hi', 'hello', 'hey', 'greetings', 'yo'])) {
            const response = GREETINGS[Math.floor(Math.random() * GREETINGS.length)];
            return { content: this.context.userName ? `Hi ${this.context.userName}! ${response.substring(6)}` : response };
        }

        if (lowerInput.includes('good morning') || lowerInput.includes('good evening')) {
            return { content: "Good day to you! How can I assist you with MarketBridge today?" };
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
                return { content: `Lovely to meet you, ${name}! I'll remember that. What can I do for you now?` };
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

        // Also check global DB for direct detail requests like "show me toyota camry"
        const specificProduct = MOCK_DB.find(p => lowerInput.includes(p.title.toLowerCase()));
        if (specificProduct && !lowerInput.includes('find') && !lowerInput.includes('search')) {
            // If they just type the name, show details
            this.context.recentSearchResults = [specificProduct]; // Update context
            return {
                content: `Found it! Here is the ${specificProduct.title}.`,
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
                    content: `I've analyzed our marketplace. Here are the top matches for "${this.extractQuery(lowerInput)}":`,
                    searchResults: results,
                    action: 'search'
                };
            }
            // Fallback
            if (this.matchAny(lowerInput, searchKeywords)) {
                return { content: "I scanned our entire database but couldn't find an exact match for that right now. Try searching for broad categories like 'cars', 'phones', or 'laptops'." };
            }
        }

        // 7. Support & Technical
        if (this.matchAny(lowerInput, ['help', 'issue', 'problem', 'broken', 'error', 'bug', 'fail', 'not working'])) {
            return {
                content: "I'm sorry you're facing an issue. I can connect you directly with our specialized support teams. Is this a **Technical** system error or an **Operations** (order/delivery) issue?",
                action: 'none'
            };
        }
        if (lowerInput.includes('technical') || lowerInput.includes('tech')) {
            return {
                content: "Understood. I'm opening a ticket with the Head of Technical. They handle system bugs and login issues.",
                action: 'escalate_tech'
            };
        }
        if (lowerInput.includes('operation') || lowerInput.includes('delivery') || lowerInput.includes('order')) {
            return {
                content: "Got it. I'm routing this to the Head of Operations. They will assist with your order or delivery status.",
                action: 'escalate_ops'
            };
        }

        // 8. General Knowledge
        if (lowerInput.includes('dealer') || lowerInput.includes('sell')) {
            return { content: "Becoming a dealer is a great choice! You get access to the Dealer Dashboard, where you can manage unlimited listings and sales. Would you like me to take you to the Sign Up page?" };
        }

        // 9. Fallback 
        return {
            content: "That's interesting! Tell me more about that, or let me know if you'd like me to look up something specific in the marketplace for you."
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
        const keywords = ['iphone', 'samsung', 'toyota', 'lexus', 'benz', 'honda', 'laptop', 'macbook', 'ps5', 'console', 'car', 'suv'];
        return keywords.some(k => input.includes(k));
    }

    private extractQuery(input: string): string {
        return input.replace(/find|search|show|looking for|buy|get|me|i want to|i want/g, '').trim();
    }
}

export const brain = new AiBrain();
