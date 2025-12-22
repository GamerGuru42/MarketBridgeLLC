import { CATEGORIES } from '@/lib/categories';

// ... (existing imports)

// Removed local CATEGORIES constant

export default function ListingsPage() {
    // ... (existing state)

    // ... (existing fetch logic)

    // ... (within return)
                            <div className="md:col-span-2">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        type="text"
                                        placeholder="Search listings..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                            </div>
                            <Select value={category} onValueChange={setCategory}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Category" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="All Categories">All Categories</SelectItem>
                                    {CATEGORIES.map((cat) => (
                                        <SelectItem 
                                            key={cat.id} 
                                            value={cat.name}
                                            disabled={!cat.isActive}
                                        >
                                            {cat.name} {!cat.isActive && '(Soon)'}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button type="submit">Search</Button>
                        </form >
                    </CardContent >
                </Card >

        {/* Error State */ }
    {
        error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-8 text-destructive">
                {error}
            </div>
        )
    }

    {/* Loading State */ }
    {
        loading && (
            <div className="flex justify-center items-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    {/* Listings Grid */ }
    {
        !loading && listings.length > 0 && (
            <>
                <div className="mb-4 text-sm text-muted-foreground">
                    Showing {listings.length} {category !== 'All Categories' ? `${category} ` : ''}listing{listings.length !== 1 ? 's' : ''}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                    {listings.map((listing) => (
                        <Link key={listing.id} href={`/listings/${listing.id}`}>
                            <Card className="overflow-hidden hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer h-full flex flex-col">
                                <div className="aspect-square bg-muted relative overflow-hidden">
                                    {listing.images && listing.images.length > 0 ? (
                                        <Image
                                            src={listing.images[0]}
                                            alt={listing.title}
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                                            No Image
                                        </div>
                                    )}
                                    {listing.dealer?.is_verified && (
                                        <Badge className="absolute top-2 right-2 bg-primary">
                                            Verified
                                        </Badge>
                                    )}
                                </div>
                                <CardHeader className="p-4">
                                    <CardTitle className="text-lg line-clamp-1">{listing.title}</CardTitle>
                                    <p className="text-2xl font-bold text-primary">
                                        ₦{listing.price.toLocaleString()}
                                    </p>
                                </CardHeader>
                                <CardFooter className="p-4 pt-0 flex flex-col gap-2 mt-auto">
                                    <div className="flex justify-between items-center w-full text-sm text-muted-foreground">
                                        <span className="flex items-center gap-1">
                                            <MapPin className="h-3 w-3" />
                                            {listing.location || 'Nigeria'}
                                        </span>
                                        <Badge variant="outline">{listing.category}</Badge>
                                    </div>
                                    {listing.dealer?.store_type && (
                                        <div className="flex gap-1 w-full flex-wrap">
                                            {listing.dealer.store_type === 'physical' && (
                                                <Badge variant="secondary" className="text-xs flex items-center gap-1">
                                                    <Store className="h-3 w-3" />
                                                    Physical Store
                                                </Badge>
                                            )}
                                            {listing.dealer.store_type === 'online' && (
                                                <Badge variant="secondary" className="text-xs flex items-center gap-1">
                                                    <Globe className="h-3 w-3" />
                                                    Online Shop
                                                </Badge>
                                            )}
                                            {listing.dealer.store_type === 'both' && (
                                                <>
                                                    <Badge variant="secondary" className="text-xs flex items-center gap-1">
                                                        <Store className="h-3 w-3" />
                                                        Physical
                                                    </Badge>
                                                    <Badge variant="secondary" className="text-xs flex items-center gap-1">
                                                        <Globe className="h-3 w-3" />
                                                        Online
                                                    </Badge>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </CardFooter>
                            </Card>
                        </Link>
                    ))}
                </div>
            </>
        )
    }

    {/* Empty State */ }
    {
        !loading && listings.length === 0 && (
            <div className="text-center py-20">
                <p className="text-xl text-muted-foreground mb-4">No listings found</p>
                <p className="text-sm text-muted-foreground">Try adjusting your search filters</p>
            </div>
        )
    }
            </div >
        </div >
    );
}
