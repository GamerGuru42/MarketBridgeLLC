import React from 'react';
import {
    Smartphone, Shirt, BookOpen, Utensils, Sparkles,
    Briefcase, Camera, Headphones, Coffee, Laptop
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
        id: 'fashion',
        name: 'Fashion & Wears',
        icon: Shirt,
        color: 'text-pink-500',
        bg: 'bg-pink-500/10',
        isActive: true,
        locked: false,
        slug: 'fashion',
        description: 'Clothing, shoes, bags, and campus style.'
    },
    {
        id: 'gadgets',
        name: 'Student Gadgets',
        icon: Smartphone,
        color: 'text-blue-500',
        bg: 'bg-blue-500/10',
        isActive: true,
        locked: false,
        slug: 'gadgets',
        description: 'Phones, chargers, power banks, and accessories.'
    },
    {
        id: 'food',
        name: 'Food & Snacks',
        icon: Utensils,
        color: 'text-orange-500',
        bg: 'bg-orange-500/10',
        isActive: true,
        locked: false,
        slug: 'food',
        description: 'Campus deliveries, homemade meals, and snacks.'
    },
    {
        id: 'services',
        name: 'Campus Services',
        icon: Briefcase,
        color: 'text-purple-500',
        bg: 'bg-purple-500/10',
        isActive: true,
        locked: false,
        slug: 'services',
        description: 'Hair styling, makeup, photography, repairs, tutoring.'
    },
    {
        id: 'beauty',
        name: 'Beauty & Care',
        icon: Sparkles,
        color: 'text-rose-500',
        bg: 'bg-rose-500/10',
        isActive: true,
        locked: false,
        slug: 'beauty',
        description: 'Skincare, wigs, cosmetics, and grooming.'
    },
    {
        id: 'education',
        name: 'Books & Materials',
        icon: BookOpen,
        color: 'text-emerald-500',
        bg: 'bg-emerald-500/10',
        isActive: true,
        locked: false,
        slug: 'education',
        description: 'Textbooks, handouts, and stationery.'
    },
    {
        id: 'laptops',
        name: 'Laptops & Tech',
        icon: Laptop,
        color: 'text-cyan-500',
        bg: 'bg-cyan-500/10',
        isActive: true,
        locked: false,
        slug: 'laptops',
        description: 'Used/New laptops and computer accessories.'
    }
];
