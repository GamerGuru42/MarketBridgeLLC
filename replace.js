const fs = require('fs');
const file = 'c:/Users/Benny Ben/Documents/MarketBridgeLLC/components/listings/ListingDetailContent.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/dealer_id/g, 'seller_id');
content = content.replace(/listing\.dealer/g, 'listing.seller');
content = content.replace(/dealer: \{/g, 'seller: {');
content = content.replace(/dealerData/g, 'sellerData');
content = content.replace(/handleContactDealer/g, 'handleContactSeller');
content = content.replace(/handleWhatsAppDealer/g, 'handleWhatsAppSeller');
content = content.replace(/handleCallDealer/g, 'handleCallSeller');
content = content.replace(/dealer:users!listings_dealer_id_fkey/g, 'seller:users!listings_seller_id_fkey');
content = content.replace(/dealerId=\{listing\.seller\.id\}/g, 'sellerId={listing.seller.id}');

const specPattern = /make\?: string;[\s\S]*?vin\?: string;/;
content = content.replace(specPattern, `campus?: string;
    delivery_type?: string;
    delivery_fee?: number;
    delivery_eta?: string;`);

const gridPattern = /\[\s*\{\s*label:\s*'Campus'[\s\S]*?\]\.map\(\(spec,\s*i\)\s*=>\s*\(/;
const newGrid = `[
                                { label: 'Campus', value: listing.campus || listing.location, icon: MapPin },
                                { label: 'Category', value: listing.category, icon: Activity },
                                { label: 'Condition', value: listing.condition, icon: Activity },
                                { label: 'Delivery Type', value: listing.delivery_type, icon: Box },
                                { label: 'Delivery Fee', value: listing.delivery_fee ? '₦' + (listing.delivery_fee / 100).toLocaleString() : 'Free', icon: Activity },
                                { label: 'Delivery ETA', value: listing.delivery_eta, icon: Activity },
                            ].map((spec, i) => (`

content = content.replace(gridPattern, newGrid);

fs.writeFileSync(file, content);
console.log('done');
