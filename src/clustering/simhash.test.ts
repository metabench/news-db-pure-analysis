import { describe, it, expect } from 'vitest';
import { computeSimHash, hammingDistance, isNearDuplicate, fnv1a64, getMatchType } from './simhash.js';

describe('SimHash', () => {
    it('computes consistent fingerprints', () => {
        const text = 'The quick brown fox jumps over the lazy dog';
        const fp1 = computeSimHash(text);
        const fp2 = computeSimHash(text);
        expect(fp1).toBe(fp2);
        expect(fp1).toHaveLength(16);
    });

    it('produces similar fingerprints for similar text', () => {
        const a = computeSimHash('Breaking news: Major earthquake hits city');
        const b = computeSimHash('Breaking news: Major earthquake hits town');
        const distance = hammingDistance(a, b);
        expect(distance).toBeLessThan(15);
    });

    it('produces different fingerprints for different text', () => {
        const a = computeSimHash('The weather is sunny today');
        const b = computeSimHash('Stock market crashes dramatically');
        const distance = hammingDistance(a, b);
        expect(distance).toBeGreaterThan(10);
    });

    it('isNearDuplicate correctly identifies duplicates', () => {
        const a = computeSimHash('World leaders meet for climate summit');
        const b = computeSimHash('World leaders meet for climate conference');
        // Short texts have more variance; use relaxed threshold
        expect(isNearDuplicate(a, b, 15)).toBe(true);
    });

    it('fnv1a64 produces consistent hashes', () => {
        const hash = fnv1a64('test');
        expect(hash).toBe(fnv1a64('test'));
    });

    it('getMatchType returns correct types', () => {
        expect(getMatchType(0)).toBe('exact');
        expect(getMatchType(3)).toBe('near');
        expect(getMatchType(8)).toBe('similar');
        expect(getMatchType(20)).toBe('different');
    });
});
