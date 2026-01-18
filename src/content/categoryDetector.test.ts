import { describe, it, expect } from 'vitest';
import {
    detectCategoriesFromUrl,
    detectFromContentSignals,
    detectPageCategories,
    getPrimaryCategory,
    isCategory
} from './categoryDetector.js';

describe('Page Category Detector', () => {
    describe('detectCategoriesFromUrl', () => {
        it('detects in-depth category', () => {
            const cats = detectCategoriesFromUrl('https://news.com/in-depth/climate-report');
            expect(cats.some(c => c.category === 'inDepth')).toBe(true);
        });

        it('detects opinion category', () => {
            const cats = detectCategoriesFromUrl('https://news.com/opinion/analysis');
            expect(cats.some(c => c.category === 'opinion')).toBe(true);
        });

        it('detects multimedia category', () => {
            const cats = detectCategoriesFromUrl('https://news.com/videos/breaking');
            expect(cats.some(c => c.category === 'multimedia')).toBe(true);
        });

        it('returns empty for generic URLs', () => {
            const cats = detectCategoriesFromUrl('https://news.com/article/random');
            expect(cats.length).toBe(0);
        });
    });

    describe('detectFromContentSignals', () => {
        it('detects in-depth from high word count', () => {
            const cats = detectFromContentSignals({ wordCount: 3000 });
            expect(cats.some(c => c.category === 'inDepth')).toBe(true);
        });

        it('detects multimedia from video flag', () => {
            const cats = detectFromContentSignals({ hasVideo: true });
            expect(cats.some(c => c.category === 'multimedia')).toBe(true);
        });
    });

    describe('detectPageCategories', () => {
        it('combines URL and content detection', () => {
            const cats = detectPageCategories(
                'https://news.com/in-depth/report',
                { wordCount: 2500 }
            );
            const inDepth = cats.find(c => c.category === 'inDepth');
            expect(inDepth).toBeDefined();
            expect(inDepth!.confidence).toBeGreaterThan(0.8); // Boosted
        });
    });

    describe('getPrimaryCategory', () => {
        it('returns highest confidence category', () => {
            const primary = getPrimaryCategory('https://news.com/opinion/editorial');
            expect(primary?.category).toBe('opinion');
        });

        it('returns null for no matches', () => {
            const primary = getPrimaryCategory('https://news.com/random');
            expect(primary).toBe(null);
        });
    });

    describe('isCategory', () => {
        it('correctly identifies category', () => {
            expect(isCategory('https://news.com/live/updates', 'live')).toBe(true);
            expect(isCategory('https://news.com/random', 'live')).toBe(false);
        });
    });
});
