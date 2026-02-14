
const fs = require('fs');

const categories = [
    "Electronics", "Automotive", "Fashion", "Home & Garden", "Beauty",
    "Sports", "Real Estate", "Services", "Kids & Babies", "Groceries"
];

const dealer_names = ["TechHub", "GadgetStore", "AutoFix", "GlamHouse", "UniDeals", "CampusStyles", "Foodie", "FastConnect", "LuxuryAutos", "SmartHome"];
const locations = ["UniAbuja Main Campus", "Veritas University", "Nile University", "Baze University", "Gwagwalada", "Ikeja, Lagos", "Lekki, Lagos", "Yaba, Lagos", "Surulere, Lagos", "Victoria Island"];

const templates = {
    "Electronics": [
        { name: "iPhone {model}", min: 300000, max: 2000000, models: ["12", "13", "14", "15 Pro Max", "XR", "11"] },
        { name: "Samsung Galaxy {model}", min: 150000, max: 1500000, models: ["S21", "S22 Ultra", "S23", "S24", "A54", "Z Fold"] },
        { name: "MacBook {model}", min: 400000, max: 3000000, models: ["Air M1", "Pro M2", "Pro M3", "Air M2", "Pro Intel"] },
        { name: "HP {model}", min: 150000, max: 600000, models: ["EliteBook", "Pavilion", "Envy", "Spectre", "Victus"] },
        { name: "Sony {model}", min: 50000, max: 500000, models: ["Headphones XM4", "Headphones XM5", "PlayStation 5", "PlayStation 4"] },
    ],
    "Automotive": [
        { name: "Toyota {model}", min: 3000000, max: 15000000, models: ["Corolla", "Camry", "Highlander", "RAV4", "Sienna"] },
        { name: "Honda {model}", min: 2500000, max: 12000000, models: ["Civic", "Accord", "CR-V", "Pilot"] },
        { name: "Lexus {model}", min: 4000000, max: 25000000, models: ["RX350", "ES350", "GX460", "IS250"] },
        { name: "Mercedes {model}", min: 5000000, max: 40000000, models: ["C300", "E350", "GLK", "GLE"] },
    ],
    "Fashion": [
        { name: "Nike {model}", min: 20000, max: 150000, models: ["Air Force 1", "Dunk Low", "Jordan 1", "Air Max"] },
        { name: "Adidas {model}", min: 15000, max: 120000, models: ["Yeezy 350", "Ultraboost", "Superstar"] },
        { name: "Vintage {model}", min: 5000, max: 25000, models: ["T-Shirt", "Sweatshirt", "Jacket", "Jeans"] },
        { name: "Designer {model}", min: 50000, max: 500000, models: ["Handbag", "Watch", "Sunglasses", "Belts"] },
    ],
    "Home & Garden": [
        { name: "IKEA {model}", min: 15000, max: 150000, models: ["Table", "Chair", "Lamp", "Shelf"] },
        { name: "Gas Cooker {model}", min: 20000, max: 100000, models: ["2 Burner", "4 Burner", "Free Standing", "Table Top"] },
        { name: "Generator {model}", min: 150000, max: 800000, models: ["Sumec Firman", "Elepaq", "Honda", "Mikano"] },
        { name: "Mattress {model}", min: 40000, max: 250000, models: ["Orthopedic", "Foam", "King Size", "Student Size"] },
    ],
    "Beauty": [
        { name: "Wig {model}", min: 30000, max: 400000, models: ["Bone Straight", "Curly", "Bob", "Braided"] },
        { name: "Skincare {model}", min: 5000, max: 50000, models: ["Set", "Serum", "Cream", "Lotion"] },
        { name: "Makeup {model}", min: 3000, max: 30000, models: ["Palette", "Foundation", "Lipstick", "Kit"] },
    ],
    "Sports": [
        { name: "Football {model}", min: 5000, max: 20000, models: ["Jersey", "Ball", "Boots", "Kit"] },
        { name: "Gym {model}", min: 10000, max: 150000, models: ["Dumbbells", "Mat", "Bench", "Gloves"] },
        { name: "Bicycle {model}", min: 40000, max: 200000, models: ["Mountain", "Road", "Hybrid", "Electric"] },
    ],
    "Real Estate": [
        { name: "Apartment {model}", min: 200000, max: 5000000, models: ["Self Con", "One Bedroom", "Two Bedroom", "Duplex"] },
        { name: "Land {model}", min: 1000000, max: 50000000, models: ["Plot", "Half Plot", "Acre", "Estate"] },
        { name: "Hostel {model}", min: 100000, max: 500000, models: ["Space", "Room", "Bedspace", "Standard"] },
    ],
    "Services": [
        { name: "Photography {model}", min: 15000, max: 200000, models: ["Session", "Event", "Wedding", "Birthday"] },
        { name: "Web Design {model}", min: 50000, max: 500000, models: ["Landing Page", "E-commerce", "Portfolio", "Blog"] },
        { name: "Cleaning {model}", min: 5000, max: 50000, models: ["Room", "House", "Car", "Laundry"] },
        { name: "Hairdressing {model}", min: 3000, max: 30000, models: ["Braids", "Wig Install", "Barbing", "Retouch"] },
    ],
    "Kids & Babies": [
        { name: "Baby {model}", min: 10000, max: 150000, models: ["Stroller", "Cot", "Walker", "Clothes"] },
        { name: "Toy {model}", min: 2000, max: 50000, models: ["Car", "Doll", "Puzzle", "Lego"] },
        { name: "Diapers {model}", min: 5000, max: 25000, models: ["Pack", "Carton", "Wipes", "Cream"] },
    ],
    "Groceries": [
        { name: "Rice {model}", min: 30000, max: 80000, models: ["50kg", "25kg", "10kg", "Bag"] },
        { name: "Oil {model}", min: 5000, max: 30000, models: ["Vegetable", "Palm", "Groundnut", "Olive"] },
        { name: "Indomie {model}", min: 4000, max: 12000, models: ["Carton", "Hungry Man", "Super Pack", "Onion"] },
        { name: "Beverage {model}", min: 2000, max: 20000, models: ["Milo", "Milk", "Sugar", "Cornflakes"] },
    ]
};

