import { describe, it, expect } from 'vitest';
import {
    cosineSimilarity,
    jaccardSimilarity,
    dotProduct,
    euclideanDistance,
    toSparseVector
} from './similarity.js';

describe('Similarity Metrics', () => {
    describe('cosineSimilarity', () => {
        it('calculates 1.0 for identical vectors', () => {
            expect(cosineSimilarity([1, 2, 3], [1, 2, 3])).toBeCloseTo(1.0);
        });

        it('calculates 0 for orthogonal vectors', () => {
            expect(cosineSimilarity([1, 0], [0, 1])).toBe(0);
        });

        it('calculates correct similarity', () => {
            // A=[1,1], B=[1,-1] -> dot=0 -> Sim=0
            // A=[1,0], B=[1,1] -> dot=1, |A|=1, |B|=sqrt(2) -> 1/1.414 = 0.707
            expect(cosineSimilarity([1, 0], [1, 1])).toBeCloseTo(0.707);
        });
    });

    describe('jaccardSimilarity', () => {
        it('calculates set overlap', () => {
            expect(jaccardSimilarity([1, 2, 3], [2, 3, 4])).toBe(0.5); // {2,3} / {1,2,3,4} = 2/4
        });

        it('calculates 1.0 for identical sets', () => {
            expect(jaccardSimilarity(['a', 'b'], ['b', 'a'])).toBe(1.0);
        });

        it('calculates 0 for disjoint sets', () => {
            expect(jaccardSimilarity([1], [2])).toBe(0);
        });
    });

    describe('euclideanDistance', () => {
        it('calculates distance', () => {
            expect(euclideanDistance([0, 0], [3, 4])).toBe(5);
        });
    });

    describe('toSparseVector', () => {
        it('creates vector from vocabulary', () => {
            const vocab = new Map([['a', 0], ['b', 1], ['c', 2]]);
            const tokens = ['a', 'c', 'a'];
            const vec = toSparseVector(tokens, vocab);
            expect(vec).toEqual([2, 0, 1]);
        });
    });
});
