const fs = require('fs');
const https = require('https');

// --- Configuration ---
const PRODUCTS_API_URL = 'https://dummyjson.com/products?limit=0'; // 0 = all products
const TARGET_FILE = 'lib/mockData.ts';

const MARKETPLACE_CATEGORIES = [
    "Gadgets", "Fashion", "Vehicles", "Properties", "Services",
    "Food", "Beauty", "Furniture", "Laptops", "Books"
];

const LOCATIONS = [
    "UniAbuja Main Campus", "Veritas University", "Nile University",
    "Baze University", "Gwagwalada", "Ikeja, Lagos", "Lekki, Lagos",
    "Yaba, Lagos", "Surulere, Lagos", "Victoria Island"
];

const DEALER_NAMES = [
    "TechHub", "GadgetStore", "AutoFix", "GlamHouse", "UniDeals",
    "CampusStyles", "Foodie", "FastConnect", "LuxuryAutos", "SmartHome"
];

// --- Unsplash Fallback Images for difficult categories ---
const UNSPLASH_FALLBACKS = {
    "Properties": [
        "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800&q=80", // Apartment
        "https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=800&q=80", // House
        "https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&w=800&q=80", // Interior
        "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80", // Room
        "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80"  // Bed
    ],
    "Services": [
        "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80", // Repair
        "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=800&q=80", // Handshake
        "https://images.unsplash.com/photo-1556740758-90de374c12ad?auto=format&fit=crop&w=800&q=80", // Customer Service
        "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=800&q=80", // Office
        "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=800&q=80"  // Meeting
    ],
    "Books": [ // DummyJSON has no books
        "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=800&q=80", // Open Book
        "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&w=800&q=80", // Stack
        "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=800&q=80", // Library
        "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=800&q=80", // Reading
        "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&w=800&q=80"  // Textbooks
    ],
    "Vehicles": [ // Fallback if DummyJSON runs out
        "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80", // Car
        "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=800&q=80", // Sport Car
        "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=800&q=80", // Muscle Car
        "https://images.unsplash.com/photo-1558981285-6f0c94958bb6?auto=format&fit=crop&w=800&q=80", // Motorcycle
        "https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?auto=format&fit=crop&w=800&q=80"  // Bike
    ],
    "Gadgets": [
        "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1593642532744-937713517365?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?auto=format&fit=crop&w=800&q=80"
    ]
};


// --- Mapping Logic ---
const categoryMapping = {
    // DummyJSON Category -> Marketplace Category
    "smartphones": "Gadgets",
    "tablets": "Gadgets",
    "mobile-accessories": "Gadgets",
    "laptops": "Laptops",
    "fragrances": "Beauty",
    "skincare": "Beauty",
    "skin-care": "Beauty",
    "beauty": "Beauty",
    "groceries": "Food",
    "home-decoration": "Furniture",
    "furniture": "Furniture",
    "kitchen-accessories": "Furniture",
    "tops": "Fashion",
    "womens-dresses": "Fashion",
    "womens-shoes": "Fashion",
    "mens-shirts": "Fashion",
    "mens-shoes": "Fashion",
    "mens-watches": "Fashion",
    "womens-watches": "Fashion",
    "womens-bags": "Fashion",
    "womens-jewellery": "Fashion",
    "sunglasses": "Fashion",
    "automotive": "Vehicles",
    "motorcycle": "Vehicles",
    "vehicle": "Vehicles",
    "lighting": "Furniture",
    "sports-accessories": "Gadgets"
};

const manualItems = [
    // --- Books ---
    { title: "Calculus: Early Transcendentals", category: "Books", price: 15000, desc: "Used Calculus textbook, good condition.", image: UNSPLASH_FALLBACKS.Books[0] },
    { title: "Introduction to Algorithms", category: "Books", price: 20000, desc: "Standard CS textbook.", image: UNSPLASH_FALLBACKS.Books[1] },
    { title: "Chemistry 101 Notes", category: "Books", price: 5000, desc: "Handwritten notes for Chem 101.", image: UNSPLASH_FALLBACKS.Books[2] },
    { title: "Medical Dictionary", category: "Books", price: 12000, desc: "Essential for med students.", image: UNSPLASH_FALLBACKS.Books[3] },
    { title: "Past Questions Bundle", category: "Books", price: 3000, desc: "Last 5 years past questions.", image: UNSPLASH_FALLBACKS.Books[4] },

    // --- Services ---
    { title: "Laptop Repair Service", category: "Services", price: 5000, desc: "Fast laptop screen replacement.", image: UNSPLASH_FALLBACKS.Services[0] },
    { title: "Project Writing Assist", category: "Services", price: 15000, desc: "Help with final year projects.", image: UNSPLASH_FALLBACKS.Services[1] },
    { title: "Cleaning Service", category: "Services", price: 8000, desc: "Room cleaning for hostels.", image: UNSPLASH_FALLBACKS.Services[2] },
    { title: "Graphic Design", category: "Services", price: 10000, desc: "Logo and flyer design.", image: UNSPLASH_FALLBACKS.Services[3] },
    { title: "Tutorial Sessions", category: "Services", price: 2000, desc: "Math and Physics tutorials.", image: UNSPLASH_FALLBACKS.Services[4] },

    // --- Properties ---
    { title: "Self Contained Room", category: "Properties", price: 250000, desc: "Clean self contained room near campus.", image: UNSPLASH_FALLBACKS.Properties[0] },
    { title: "2 Bedroom Flat", category: "Properties", price: 800000, desc: "Spacious flat available for rent.", image: UNSPLASH_FALLBACKS.Properties[1] },
    { title: "Hostel Bedspace", category: "Properties", price: 50000, desc: "Bedspace in shared room.", image: UNSPLASH_FALLBACKS.Properties[2] },
    { title: "Boys Quarters", category: "Properties", price: 150000, desc: "BQ with shared bathroom.", image: UNSPLASH_FALLBACKS.Properties[3] },
    { title: "Studio Apartment", category: "Properties", price: 350000, desc: "Modern studio apartment.", image: UNSPLASH_FALLBACKS.Properties[4] },

    // --- Vehicles (Manual extras) ---
    { title: "Toyota Corolla 2010", category: "Vehicles", price: 3500000, desc: "Nigerian used, good engine.", image: UNSPLASH_FALLBACKS.Vehicles[0] },
    { title: "Lexus RX350", category: "Vehicles", price: 8500000, desc: "Clean leather interior.", image: UNSPLASH_FALLBACKS.Vehicles[1] },
];