const images = {
    "Electronics": "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80",
    "Automotive": "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80",
    "Fashion": "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=800&q=80",
    "Home & Garden": "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?auto=format&fit=crop&w=800&q=80",
    "Beauty": "https://images.unsplash.com/photo-1522335208411-2ee266053b63?auto=format&fit=crop&w=800&q=80",
    "Sports": "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=800&q=80",
    "Real Estate": "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800&q=80",
    "Services": "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=800&q=80",
    "Kids & Babies": "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=800&q=80",
    "Groceries": "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80"
};

const listings = [];
let listing_id = 1;

categories.forEach(category => {
    const catTemplates = templates[category] || [];
    if (catTemplates.length === 0) return;

    for (let i = 0; i < 30; i++) {
        const template = catTemplates[Math.floor(Math.random() * catTemplates.length)];
        const model = template.models[Math.floor(Math.random() * template.models.length)];
        const title = template.name.replace("{model}", model);
        const price = Math.floor(Math.random() * (template.max - template.min + 1) + template.min);
        const location = locations[Math.floor(Math.random() * locations.length)];
        const dealerName = dealer_names[Math.floor(Math.random() * dealer_names.length)];
        const image = images[category];

        const listing = {
            _id: `${category.slice(0, 4).toLowerCase()}-${listing_id}`,
            title: title + ` #${i + 1}`, // Ensure uniqueness
            description: `Quality ${title} available for sale. Contact for more details. Best price guaranteed.`,
            price: Math.round(price / 100) * 100,
            category: category,
            images: [image],
            location: location,
            dealer: {
                _id: `d${Math.floor(Math.random() * 20) + 1}`,
                displayName: dealerName,
                isVerified: Math.random() > 0.5,
                shopType: Math.random() > 0.6 ? 'both' : (Math.random() > 0.5 ? 'physical' : 'online')
            }
        };
        listings.push(listing);
        listing_id++;
    }
});

const output = `// Comprehensive mock data for MarketBridge listings - GENERATED 300+ ITEMS
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

fs.writeFileSync('lib/mockData.ts', output);
console.log('Successfully generated ' + listings.length + ' listings.');
