'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, MapPin, Star, Store, Globe, Building } from 'lucide-react';
import Link from 'next/link';
import { VerificationBadge } from '@/components/VerificationBadge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export default function FindDealersPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [locationFilter, setLocationFilter] = useState('');
    const [storeTypeFilter, setStoreTypeFilter] = useState('all');

    // Mock data for dealers
    const dealers = [
        {
            id: 1,
            name: "Abuja Elite Motors",
            location: "Maitama, Abuja",
            rating: 4.9,
            reviews: 128,
            verified: true,
            specialty: "Luxury Vehicles",
            storeType: "Physical",
            description: "Premium retailer for luxury and exotic cars with full inspection reports."
        },
        {
            id: 2,
            name: "Garki Auto World",
            location: "Garki Area 1, Abuja",
            rating: 4.7,
            reviews: 85,
            verified: true,
            specialty: "Japanese Vehicles",
            storeType: "Hybrid",
            description: "Specializing in certified used Toyota, Honda, and Nissan vehicles."
        },
        {
            id: 3,
            name: "Wuse Car Mart",
            location: "Wuse II, Abuja",
            rating: 4.5,
            reviews: 42,
            verified: true,
            specialty: "Everyday Cars",
            storeType: "Online",
            description: "Quality affordable used cars for everyday commuting and family use."
        },
        {
            id: 4,
            name: "Capital Wheels",
            location: "Asokoro, Abuja",
            rating: 4.8,
            reviews: 210,
            verified: true,
            specialty: "European Imports",
            storeType: "Physical",
            description: "Best deals on Mercedes-Benz, BMW, and Audi imports in Abuja."
        },
        {
            id: 5,
            name: "Reliable Auto Hub",
            location: "Kuje, Abuja",
            rating: 4.6,
            reviews: 67,
            verified: true,
            specialty: "Used SUVs",
            storeType: "Online",
            description: "Rugged and reliable used SUVs and 4x4 vehicles for Nigerian roads."
        }
    ];

    const filteredDealers = dealers.filter(dealer => {
        const matchesSearch = dealer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            dealer.specialty.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesLocation = dealer.location.toLowerCase().includes(locationFilter.toLowerCase());
        const matchesStoreType = storeTypeFilter === 'all' || dealer.storeType.toLowerCase() === storeTypeFilter.toLowerCase();

        return matchesSearch && matchesLocation && matchesStoreType;
    });

    const getStoreIcon = (type: string) => {
        switch (type) {
            case 'Online': return <Globe className="h-3 w-3" />;
            case 'Physical': return <Store className="h-3 w-3" />;
            case 'Hybrid': return <Building className="h-3 w-3" />;
            default: return <Store className="h-3 w-3" />;
        }
    };

    return (
        <div className="container mx-auto py-12 px-4">
            <div className="text-center max-w-2xl mx-auto mb-12">
                <h1 className="text-4xl font-bold mb-4">Find Verified Car Dealerships</h1>
                <p className="text-muted-foreground text-lg mb-8">
                    Connect with trusted automobile dealers in Abuja and across Nigeria. Every dealer on this list is verified for authenticity and reliability.
                </p>

                <div className="flex flex-col md:flex-row gap-4 max-w-2xl mx-auto">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by name or category..."
                            className="pl-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="relative flex-1">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Filter by location (e.g. Lagos)"
                            className="pl-10"
                            value={locationFilter}
                            onChange={(e) => setLocationFilter(e.target.value)}
                        />
                    </div>
                    <div className="w-full md:w-48">
                        <Select value={storeTypeFilter} onValueChange={setStoreTypeFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder="Store Type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Types</SelectItem>
                                <SelectItem value="physical">Physical Store</SelectItem>
                                <SelectItem value="online">Online Store</SelectItem>
                                <SelectItem value="hybrid">Hybrid</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredDealers.map((dealer) => (
                    <Card key={dealer.id} className="hover:shadow-md transition-shadow">
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-xl flex items-center gap-2">
                                        {dealer.name}
                                        <VerificationBadge isVerified={dealer.verified} showText={false} size="sm" />
                                    </CardTitle>
                                    <CardDescription className="flex items-center gap-1 mt-1">
                                        <MapPin className="h-3 w-3" /> {dealer.location}
                                    </CardDescription>
                                </div>
                                <Badge variant="outline" className="flex items-center gap-1">
                                    {getStoreIcon(dealer.storeType)}
                                    {dealer.storeType}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="mb-2">
                                <Badge variant="secondary">{dealer.specialty}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-4">{dealer.description}</p>
                            <div className="flex items-center gap-1 text-sm font-medium">
                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                <span>{dealer.rating}</span>
                                <span className="text-muted-foreground">({dealer.reviews} reviews)</span>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button className="w-full" variant="outline" asChild>
                                <Link href={`/dealer/${dealer.id}`}>View Profile</Link>
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>

            {filteredDealers.length === 0 && (
                <div className="text-center py-12">
                    <p className="text-muted-foreground text-lg">No dealers found matching your criteria.</p>
                </div>
            )}
        </div>
    );
}
