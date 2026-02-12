/**
 * Hub URL Predictor - Generate candidate hub URLs for places
 * 
 * Pure functions for predicting likely hub page URLs based on:
 * - Domain patterns learned from crawling
 * - Place name variants (English, native language)
 * - Common URL slug patterns
 */

import { z } from 'zod';

// --- Types ---
export const PlaceMetadataSchema = z.object({
    name: z.string(),
    code: z.string().optional(),
    slug: z.string().optional(),
    nameVariants: z.array(z.string()).optional(),
    region: z.string().optional(),
    importance: z.number().optional()
});

export type PlaceMetadata = z.infer<typeof PlaceMetadataSchema>;

export const UrlPatternSchema = z.object({
    pattern: z.string(),
    weight: z.number().default(1),
    isPrefix: z.boolean().default(false)
});

export type UrlPattern = z.infer<typeof UrlPatternSchema>;

// --- Default Patterns ---
export const DEFAULT_COUNTRY_PATTERNS: UrlPattern[] = [
    { pattern: '/location/{slug}', weight: 1.2, isPrefix: false },
    { pattern: '/world/{slug}', weight: 1.1, isPrefix: false },
    { pattern: '/news/{slug}', weight: 1.0, isPrefix: false },
    { pattern: '/{slug}', weight: 0.9, isPrefix: false },
    { pattern: '/topics/{slug}', weight: 0.8, isPrefix: false },
    { pattern: '/tag/{slug}', weight: 0.7, isPrefix: false },
    { pattern: '/region/{slug}', weight: 0.8, isPrefix: false },
    { pattern: '/international/{slug}', weight: 0.6, isPrefix: false }
];

export const DEFAULT_CITY_PATTERNS: UrlPattern[] = [
    { pattern: '/local/{slug}', weight: 1.2, isPrefix: false },
    { pattern: '/city/{slug}', weight: 1.1, isPrefix: false },
    { pattern: '/news/{slug}', weight: 1.0, isPrefix: false },
    { pattern: '/{slug}', weight: 0.9, isPrefix: false },
    { pattern: '/metro/{slug}', weight: 0.8, isPrefix: false }
];

/**
 * Convert a name to a URL-safe slug
 */
export function toSlug(name: string): string {
    return name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
}

/**
 * Generate name variants for URL matching
 */
export function generateNameVariants(place: PlaceMetadata): string[] {
    const variants = new Set<string>();

    // Primary name
    variants.add(toSlug(place.name));

    // Code if available
    if (place.code) {
        variants.add(place.code.toLowerCase());
    }

    // Provided slug
    if (place.slug) {
        variants.add(place.slug.toLowerCase());
    }

    // Additional variants
    if (place.nameVariants) {
        for (const variant of place.nameVariants) {
            variants.add(toSlug(variant));
        }
    }

    return Array.from(variants).filter(v => v.length > 0);
}

/**
 * Predict hub URLs for a place on a domain
 * @param domain - Target domain (e.g., "apnews.com")
 * @param place - Place metadata
 * @param patterns - URL patterns to use (default: country patterns)
 * @returns Array of predicted URLs with confidence weights
 */
export function predictHubUrls(
    domain: string,
    place: PlaceMetadata,
    patterns: UrlPattern[] = DEFAULT_COUNTRY_PATTERNS
): { url: string; weight: number }[] {
    const results: { url: string; weight: number }[] = [];
    const variants = generateNameVariants(place);

    const baseUrl = domain.startsWith('http') ? domain : `https://${domain}`;

    for (const pattern of patterns) {
        for (const variant of variants) {
            const path = pattern.pattern.replace('{slug}', variant);
            results.push({
                url: `${baseUrl}${path}`,
                weight: pattern.weight
            });
        }
    }

    // Sort by weight descending and dedupe
    const seen = new Set<string>();
    return results
        .sort((a, b) => b.weight - a.weight)
        .filter(r => {
            if (seen.has(r.url)) return false;
            seen.add(r.url);
            return true;
        });
}

/**
 * Predict country hub URLs
 */
export function predictCountryHubUrls(
    domain: string,
    country: PlaceMetadata
): { url: string; weight: number }[] {
    return predictHubUrls(domain, country, DEFAULT_COUNTRY_PATTERNS);
}

/**
 * Predict city hub URLs
 */
export function predictCityHubUrls(
    domain: string,
    city: PlaceMetadata
): { url: string; weight: number }[] {
    return predictHubUrls(domain, city, DEFAULT_CITY_PATTERNS);
}

/**
 * Extract place slug from a URL
 * @param url - URL to analyze
 * @param patterns - Patterns to match against
 * @returns Extracted slug or null
 */
export function extractPlaceSlugFromUrl(
    url: string,
    patterns: UrlPattern[] = DEFAULT_COUNTRY_PATTERNS
): string | null {
    try {
        const parsed = new URL(url);
        const path = parsed.pathname;

        for (const pattern of patterns) {
            // Convert pattern to regex
            const regexStr = pattern.pattern
                .replace(/\{slug\}/g, '([^/]+)')
                .replace(/\//g, '\\/');
            const regex = new RegExp(`^${regexStr}$`);
            const match = path.match(regex);
            if (match && match[1]) {
                return match[1];
            }
        }
    } catch {
        return null;
    }
    return null;
}

/**
 * Analyze coverage gaps for a domain
 * @param knownPlaces - Places with confirmed hub pages
 * @param allPlaces - All places in the dataset
 * @returns Gap analysis result
 */
export function analyzeGaps(
    knownPlaces: PlaceMetadata[],
    allPlaces: PlaceMetadata[]
): {
    covered: PlaceMetadata[];
    missing: PlaceMetadata[];
    coveragePercent: number;
} {
    const knownSlugs = new Set(knownPlaces.map(p => toSlug(p.name)));

    const covered: PlaceMetadata[] = [];
    const missing: PlaceMetadata[] = [];

    for (const place of allPlaces) {
        if (knownSlugs.has(toSlug(place.name))) {
            covered.push(place);
        } else {
            missing.push(place);
        }
    }

    const coveragePercent = allPlaces.length > 0
        ? Math.round((covered.length / allPlaces.length) * 100)
        : 0;

    return { covered, missing, coveragePercent };
}
