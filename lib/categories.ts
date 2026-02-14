import React from 'react';
import {
    Smartphone, Shirt, BookOpen, Utensils, Sparkles,
    Briefcase, Laptop, Home, Car, Armchair
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
        id: 'gadgets',
        name: 'Gadgets',
        icon: Smartphone,
        color: 'text-blue-500',
        bg: 'bg-blue-500/10',
        isActive: true,
        slug: 'gadgets',
        description: 'Phones, tablets, and tech essentials.'
    },
    {
        id: 'laptops',
        name: 'Laptops',
        icon: Laptop,
        color: 'text-indigo-500',
        bg: 'bg-indigo-500/10',
        isActive: true,
        slug: 'laptops',
        description: 'High-performance laptops for students.'
    },
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
        id: 'vehicles',
        name: 'Vehicles',
        icon: Car,
        color: 'text-red-500',
        bg: 'bg-red-500/10',
        isActive: true,
        slug: 'vehicles',
        description: 'Cars, motorcycles, and easy mobility.'
    },
    {
        id: 'properties',
        name: 'Properties',
        icon: Home,
        color: 'text-green-500',
        bg: 'bg-green-500/10',
        isActive: true,
        slug: 'properties',
        description: 'Student accommodation and rentals.'
    },
    {
        id: 'furniture',
        name: 'Furniture',
        icon: Armchair,
        color: 'text-amber-600',
        bg: 'bg-amber-600/10',
        isActive: true,
        slug: 'furniture',
        description: 'Home decor and comfortable living.'
    },
    {
        id: 'books',
        name: 'Books',
        icon: BookOpen,
        color: 'text-emerald-600',
        bg: 'bg-emerald-600/10',
        isActive: true,
        slug: 'books',
        description: 'Textbooks, novels, and academic resources.'
    },
    {
        id: 'beauty',
        name: 'Beauty',
        icon: Sparkles,
        color: 'text-rose-500',
        bg: 'bg-rose-500/10',
        isActive: true,
        slug: 'beauty',
        description: 'Skincare, makeup, and personal care.'
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
        description: 'Professional services and campus gigs.'
    }
];
