import { describe, it, expect } from 'vitest';
import {
    calculateHammingDistance,
    areArticlesSimilar,
    jaccardSet,
    minHash,
    estimateJaccardFromMinHash,
    lshBucketKey,
    lshCandidateProbability,
} from './similarity.js';

describe('calculateHammingDistance', () => {
    it('returns 0 for identical hashes', () => {
        expect(calculateHammingDistance('0000000000000000', '0000000000000000')).toBe(0);
    });

    it('counts differing bits', () => {
        // 0x0001 vs 0x0000 differs by 1 bit
        expect(calculateHammingDistance('0000000000000001', '0000000000000000')).toBe(1);
    });

    it('throws for invalid hash length', () => {
        expect(() => calculateHammingDistance('abc', 'def')).toThrow();
    });
});

describe('jaccardSet', () => {
    it('returns 1 for identical sets', () => {
        const s = new Set(['a', 'b', 'c']);
        expect(jaccardSet(s, s)).toBe(1);
    });

    it('returns 0 for disjoint sets', () => {
        expect(jaccardSet(new Set(['a']), new Set(['b']))).toBe(0);
    });

    it('returns correct value for overlapping sets', () => {
        const a = new Set(['a', 'b', 'c']);
        const b = new Set(['b', 'c', 'd']);
        // intersection={b,c}=2, union={a,b,c,d}=4, J=0.5
        expect(jaccardSet(a, b)).toBeCloseTo(0.5);
    });

    it('returns 1 for two empty sets', () => {
        expect(jaccardSet(new Set(), new Set())).toBe(1);
    });
});

describe('minHash', () => {
    it('produces signature of correct length', () => {
        const sig = minHash(['hello', 'world'], 64);
        expect(sig.length).toBe(64);
    });

    it('similar sets produce similar signatures', () => {
        const a = minHash(['a', 'b', 'c', 'd', 'e'], 256);
        const b = minHash(['a', 'b', 'c', 'd', 'f'], 256);
        const c = minHash(['x', 'y', 'z', 'w', 'v'], 256);

        const simAB = estimateJaccardFromMinHash(a, b);
        const simAC = estimateJaccardFromMinHash(a, c);
        expect(simAB).toBeGreaterThan(simAC);
    });
});

describe('estimateJaccardFromMinHash', () => {
    it('throws for unequal lengths', () => {
        expect(() =>
            estimateJaccardFromMinHash(new Uint32Array(3), new Uint32Array(5)),
        ).toThrow();
    });

    it('returns 1 for identical signatures', () => {
        const sig = minHash(['a', 'b'], 64);
        expect(estimateJaccardFromMinHash(sig, sig)).toBe(1);
    });
});

describe('lshBucketKey', () => {
    it('produces deterministic keys', () => {
        const sig = minHash(['hello', 'world'], 16);
        const key1 = lshBucketKey(sig, 0, 4);
        const key2 = lshBucketKey(sig, 0, 4);
        expect(key1).toBe(key2);
    });

    it('different bands produce different keys', () => {
        const sig = new Uint32Array([1, 2, 3, 4, 5, 6, 7, 8]);
        const key0 = lshBucketKey(sig, 0, 4);
        const key1 = lshBucketKey(sig, 1, 4);
        expect(key0).not.toBe(key1);
    });
});

describe('lshCandidateProbability', () => {
    it('returns ~1 for high similarity', () => {
        expect(lshCandidateProbability(0.9, 4, 32)).toBeGreaterThan(0.99);
    });

    it('returns ~0 for low similarity', () => {
        expect(lshCandidateProbability(0.1, 8, 16)).toBeLessThan(0.01);
    });
});
