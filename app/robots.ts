import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/private/', '/api/', '/dealer/dashboard/', '/admin/'],
        },
        sitemap: 'https://market-bridge-llc-main.vercel.app/sitemap.xml',
    };
}
