/**
 * MarketBridge AI Search & Recommendation System
 * Provides intelligent search with typo tolerance and semantic matching
 */

import { createClient } from '@/lib/supabase/client';

// Category synonyms and related terms
const CATEGORY_SYNONYMS: Record<string, string[]> = {
    'Electronics': ['phone', 'laptop', 'computer', 'tablet', 'gadget', 'tech', 'device', 'charger', 'headphone', 'speaker'],
    'Fashion': ['cloth', 'clothes', 'shirt', 'dress', 'shoe', 'shoes', 'sneaker', 'bag', 'wear', 'outfit', 'trouser', 'jean', 'jacket'],
    'Beauty': ['makeup', 'cosmetic', 'skincare', 'perfume', 'fragrance', 'wig', 'wigs', 'hair', 'nail', 'beauty'],
    'Books': ['book', 'textbook', 'novel', 'journal', 'note', 'study', 'material', 'pdf', 'ebook'],
    'Sports': ['fitness', 'gym', 'sport', 'exercise', 'ball', 'equipment', 'jersey', 'athletic'],
    'Food': ['snack', 'food', 'meal', 'drink', 'beverage', 'catering'],
    'Automotive': ['car', 'vehicle', 'motor', 'bike', 'motorcycle', 'auto', 'parts'],
};

// Common typos and corrections
const COMMON_TYPOS: Record<string, string> = {
    'phon': 'phone',
    'lapto': 'laptop',
    'sho': 'shoe',
    'clothe': 'clothes',
    'buk': 'book',
    'wig': 'wig', // Ensure wig doesn't map to anything else
    'wigs': 'wig',
    'shose': 'shoes',
    'shues': 'shoes',
    'fone': 'phone',
    'computr': 'computer',
};

interface SearchResult {
    id: string;
    dealer_id: string;
    title: string;
    description: string;
    category: string;
    price: number;
    images: string[];
    status: string;
    location: string | null;
    created_at: string;
    make?: string;
    model?: string;
    year?: number;
    condition?: string;
    is_verified_listing?: boolean;
    verification_status?: string;
    dealer?: {
        id: string;
        display_name: string;
        is_verified: boolean;
        store_type?: 'physical' | 'online' | 'both';
    };
    relevanceScore: number;
}

/**
 * Normalize search query (remove extra spaces, lowercase, fix typos)
 */
function normalizeQuery(query: string): string {
    let normalized = query.toLowerCase().trim();

    // Fix common typos
    for (const [typo, correction] of Object.entries(COMMON_TYPOS)) {
        const regex = new RegExp(`\\b${typo}\\b`, 'gi');
        normalized = normalized.replace(regex, correction);
    }

    return normalized;
}

/**
 * Detect category from query
 */
function detectCategory(query: string): string | null {
    const normalizedQuery = normalizeQuery(query);

    for (const [category, terms] of Object.entries(CATEGORY_SYNONYMS)) {
        for (const term of terms) {
            if (normalizedQuery.includes(term)) {
                return category;
            }
        }
    }

    return null;
}

/**
 * Calculate relevance score using multiple factors
 */
function calculateRelevance(listing: any, query: string, detectedCategory: string | null): number {
    let score = 0;
    const normalizedQuery = normalizeQuery(query);
    const titleLower = listing.title.toLowerCase();
    const descLower = (listing.description || '').toLowerCase();

    // Exact title match (highest score)
    if (titleLower === normalizedQuery) {
        score += 100;
    }

    // Title starts with query
    else if (titleLower.startsWith(normalizedQuery)) {
        score += 80;
    }

    // Query words appear in title
    else if (titleLower.includes(normalizedQuery)) {
        score += 60;
    }

    // Query words in description
    if (descLower.includes(normalizedQuery)) {
        score += 20;
    }

    // Category match
    if (detectedCategory && listing.category === detectedCategory) {
        score += 30;
    }

    // Verified listings boost
    if (listing.is_verified_listing) {
        score += 10;
    }

    // Verified dealer boost
    if (listing.dealer?.is_verified) {
        score += 5;
    }

    // Recency boost (newer listings slightly preferred)
    const daysOld = (Date.now() - new Date(listing.created_at).getTime()) / (1000 * 60 * 60 * 24);
    if (daysOld < 7) {
        score += 5;
    }

    return score;
}