function fetchProducts() {
    return new Promise((resolve, reject) => {
        https.get(PRODUCTS_API_URL || 'https://dummyjson.com/products?limit=0', (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    resolve(json.products || []);
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', (e) => reject(e));
    });
}

async function main() {
    console.log("Fetching products from DummyJSON...");
    try {
        const products = await fetchProducts();
        console.log(`Fetched ${products.length} products.`);

        // --- Helper to process listings ---
        let listings = [];
        let listing_id = 1;

        const addListing = (item, category_override = null) => {
            const category = category_override || categoryMapping[item.category] || "Gadgets";

            // Check if mapped category is valid
            if (!MARKETPLACE_CATEGORIES.includes(category)) return;

            // Price conversion: $1 ~ 1200 Naira
            const price = Math.round((item.price * 1200) / 100) * 100;

            // Images: DummyJSON > Unsplash
            let img = (item.images && item.images.length > 0) ? item.images[0] :
                (UNSPLASH_FALLBACKS[category] ? UNSPLASH_FALLBACKS[category][0] : UNSPLASH_FALLBACKS.Gadgets[0]);

            // Enhanced Descriptions
            let desc = item.description || "";
            if (category === "Laptops") desc += ". Perfect for students, capable of handling assignments and project work efficiently.";
            else if (category === "Gadgets") desc += ". Essential gadget for campus life.";
            else if (category === "Books") desc += ". Must-have academic resource.";
            else if (category === "Fashion") desc += ". Look sharp on campus with this item.";
            else if (category === "Vehicles") desc += ". Easy mobility on and off campus.";
            else desc += ". Available now at a great price.";

            listings.push({
                _id: `${category.slice(0, 3).toLowerCase()}-${listing_id++}-${Math.floor(Math.random() * 10000)}`,
                title: item.title,
                description: desc,
                price: price,
                category: category,
                images: [img],
                location: LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)],
                dealer: {
                    _id: `d${Math.floor(Math.random() * 20) + 1}`,
                    displayName: item.brand || DEALER_NAMES[Math.floor(Math.random() * DEALER_NAMES.length)],
                    isVerified: Math.random() > 0.5,
                    shopType: Math.random() > 0.7 ? 'both' : 'online'
                }
            });
        };

        // 1. Process API Products
        products.forEach(p => addListing(p));

        // 2. Add Manual Items (Duplicate 5 times for volume)
        for (let i = 0; i < 5; i++) {
            manualItems.forEach(m => {
                // Use addListing logic if possible, or manual push (manual push is easier as `item` structure differs slightly)
                // But wait, manual items need descriptions too.
                // I'll adjust manual item descriptions manually in the array or apply same logic if I passed them to addListing?
                // No, manualItems have specific descriptions. Just append generic suffix.

                let desc = m.desc + " Great for students.";

                listings.push({
                    _id: `man-${listing_id++}-${Math.floor(Math.random() * 10000)}`,
                    title: m.title,
                    description: desc,
                    price: m.price,
                    category: m.category,
                    images: [m.image],
                    location: LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)],
                    dealer: {
                        _id: `d${Math.floor(Math.random() * 20) + 1}`,
                        displayName: DEALER_NAMES[Math.floor(Math.random() * DEALER_NAMES.length)],
                        isVerified: true,
                        shopType: 'physical'
                    }
                });
            });
        }

        console.log(`Generated ${listings.length} total listings.`);

        const fileContent = `// Comprehensive mock data for MarketBridge listings - GENERATED ${new Date().toISOString()}
// Source: DummyJSON + Unsplash Fallbacks
export const COMPREHENSIVE_MOCK_LISTINGS: Array<{
    _id: string;
    title: string;
    description: string;
    price: number;
    category: string;
    images: string[];
    location: string;
    dealer: {
        _id: string;
        displayName: string;
        isVerified: boolean;
        shopType?: 'physical' | 'online' | 'both';
    };
}> = ${JSON.stringify(listings, null, 4)};`;

        fs.writeFileSync(TARGET_FILE, fileContent);
        console.log(`Successfully wrote to ${TARGET_FILE}`);

    } catch (err) {
        console.error("Error generating listings:", err);
    }
}

main();
