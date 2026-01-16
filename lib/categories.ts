import {
    Smartphone, Shirt, Home, Car, Sparkles,
    Dumbbell, Building2, Briefcase, Baby, ShoppingBasket
} from 'lucide-react';

export interface Category {
    id: string;
    name: string;
    icon: React.ElementType;
    color: string;
    bg: string;
    isActive: boolean;
    locked?: boolean;
    description: string;
    slug: string;
}

export const CATEGORIES: Category[] = [
    {
        id: 'automotive',
        name: 'Automotive',
        icon: Car,
        color: 'text-orange-500',
        bg: 'bg-orange-500/10',
        isActive: true,
        locked: false,
        slug: 'automotive',
        description: 'New and used cars from verified dealers. All sizes of businesses welcome.'
    },
    {
        id: 'electronics',
        name: 'Electronics',
        icon: Smartphone,
        color: 'text-blue-500',
        bg: 'bg-blue-500/10',
        isActive: true,
        locked: false,
        slug: 'electronics',
        description: 'Gadgets, phones, and computers.'
    },
    {
        id: 'fashion',
        name: 'Fashion',
        icon: Shirt,
        color: 'text-pink-500',
        bg: 'bg-pink-500/10',
        isActive: false,
        locked: true,
        slug: 'fashion',
        description: 'Clothing, shoes, and accessories.'
    },
    {
        id: 'home-garden',
        name: 'Home & Garden',
        icon: Home,
        color: 'text-green-500',
        bg: 'bg-green-500/10',
        isActive: false,
        locked: true,
        slug: 'home-garden',
        description: 'Furniture, decor, and appliances.'
    },
    {
        id: 'beauty',
        name: 'Beauty',
        icon: Sparkles,
        color: 'text-purple-500',
        bg: 'bg-purple-500/10',
        isActive: false,
        locked: true,
        slug: 'beauty',
        description: 'Cosmetics, skincare, and personal care.'
    },
    {
        id: 'sports',
        name: 'Sports',
        icon: Dumbbell,
        color: 'text-red-500',
        bg: 'bg-red-500/10',
        isActive: false,
        locked: true,
        slug: 'sports',
        description: 'Gym equipment and sportswear.'
    },
    {
        id: 'real-estate',
        name: 'Real Estate',
        icon: Building2,
        color: 'text-cyan-500',
        bg: 'bg-cyan-500/10',
        isActive: false,
        locked: true,
        slug: 'real-estate',
        description: 'Properties for rent and sale.'
    },
    {
        id: 'services',
        name: 'Services',
        icon: Briefcase,
        color: 'text-slate-500',
        bg: 'bg-slate-500/10',
        isActive: true,
        locked: false,
        slug: 'services',
        description: 'Professional services and freelancers.'
    },
    {
        id: 'kids-babies',
        name: 'Kids & Babies',
        icon: Baby,
        color: 'text-yellow-500',
        bg: 'bg-yellow-500/10',
        isActive: false,
        locked: true,
        slug: 'kids-babies',
        description: 'Toys, clothing, and essentials.'
    },
    {
        id: 'groceries',
        name: 'Groceries',
        icon: ShoppingBasket,
        color: 'text-emerald-500',
        bg: 'bg-emerald-500/10',
        isActive: false,
        locked: true,
        slug: 'groceries',
        description: 'Fresh produce and daily essentials.'
    },
];
