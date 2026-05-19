import { describe, it, expect } from 'vitest';
import {
    tokenizeForTfIdf,
    tfidfTF,
    tfidfIDF,
    buildVocabulary,
    tfidfSparseVector,
    tfidfCosineSimilarity,
    tfidfEuclideanDistance,
    tfidfDotProduct,
    tfidfSimilarityMatrix,
    fitTransform,
} from './tfidf.js';

describe('tokenizeForTfIdf', () => {
    it('lowercases and splits', () => {
        const tokens = tokenizeForTfIdf('Hello World Testing');
        expect(tokens).toEqual(['hello', 'world', 'testing']);
    });

    it('removes stop words', () => {
        const tokens = tokenizeForTfIdf('the quick brown fox jumps over the lazy dog');
        expect(tokens).not.toContain('the');
        expect(tokens).not.toContain('over');
        expect(tokens).toContain('quick');
    });

    it('removes short tokens', () => {
        const tokens = tokenizeForTfIdf('go to do it is', { minLength: 3 });
        expect(tokens).toHaveLength(0);
    });

    it('handles empty input', () => {
        expect(tokenizeForTfIdf('')).toEqual([]);
    });
});

describe('tfidfTF', () => {
    it('returns normalized frequencies', () => {
        const tf = tfidfTF(['hello', 'hello', 'world']);
        expect(tf.get('hello')).toBeCloseTo(2 / 3);
        expect(tf.get('world')).toBeCloseTo(1 / 3);
    });

    it('handles empty input', () => {
        const tf = tfidfTF([]);
        expect(tf.size).toBe(0);
    });
});

describe('tfidfIDF', () => {
    it('assigns higher IDF to rare terms', () => {
        const docs = [
            ['apple', 'banana'],
            ['banana', 'cherry'],
            ['banana', 'date'],
        ];
        const idf = tfidfIDF(docs);
        // banana appears in 3/3 docs, apple in 1/3
        expect(idf.get('apple')!).toBeGreaterThan(idf.get('banana')!);
    });
});

describe('tfidfCosineSimilarity', () => {
    it('returns 1 for identical vectors', () => {
        const v = new Map([[0, 1], [1, 2]]);
        expect(tfidfCosineSimilarity(v, v)).toBeCloseTo(1);
    });

    it('returns 0 for orthogonal vectors', () => {
        const a = new Map([[0, 1]]);
        const b = new Map([[1, 1]]);
        expect(tfidfCosineSimilarity(a, b)).toBe(0);
    });

    it('returns 0 for empty vectors', () => {
        expect(tfidfCosineSimilarity(new Map(), new Map())).toBe(0);
    });
});

describe('tfidfDotProduct', () => {
    it('computes correctly', () => {
        const a = new Map([[0, 2], [1, 3]]);
        const b = new Map([[0, 4], [1, -1]]);
        expect(tfidfDotProduct(a, b)).toBe(2 * 4 + 3 * -1);
    });
});

describe('tfidfEuclideanDistance', () => {
    it('returns 0 for identical vectors', () => {
        const v = new Map([[0, 1], [1, 2]]);
        expect(tfidfEuclideanDistance(v, v)).toBe(0);
    });

    it('computes correct distance', () => {
        const a = new Map([[0, 0]]);
        const b = new Map([[0, 3], [1, 4]]);
        expect(tfidfEuclideanDistance(a, b)).toBe(5);
    });
});

describe('tfidfSimilarityMatrix', () => {
    it('builds symmetric matrix with 1 on diagonal', () => {
        const v1 = new Map([[0, 1]]);
        const v2 = new Map([[1, 1]]);
        const matrix = tfidfSimilarityMatrix([v1, v2]);
        expect(matrix[0][0]).toBe(1);
        expect(matrix[1][1]).toBe(1);
        expect(matrix[0][1]).toBe(matrix[1][0]);
    });
});

describe('fitTransform', () => {
    it('produces vectors for documents', () => {
        const docs = [
            'machine learning algorithms improve prediction accuracy',
            'deep learning neural networks training data',
            'stock market trading financial regulations',
        ];
        const { vectors, vocab, idf } = fitTransform(docs);
        expect(vectors).toHaveLength(3);
        expect(vocab.size).toBeGreaterThan(0);
        expect(idf.size).toBeGreaterThan(0);

        // Related docs should be more similar than unrelated
        const sim01 = tfidfCosineSimilarity(vectors[0], vectors[1]);
        const sim02 = tfidfCosineSimilarity(vectors[0], vectors[2]);
        expect(sim01).toBeGreaterThan(sim02);
    });
});
