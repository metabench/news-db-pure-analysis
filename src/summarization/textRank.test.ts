import { describe, it, expect } from 'vitest';
import { TextRank } from './textRank.js';

describe('TextRank', () => {
    const sentences = [
        'The quick brown fox jumps over the lazy dog.',
        'The lazy dog sleeps in the sun.',
        'Foxes are quick and brown animals.',
        'Dogs are loyal companions to humans.',
        'The sun is bright today.'
    ];

    it('ranks sentences by importance', () => {
        const ranker = new TextRank();
        const ranked = ranker.rank(sentences);

        expect(ranked.length).toBe(sentences.length);
        expect(ranked[0].score).toBeGreaterThan(ranked[ranked.length - 1].score);
        // The first sentence should have high similarity to 2nd and 3rd
        expect(ranked[0].text).toContain('fox');
    });

    it('summarizes text by selecting top sentences', () => {
        const ranker = new TextRank();
        const summary = ranker.summarize(sentences, 2);

        expect(summary.length).toBe(2);
        // Should preserve order
        expect(summary[0].index).toBeLessThan(summary[1].index);
    });

    it('handles single sentence', () => {
        const ranker = new TextRank();
        const summary = ranker.summarize(['Just one sentence.'], 1);
        expect(summary.length).toBe(1);
        expect(summary[0].score).toBe(1.0);
    });
});
