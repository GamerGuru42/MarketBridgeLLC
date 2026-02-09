import React from 'react';
import {
    Smartphone, Shirt, BookOpen, Utensils, Sparkles,
    Briefcase, Camera, Headphones, Coffee, Laptop, Globe
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
        name: 'Fashion',
        icon: Shirt,
        color: 'text-pink-500',
        bg: 'bg-pink-500/10',
        isActive: true,
        slug: 'fashion',
        description: 'Clothing, shoes, bags, and student styles.'
    },
    {
        id: 'gadgets',
        name: 'Gadgets',
        icon: Smartphone,
        color: 'text-blue-500',
        bg: 'bg-blue-500/10',
        isActive: true,
        slug: 'gadgets',
        description: 'Phones, laptops, chargers, and tech essentials.'
    },
    {
        id: 'food',
        name: 'Food',
        icon: Utensils,
        color: 'text-orange-500',
        bg: 'bg-orange-500/10',
        isActive: true,
        slug: 'food',
        description: 'Campus meals, snacks, and treats.'
    },
    {
        id: 'services',
        name: 'Services',
        icon: Briefcase,
        color: 'text-purple-500',
        bg: 'bg-purple-500/10',
        isActive: true,
        slug: 'services',
        description: 'Hair styling, makeup, photography, and tutoring.'
    },
    {
        id: 'accessories',
        name: 'Accessories',
        icon: Sparkles,
        color: 'text-rose-500',
        bg: 'bg-rose-500/10',
        isActive: true,
        slug: 'accessories',
        description: 'Jewelry, watches, and campus vanity.'
    },
    {
        id: 'others',
        name: 'Others',
        icon: Globe,
        color: 'text-zinc-500',
        bg: 'bg-zinc-500/10',
        isActive: true,
        slug: 'others',
        description: 'Miscellaneous items for student life.'
    }
];
