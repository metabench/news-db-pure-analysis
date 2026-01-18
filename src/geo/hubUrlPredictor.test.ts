import { describe, it, expect } from 'vitest';
import {
    toSlug,
    generateNameVariants,
    predictHubUrls,
    predictCountryHubUrls,
    extractPlaceSlugFromUrl,
    analyzeGaps
} from './hubUrlPredictor.js';

describe('Hub URL Predictor', () => {
    describe('toSlug', () => {
        it('converts names to URL-safe slugs', () => {
            expect(toSlug('United States')).toBe('united-states');
            expect(toSlug('São Paulo')).toBe('sao-paulo');
            expect(toSlug('México')).toBe('mexico');
        });
    });

    describe('generateNameVariants', () => {
        it('generates variants from place metadata', () => {
            const variants = generateNameVariants({
                name: 'United Kingdom',
                code: 'GB',
                slug: 'uk'
            });
            expect(variants).toContain('united-kingdom');
            expect(variants).toContain('gb');
            expect(variants).toContain('uk');
        });
    });

    describe('predictHubUrls', () => {
        it('generates weighted URL predictions', () => {
            const predictions = predictCountryHubUrls('apnews.com', {
                name: 'France',
                code: 'FR'
            });
            expect(predictions.length).toBeGreaterThan(0);
            expect(predictions[0].url).toContain('france');
            expect(predictions[0].weight).toBeGreaterThan(0);
        });

        it('dedupes URL predictions', () => {
            const predictions = predictHubUrls('example.com', { name: 'Test' }, [
                { pattern: '/{slug}', weight: 1, isPrefix: false },
                { pattern: '/{slug}', weight: 0.5, isPrefix: false }
            ]);
            // Should only have one entry for the duplicate pattern
            const testUrls = predictions.filter(p => p.url.endsWith('/test'));
            expect(testUrls.length).toBe(1);
        });
    });

    describe('extractPlaceSlugFromUrl', () => {
        it('extracts slug from matching URL', () => {
            const slug = extractPlaceSlugFromUrl('https://news.com/world/france');
            expect(slug).toBe('france');
        });
    });

    describe('analyzeGaps', () => {
        it('identifies missing places', () => {
            const known = [{ name: 'France' }];
            const all = [{ name: 'France' }, { name: 'Germany' }, { name: 'Italy' }];
            const result = analyzeGaps(known, all);
            expect(result.covered.length).toBe(1);
            expect(result.missing.length).toBe(2);
            expect(result.coveragePercent).toBe(33);
        });
    });
});
