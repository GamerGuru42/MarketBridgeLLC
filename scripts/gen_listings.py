
import json
import random

categories = [
    "Electronics", "Automotive", "Fashion", "Home & Garden", "Beauty", 
    "Sports", "Real Estate", "Services", "Kids & Babies", "Groceries"
]

dealer_names = ["TechHub", "GadgetStore", "AutoFix", "GlamHouse", "UniDeals", "CampusStyles", "Foodie", "FastConnect", "LuxuryAutos", "SmartHome"]
locations = ["UniAbuja Main Campus", "Veritas University", "Nile University", "Baze University", "Gwagwalada", "Ikeja, Lagos", "Lekki, Lagos", "Yaba, Lagos", "Surulere, Lagos", "Victoria Island"]

templates = {
    "Electronics": [
        ("iPhone {model}", 300000, 2000000, ["12", "13", "14", "15 Pro Max", "XR", "11"]),
        ("Samsung Galaxy {model}", 150000, 1500000, ["S21", "S22 Ultra", "S23", "S24", "A54", "Z Fold"]),
        ("MacBook {model}", 400000, 3000000, ["Air M1", "Pro M2", "Pro M3", "Air M2", "Pro Intel"]),
        ("HP {model}", 150000, 600000, ["EliteBook", "Pavilion", "Envy", "Spectre", "Victus"]),
        ("Sony {model}", 50000, 500000, ["Headphones XM4", "Headphones XM5", "PlayStation 5", "PlayStation 4"]),
    ],
    "Automotive": [
        ("Toyota {model}", 3000000, 15000000, ["Corolla", "Camry", "Highlander", "RAV4", "Sienna"]),
        ("Honda {model}", 2500000, 12000000, ["Civic", "Accord", "CR-V", "Pilot"]),
        ("Lexus {model}", 4000000, 25000000, ["RX350", "ES350", "GX460", "IS250"]),
        ("Mercedes {model}", 5000000, 40000000, ["C300", "E350", "GLK", "GLE"]),
    ],
    "Fashion": [
        ("Nike {model}", 20000, 150000, ["Air Force 1", "Dunk Low", "Jordan 1", "Air Max"]),
        ("Adidas {model}", 15000, 120000, ["Yeezy 350", "Ultraboost", "Superstar"]),
        ("Vintage {model}", 5000, 25000, ["T-Shirt", "Sweatshirt", "Jacket", "Jeans"]),
        ("Designer {model}", 50000, 500000, ["Handbag", "Watch", "Sunglasses", "Belts"]),
    ],
    "Home & Garden": [
        ("IKEA {model}", 15000, 150000, ["Table", "Chair", "Lamp", "Shelf"]),
        ("Gas Cooker {model}", 20000, 100000, ["2 Burner", "4 Burner", "Free Standing", "Table Top"]),
        ("Generator {model}", 150000, 800000, ["Sumec Firman", "Elepaq", "Honda", "Mikano"]),
        ("Mattress {model}", 40000, 250000, ["Orthopedic", "Foam", "King Size", "Student Size"]),
    ],
    "Beauty": [
        ("Wig {model}", 30000, 400000, ["Bone Straight", "Curly", "Bob", "Braided"]),
        ("Skincare {model}", 5000, 50000, ["Set", "Serum", "Cream", "Lotion"]),
        ("Makeup {model}", 3000, 30000, ["Palette", "Foundation", "Lipstick", "Kit"]),
    ],
    "Sports": [
        ("Football {model}", 5000, 20000, ["Jersey", "Ball", "Boots", "Kit"]),
        ("Gym {model}", 10000, 150000, ["Dumbbells", "Mat", "Bench", "Gloves"]),
        ("Bicycle {model}", 40000, 200000, ["Mountain", "Road", "Hybrid", "Electric"]),
    ],
    "Real Estate": [
        ("Apartment {model}", 200000, 5000000, ["Self Con", "One Bedroom", "Two Bedroom", "Duplex"]),
        ("Land {model}", 1000000, 50000000, ["Plot", "Half Plot", "Acre", "Estate"]),
        ("Hostel {model}", 100000, 500000, ["Space", "Room", "Bedspace", "Standard"]),
    ],
    "Services": [
        ("Photography {model}", 15000, 200000, ["Session", "Event", "Wedding", "Birthday"]),
        ("Web Design {model}", 50000, 500000, ["Landing Page", "E-commerce", "Portfolio", "Blog"]),
        ("Cleaning {model}", 5000, 50000, ["Room", "House", "Car", "Laundry"]),
        ("Hairdressing {model}", 3000, 30000, ["Braids", "Wig Install", "Barbing", "Retouch"]),
    ],
    "Kids & Babies": [
        ("Baby {model}", 10000, 150000, ["Stroller", "Cot", "Walker", "Clothes"]),
        ("Toy {model}", 2000, 50000, ["Car", "Doll", "Puzzle", "Lego"]),
        ("Diapers {model}", 5000, 25000, ["Pack", "Carton", "Wipes", "Cream"]),
    ],
    "Groceries": [
        ("Rice {model}", 30000, 80000, ["50kg", "25kg", "10kg", "Bag"]),
        ("Oil {model}", 5000, 30000, ["Vegetable", "Palm", "Groundnut", "Olive"]),
        ("Indomie {model}", 4000, 12000, ["Carton", "Hungry Man", "Super Pack", "Onion"]),
        ("Beverage {model}", 2000, 20000, ["Milo", "Milk", "Sugar", "Cornflakes"]),
    ]
}

images = {
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
}

listings = []
listing_id = 1

for category in categories:
    cat_templates = templates.get(category, [])
    if not cat_templates: continue
    
    for i in range(30):
        template, min_price, max_price, models = random.choice(cat_templates)
        model = random.choice(models)
        title = template.replace("{model}", model)
        price = random.randint(min_price, max_price) // 100 * 100 # Round to nearest 100
        location = random.choice(locations)
        dealer_name = random.choice(dealer_names)
        image = images.get(category)
        
        listing = {
            "_id": f"{category[:4].lower()}-{listing_id}",
            "title": title,
            "description": f"Quality {title} available for sale. Contact for more details. Best price guaranteed.",
            "price": price,
            "category": category,
            "images": [image],
            "location": location,
            "dealer": {
                "_id": f"d{random.randint(1, 20)}",
                "displayName": dealer_name,
                "isVerified": random.choice([True, False]),
                "shopType": random.choice(["physical", "online", "both"])
            }
        }
        listings.append(listing)
        listing_id += 1

# Output TS content
ts_content = """// Comprehensive mock data for MarketBridge listings - GENERATED 300+ ITEMS
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
}> = """ + json.dumps(listings, indent=4) + ";"

print(ts_content)
