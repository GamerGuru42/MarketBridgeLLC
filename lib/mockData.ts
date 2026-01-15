// Comprehensive mock data for MarketBridge listings
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
}> = [
        // Electronics (15 items)
        {
            _id: 'elec-1',
            title: 'iPhone 15 Pro Max 256GB',
            description: 'Brand new, sealed box. Natural Titanium. 1 year warranty.',
            price: 1850000,
            category: 'Electronics',
            images: ['https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=800&q=80'],
            location: 'Ikeja, Lagos',
            dealer: { _id: 'd1', displayName: 'TechHub Nigeria', isVerified: true, shopType: 'both' }
        },
        {
            _id: 'elec-2',
            title: 'MacBook Pro M3 16" 1TB',
            description: 'Latest 2024 model. Space Black. AppleCare+ included.',
            price: 2400000,
            category: 'Electronics',
            images: ['https://images.unsplash.com/photo-1517336714731-489689fd1ca4?auto=format&fit=crop&w=800&q=80'],
            location: 'Yaba, Lagos',
            dealer: { _id: 'd2', displayName: 'Apple Store Lagos', isVerified: true, shopType: 'physical' }
        },
        {
            _id: 'elec-3',
            title: 'Sony PS5 Disc Edition',
            description: 'Brand new console with 2 controllers and 3 games.',
            price: 650000,
            category: 'Electronics',
            images: ['https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?auto=format&fit=crop&w=800&q=80'],
            location: 'Lekki, Lagos',
            dealer: { _id: 'd3', displayName: 'GameZone', isVerified: true, shopType: 'both' }
        },
        {
            _id: 'elec-4',
            title: 'Samsung 65" QLED 4K Smart TV',
            description: '2024 model, quantum dot technology, smart features.',
            price: 980000,
            category: 'Electronics',
            images: ['https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=800&q=80'],
            location: 'Surulere, Lagos',
            dealer: { _id: 'd4', displayName: 'Samsung Nigeria', isVerified: true, shopType: 'physical' }
        },
        {
            _id: 'elec-5',
            title: 'Dell XPS 15 Laptop i7 32GB',
            description: 'Business laptop, excellent condition, barely used.',
            price: 1200000,
            category: 'Electronics',
            images: ['https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=800&q=80'],
            location: 'Abuja',
            dealer: { _id: 'd5', displayName: 'LaptopWorld', isVerified: true, shopType: 'online' }
        },
        {
            _id: 'elec-6',
            title: 'iPad Pro 12.9" M2 Chip 512GB',
            description: 'With Magic Keyboard and Apple Pencil 2.',
            price: 1450000,
            category: 'Electronics',
            images: ['https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=800&q=80'],
            location: 'Victoria Island, Lagos',
            dealer: { _id: 'd1', displayName: 'TechHub Nigeria', isVerified: true, shopType: 'both' }
        },
        {
            _id: 'elec-7',
            title: 'Canon EOS R6 Mark II Camera',
            description: 'Professional mirrorless camera with 24-105mm lens.',
            price: 3200000,
            category: 'Electronics',
            images: ['https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80'],
            location: 'Ikoyi, Lagos',
            dealer: { _id: 'd6', displayName: 'Camera Pro', isVerified: true, shopType: 'physical' }
        },
        {
            _id: 'elec-8',
            title: 'Bose QuietComfort 45 Headphones',
            description: 'Noise-cancelling wireless headphones, black.',
            price: 285000,
            category: 'Electronics',
            images: ['https://images.unsplash.com/photo-1545127398-14699f92334b?auto=format&fit=crop&w=800&q=80'],
            location: 'Ikeja, Lagos',
            dealer: { _id: 'd7', displayName: 'Audio Excellence', isVerified: true, shopType: 'both' }
        },
        {
            _id: 'elec-9',
            title: 'Nintendo Switch OLED',
            description: 'White edition with Mario Kart 8 Deluxe.',
            price: 320000,
            category: 'Electronics',
            images: ['https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?auto=format&fit=crop&w=800&q=80'],
            location: 'Lekki, Lagos',
            dealer: { _id: 'd3', displayName: 'GameZone', isVerified: true }
        },
        {
            _id: 'elec-10',
            title: 'LG 27" UltraGear Gaming Monitor',
            description: '165Hz, 1ms response time, HDR10.',
            price: 420000,
            category: 'Electronics',
            images: ['https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=800&q=80'],
            location: 'Ajah, Lagos',
            dealer: { _id: 'd8', displayName: 'Tech Paradise', isVerified: true, shopType: 'online' }
        },

        // Automotive (10 items)
        {
            _id: 'auto-1',
            title: 'Toyota Camry 2021 LE',
            description: 'Foreign used, clean title, full option.',
            price: 15000000,
            category: 'Automotive',
            images: ['https://images.unsplash.com/photo-1621007947382-bb3c3968e3bb?auto=format&fit=crop&w=800&q=80'],
            location: 'Victoria Island, Lagos',
            dealer: { _id: 'd9', displayName: 'AutoKing Motors', isVerified: true, shopType: 'physical' }
        },
        {
            _id: 'auto-2',
            title: 'Mercedes-Benz C300 2020',
            description: 'Luxury sedan, low mileage, pristine condition.',
            price: 28000000,
            category: 'Automotive',
            images: ['https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=800&q=80'],
            location: 'Lekki, Lagos',
            dealer: { _id: 'd10', displayName: 'Luxury Auto', isVerified: true, shopType: 'physical' }
        },
        {
            _id: 'auto-3',
            title: 'Honda CR-V 2022 EX',
            description: 'SUV, barely used, full maintenance history.',
            price: 18500000,
            category: 'Automotive',
            images: ['https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=800&q=80'],
            location: 'Abuja',
            dealer: { _id: 'd11', displayName: 'Honda Abuja', isVerified: true }
        },
        {
            _id: 'auto-4',
            title: 'Lexus RX 350 2019',
            description: 'Premium SUV, Nigerian used, excellent condition.',
            price: 32000000,
            category: 'Automotive',
            images: ['https://images.unsplash.com/photo-1563720359914-86e8fbb1e0bc?auto=format&fit=crop&w=800&q=80'],
            location: 'Ikoyi, Lagos',
            dealer: { _id: 'd12', displayName: 'Lexus Lagos', isVerified: true }
        },
        {
            _id: 'auto-5',
            title: 'Ford Explorer 2021 XLT',
            description: '7-seater family SUV, accident-free.',
            price: 22000000,
            category: 'Automotive',
            images: ['https://images.unsplash.com/photo-1619767886558-efdc259cde1a?auto=format&fit=crop&w=800&q=80'],
            location: 'Port Harcourt',
            dealer: { _id: 'd13', displayName: 'PH Auto Mart', isVerified: true }
        },

        // Fashion (12 items)
        {
            _id: 'fash-1',
            title: 'Nike Air Jordan 1 High Size 42',
            description: 'Authentic sneakers, brand new in box.',
            price: 120000,
            category: 'Fashion',
            images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80'],
            location: 'Surulere, Lagos',
            dealer: { _id: 'd14', displayName: 'Sneaker Hub', isVerified: true }
        },
        {
            _id: 'fash-2',
            title: 'Gucci Marmont Shoulder Bag',
            description: 'Genuine leather, black with gold hardware.',
            price: 850000,
            category: 'Fashion',
            images: ['https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80'],
            location: 'Lekki, Lagos',
            dealer: { _id: 'd15', displayName: 'Luxury Bags Nigeria', isVerified: true }
        },
        {
            _id: 'fash-3',
            title: 'Swiss Watch Rolex Datejust',
            description: 'Authentic timepiece with papers and box.',
            price: 8500000,
            category: 'Fashion',
            images: ['https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&w=800&q=80'],
            location: 'Victoria Island, Lagos',
            dealer: { _id: 'd16', displayName: 'Watch Gallery', isVerified: true }
        },
        {
            _id: 'fash-4',
            title: 'Tommy Hilfiger Men\'s Suit 3-Piece',
            description: 'Navy blue, slim fit, size 48.',
            price: 185000,
            category: 'Fashion',
            images: ['https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=800&q=80'],
            location: 'Ikeja, Lagos',
            dealer: { _id: 'd17', displayName: 'Formal Wear NG', isVerified: true }
        },
        {
            _id: 'fash-5',
            title: 'Adidas Ultraboost 22 Running Shoes',
            description: 'Comfortable running shoes, size 40-45 available.',
            price: 85000,
            category: 'Fashion',
            images: ['https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=800&q=80'],
            location: 'Yaba, Lagos',
            dealer: { _id: 'd18', displayName: 'Sports Fashion', isVerified: true }
        },

        // Home & Garden (10 items)
        {
            _id: 'home-1',
            title: 'Luxury Italian Leather Sofa 7-Seater',
            description: 'Premium quality, L-shaped, grey color.',
            price: 3500000,
            category: 'Home & Garden',
            images: ['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80'],
            location: 'Ikoyi, Lagos',
            dealer: { _id: 'd19', displayName: 'Furniture Palace', isVerified: true }
        },
        {
            _id: 'home-2',
            title: 'Samsung French Door Refrigerator',
            description: '28 cu. ft., stainless steel, energy efficient.',
            price: 1200000,
            category: 'Home & Garden',
            images: ['https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?auto=format&fit=crop&w=800&q=80'],
            location: 'Surulere, Lagos',
            dealer: { _id: 'd20', displayName: 'Home Appliances NG', isVerified: true }
        },
        {
            _id: 'home-3',
            title: 'King Size Orthopedic Mattress',
            description: 'Memory foam, 12-inch thickness, premium quality.',
            price: 380000,
            category: 'Home & Garden',
            images: ['https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=800&q=80'],
            location: 'Ikeja, Lagos',
            dealer: { _id: 'd21', displayName: 'Comfort Sleep', isVerified: true }
        },
        {
            _id: 'home-4',
            title: 'Dining Table Set 6-Seater Marble Top',
            description: 'Modern design with upholstered chairs.',
            price: 850000,
            category: 'Home & Garden',
            images: ['https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=800&q=80'],
            location: 'Lekki, Lagos',
            dealer: { _id: 'd19', displayName: 'Furniture Palace', isVerified: true }
        },

        // Beauty (8 items)
        {
            _id: 'beauty-1',
            title: 'Dyson Airwrap Complete',
            description: 'Hair styling tool, all attachments included.',
            price: 420000,
            category: 'Beauty',
            images: ['https://images.unsplash.com/photo-1522338242992-e1a54906a8da?auto=format&fit=crop&w=800&q=80'],
            location: 'Victoria Island, Lagos',
            dealer: { _id: 'd22', displayName: 'Beauty Tech', isVerified: true }
        },
        {
            _id: 'beauty-2',
            title: 'Fenty Beauty Pro Filt\'r Foundation Set',
            description: 'Complete makeup collection, various shades.',
            price: 125000,
            category: 'Beauty',
            images: ['https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=800&q=80'],
            location: 'Lekki, Lagos',
            dealer: { _id: 'd23', displayName: 'Glam Beauty Store', isVerified: true }
        },

        // Sports (6 items)
        {
            _id: 'sport-1',
            title: 'Professional Treadmill with Incline',
            description: 'Commercial grade, LCD display, foldable.',
            price: 950000,
            category: 'Sports',
            images: ['https://images.unsplash.com/photo-1576678927484-cc907957088c?auto=format&fit=crop&w=800&q=80'],
            location: 'Yaba, Lagos',
            dealer: { _id: 'd24', displayName: 'Fitness World', isVerified: true }
        },
        {
            _id: 'sport-2',
            title: 'Complete Home Gym Set',
            description: 'Dumbbells, bench, rack, and weights.',
            price: 680000,
            category: 'Sports',
            images: ['https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80'],
            location: 'Ikeja, Lagos',
            dealer: { _id: 'd24', displayName: 'Fitness World', isVerified: true }
        },

        // Real Estate (5 items)
        {
            _id: 'estate-1',
            title: '3 Bedroom Apartment Lekki Phase 1',
            description: 'Serviced apartment, pool, gym, 24hr security.',
            price: 85000000,
            category: 'Real Estate',
            images: ['https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80'],
            location: 'Lekki Phase 1, Lagos',
            dealer: { _id: 'd25', displayName: 'Prime Properties', isVerified: true }
        },
        {
            _id: 'estate-2',
            title: '5 Bedroom Duplex Banana Island',
            description: 'Luxury waterfront property, fully furnished.',
            price: 450000000,
            category: 'Real Estate',
            images: ['https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80'],
            location: 'Banana Island, Lagos',
            dealer: { _id: 'd26', displayName: 'Elite Homes', isVerified: true }
        },

        // Services (8 items)
        {
            _id: 'service-1',
            title: 'Professional Photography Package',
            description: 'Event coverage, pre-wedding, portraits.',
            price: 250000,
            category: 'Services',
            images: ['https://images.unsplash.com/photo-1554048612-b6a482bc67e5?auto=format&fit=crop&w=800&q=80'],
            location: 'Lagos Mainland',
            dealer: { _id: 'd27', displayName: 'Capture Moments', isVerified: true }
        },
        {
            _id: 'service-2',
            title: 'Web Development - Full Stack',
            description: 'Custom website, mobile-responsive, SEO optimized.',
            price: 1500000,
            category: 'Services',
            images: ['https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80'],
            location: 'Remote',
            dealer: { _id: 'd28', displayName: 'CodeCraft NG', isVerified: true }
        },

        // Kids & Babies (6 items)
        {
            _id: 'kids-1',
            title: 'Baby Stroller 3-in-1 System',
            description: 'Convertible, car seat included, travel system.',
            price: 285000,
            category: 'Kids & Babies',
            images: ['https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=800&q=80'],
            location: 'Ikeja, Lagos',
            dealer: { _id: 'd29', displayName: 'Baby Essentials', isVerified: true }
        },
        {
            _id: 'kids-2',
            title: 'Educational Tablet for Kids',
            description: 'Pre-loaded learning apps, parental controls.',
            price: 85000,
            category: 'Kids & Babies',
            images: ['https://images.unsplash.com/photo-1587826080692-f439cd0b70da?auto=format&fit=crop&w=800&q=80'],
            location: 'Yaba, Lagos',
            dealer: { _id: 'd30', displayName: 'Kids Tech Store', isVerified: true }
        },

        // Groceries (5 items)
        {
            _id: 'groc-1',
            title: 'Organic Rice 50kg Bag',
            description: 'Premium long-grain white rice, Nigerian grown.',
            price: 42000,
            category: 'Groceries',
            images: ['https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=800&q=80'],
            location: 'Oshodi, Lagos',
            dealer: { _id: 'd31', displayName: 'Fresh Farms NG', isVerified: true }
        },
        {
            _id: 'groc-2',
            title: 'Premium Frozen Chicken 10kg',
            description: 'Quality poultry, hygienically processed.',
            price: 28000,
            category: 'Groceries',
            images: ['https://images.unsplash.com/photo-1587593810167-a84920ea0781?auto=format&fit=crop&w=800&q=80'],
            location: 'Surulere, Lagos',
            dealer: { _id: 'd32', displayName: 'Meat Market', isVerified: true }
        },
    ];
