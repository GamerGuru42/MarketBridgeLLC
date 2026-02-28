import { MetadataRoute } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_CLIENT_URL || 'https://marketbridge.com.ng';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/admin/', '/api/', '/seller/'],
        },
        sitemap: `${siteUrl}/sitemap.xml`,
    };
}