/**
 * AI-powered intelligent search
 */
export async function intelligentSearch(params: {
    query: string;
    category?: string;
    location?: string;
    minPrice?: number;
    maxPrice?: number;
    limit?: number;
}): Promise<SearchResult[]> {
    const { query, category, location, minPrice, maxPrice, limit = 50 } = params;

    const supabase = createClient();
    const normalizedQuery = normalizeQuery(query);
    const detectedCategory = category || detectCategory(query);

    // Build base query
    let dbQuery = supabase
        .from('listings')
        .select(`
            *,
            dealer:users!listings_dealer_id_fkey(
                id,
                display_name,
                is_verified,
                store_type
            )
        `)
        .eq('status', 'active');

    // Apply category filter if detected or specified
    if (detectedCategory) {
        dbQuery = dbQuery.eq('category', detectedCategory);
    }

    // Apply location filter
    if (location) {
        dbQuery = dbQuery.ilike('location', `%${location}%`);
    }

    // Apply price filters
    if (minPrice !== undefined) {
        dbQuery = dbQuery.gte('price', minPrice);
    }
    if (maxPrice !== undefined) {
        dbQuery = dbQuery.lte('price', maxPrice);
    }

    // Full-text search on title and description
    dbQuery = dbQuery.or(`title.ilike.%${normalizedQuery}%,description.ilike.%${normalizedQuery}%`);

    const { data, error } = await dbQuery.limit(limit * 2); // Fetch more for scoring

    if (error) {
        console.error('Search error:', error);
        return [];
    }

    if (!data || data.length === 0) {
        // Fallback: Try broader searchif no results
        const fallbackQuery = await supabase
            .from('listings')
            .select(`
                *,
                dealer:users!listings_dealer_id_fkey(
                    id,
                    display_name,
                    is_verified,
                    store_type
                )
            `)
            .eq('status', 'active')
            .limit(20);

        if (fallbackQuery.data) {
            return fallbackQuery.data.slice(0, limit);
        }
        return [];
    }

    // Score and sort results
    const scoredResults = data.map(listing => ({
        ...listing,
        relevanceScore: calculateRelevance(listing, query, detectedCategory)
    }))
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, limit);

    return scoredResults;
}

/**
 * Get search suggestions (autocomplete)
 */
export async function getSearchSuggestions(query: string, limit: number = 5): Promise<string[]> {
    if (!query || query.length < 2) return [];

    const supabase = createClient();
    const normalizedQuery = normalizeQuery(query);

    const { data } = await supabase
        .from('listings')
        .select('title')
        .ilike('title', `%${normalizedQuery}%`)
        .eq('status', 'active')
        .limit(limit);

    if (!data) return [];

    // Extract unique suggestions
    const suggestions = [...new Set(data.map(item => item.title))];
    return suggestions.slice(0, limit);
}

/**
 * Get related/recommended listings based on a listing
 */
export async function getRelatedListings(listingId: string, limit: number = 6): Promise<any[]> {
    const supabase = createClient();

    // Get the current listing
    const { data: currentListing } = await supabase
        .from('listings')
        .select('category, price, title')
        .eq('id', listingId)
        .single();

    if (!currentListing) return [];

    // Find similar listings in same category with similar price range
    const priceMin = currentListing.price * 0.7; // 30% lower
    const priceMax = currentListing.price * 1.3; // 30% higher

    const { data } = await supabase
        .from('listings')
        .select(`
            *,
            dealer:users!listings_dealer_id_fkey(
                id,
                display_name,
                is_verified
            )
        `)
        .eq('category', currentListing.category)
        .eq('status', 'active')
        .neq('id', listingId)
        .gte('price', priceMin)
        .lte('price', priceMax)
        .limit(limit);

    return data || [];
}

/**
 * Track search analytics
 */
export async function trackSearch(params: {
    userId?: string;
    query: string;
    resultsCount: number;
    selectedListingId?: string;
}): Promise<void> {
    const supabase = createClient();

    try {
        await supabase.from('search_analytics').insert({
            user_id: params.userId,
            query: params.query.toLowerCase(),
            results_count: params.resultsCount,
            selected_listing_id: params.selectedListingId,
            searched_at: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Failed to track search:', error);
        // Don't throw - analytics failure shouldn't break search
    }
}
