import { describe, it, expect } from 'vitest';
import { calculateHammingDistance, areArticlesSimilar } from './similarity.js';

describe('Similarity Logic', () => {
    describe('calculateHammingDistance', () => {
        it('returns 0 for identical hashes', () => {
            const h = 'ffffffffffffffff';
            expect(calculateHammingDistance(h, h)).toBe(0);
        });

        it('returns correct distance for known diffs', () => {
            // f = 1111, e = 1110 -> 1 bit diff
            expect(calculateHammingDistance(
                'ffffffffffffffff',
                'efffffffffffffff'
            )).toBe(1);

            // f = 1111, 0 = 0000 -> 4 bit diff
            expect(calculateHammingDistance(
                'f000000000000000',
                '0000000000000000'
            )).toBe(4);
        });
    });

    describe('areArticlesSimilar', () => {
        const base = {
            id: '1',
            headline: 'A',
            publishedAt: new Date(),
            sourceDomain: 'a.com',
            simHash: 'ffffffffffffffff'
        };

        it('identifies similar articles', () => {
            const other = { ...base, id: '2', simHash: 'efffffffffffffff' }; // dist 1
            expect(areArticlesSimilar(base, other, 3)).toBe(true);
        });

        it('rejects dissimilar articles', () => {
            const other = { ...base, id: '2', simHash: '0000000000000000' }; // dist 64
            expect(areArticlesSimilar(base, other, 3)).toBe(false);
        });
    });
});
