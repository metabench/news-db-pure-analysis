/**
 * Page Category Detector
 * 
 * Pure functions for detecting page types based on URL patterns
 * and content signals.
 */

import { z } from 'zod';

// --- Category Definitions ---
export const CATEGORY_PATTERNS = {
    inDepth: [
        /\/in-depth\//i,
        /\/longform\//i,
        /\/special-reports?\//i,
        /\/investigations?\//i,
        /\/features?\//i,
        /\/magazine\//i,
        /\/deep-dive\//i
    ],
    opinion: [
        /\/opinion\//i,
        /\/editorial[s]?\//i,
        /\/commentary\//i,
        /\/columns?\//i,
        /\/perspectives?\//i,
        /\/viewpoint\//i,
        /\/letters\//i
    ],
    live: [
        /\/live\//i,
        /\/live-updates?\//i,
        /\/breaking\//i,
        /\/developing\//i,
        /\/as-it-happens?\//i
    ],
    explainer: [
        /\/explainer[s]?\//i,
        /\/explained\//i,
        /\/guide[s]?\//i,
        /\/what-is-/i,
        /\/how-to-/i,
        /\/faq\//i,
        /\/101\//i
    ],
    multimedia: [
        /\/video[s]?\//i,
        /\/audio\//i,
        /\/podcast[s]?\//i,
        /\/interactive\//i,
        /\/gallery/i,
        /\/photo[s]?\//i,
        /\/graphics?\//i
    ],
    hub: [
        /\/world\//i,
        /\/politics\//i,
        /\/business\//i,
        /\/technology\//i,
        /\/science\//i,
        /\/sports?\//i,
        /\/entertainment\//i,
        /\/health\//i
    ]
};

export type CategoryType = keyof typeof CATEGORY_PATTERNS;

export const CategoryResultSchema = z.object({
    category: z.string(),
    confidence: z.number(),
    matchedPattern: z.string().optional()
});

export type CategoryResult = z.infer<typeof CategoryResultSchema>;

/**
 * Check if URL matches any patterns
 */
export function matchesPatterns(url: string, patterns: RegExp[]): { matches: boolean; pattern?: string } {
    for (const pattern of patterns) {
        if (pattern.test(url)) {
            return { matches: true, pattern: pattern.source };
        }
    }
    return { matches: false };
}

/**
 * Detect categories from URL
 * @param url - URL to analyze
 * @returns Array of matched categories with confidence
 */
export function detectCategoriesFromUrl(url: string): CategoryResult[] {
    const results: CategoryResult[] = [];

    for (const [category, patterns] of Object.entries(CATEGORY_PATTERNS)) {
        const { matches, pattern } = matchesPatterns(url, patterns);
        if (matches) {
            results.push({
                category,
                confidence: 0.8, // High confidence for URL pattern match
                matchedPattern: pattern
            });
        }
    }

    return results;
}

/**
 * Detect page type from content signals
 * @param signals - Content analysis signals
 */
export function detectFromContentSignals(signals: {
    wordCount?: number;
    hasVideo?: boolean;
    hasGallery?: boolean;
    paragraphCount?: number;
    linkDensity?: number;
}): CategoryResult[] {
    const results: CategoryResult[] = [];

    // In-depth detection based on word count
    if (signals.wordCount && signals.wordCount > 2000) {
        results.push({
            category: 'inDepth',
            confidence: Math.min(0.9, 0.5 + (signals.wordCount / 10000))
        });
    }

    // Multimedia detection
    if (signals.hasVideo) {
        results.push({ category: 'multimedia', confidence: 0.7 });
    }
    if (signals.hasGallery) {
        results.push({ category: 'multimedia', confidence: 0.6 });
    }

    // Hub detection based on link density
    if (signals.linkDensity && signals.linkDensity > 0.5) {
        results.push({ category: 'hub', confidence: 0.6 });
    }

    return results;
}

/**
 * Combine URL and content-based category detection
 */
export function detectPageCategories(
    url: string,
    contentSignals?: {
        wordCount?: number;
        hasVideo?: boolean;
        hasGallery?: boolean;
        paragraphCount?: number;
        linkDensity?: number;
    }
): CategoryResult[] {
    const urlCategories = detectCategoriesFromUrl(url);
    const contentCategories = contentSignals ? detectFromContentSignals(contentSignals) : [];

    // Merge results, boosting confidence for matches in both
    const merged = new Map<string, CategoryResult>();

    for (const cat of [...urlCategories, ...contentCategories]) {
        const existing = merged.get(cat.category);
        if (existing) {
            // Boost confidence when detected by multiple methods
            existing.confidence = Math.min(1.0, existing.confidence + cat.confidence * 0.5);
        } else {
            merged.set(cat.category, { ...cat });
        }
    }

    return Array.from(merged.values()).sort((a, b) => b.confidence - a.confidence);
}

/**
 * Get primary category (highest confidence)
 */
export function getPrimaryCategory(url: string, contentSignals?: any): CategoryResult | null {
    const categories = detectPageCategories(url, contentSignals);
    return categories.length > 0 ? categories[0] : null;
}

/**
 * Check if page is a specific category
 */
export function isCategory(
    url: string,
    category: CategoryType,
    minConfidence = 0.5
): boolean {
    const categories = detectPageCategories(url);
    const match = categories.find(c => c.category === category);
    return match !== undefined && match.confidence >= minConfidence;
}
