import { describe, it, expect } from 'vitest';
import { extractKeywords, calculateTF, calculateIDF, simpleStem } from './tfIdf.js';

describe('TF-IDF Tagging', () => {
    describe('simpleStem', () => {
        it('stems common English suffixes', () => {
            expect(simpleStem('running')).toBe('runn');
            expect(simpleStem('flies')).toBe('fli');
            expect(simpleStem('cats')).toBe('cat');
            expect(simpleStem('agreed')).toBe('agree');
        });

        it('preserves short words', () => {
            expect(simpleStem('is')).toBe('is');
            expect(simpleStem('at')).toBe('at');
        });
    });

    describe('calculateTF', () => {
        it('calculates augmented frequency', () => {
            const tokens = ['apple', 'banana', 'apple'];
            const tf = calculateTF(tokens);
            expect(tf.get('apple')).toBe(1.0); // 0.5 + 0.5 * (2/2)
            expect(tf.get('banana')).toBe(0.75); // 0.5 + 0.5 * (1/2)
        });
    });

    describe('extractKeywords', () => {
        it('extracts top keywords', () => {
            const text = 'The cat sat on the mat. The cat is happy.';
            // Mock DF map (usually comes from DB)
            const dfMap = new Map([
                ['cat', 10],
                ['sat', 20],
                ['mat', 50],
                ['happi', 5] // Rarest word should get highest IDF
            ]);
            const totalDocs = 100;

            const keywords = extractKeywords(text, dfMap, totalDocs);

            // "Happy" is rarest in corpus -> high IDF. "Cat" is frequent in doc -> high TF.
            // With these numbers:
            // "happy": TF=0.75, IDF=log(101/6)+1 ~= 3.8 -> 2.85
            // "cat": TF=1.0, IDF=log(101/11)+1 ~= 3.2 -> 3.2
            // "mat": TF=0.75, IDF=log(101/51)+1 ~= 1.7 -> 1.2

            expect(keywords.length).toBeGreaterThan(0);
            expect(keywords[0].word).toBe('cat');
            expect(keywords[1].word).toBe('happi'); // stemmed
        });
    });
});
