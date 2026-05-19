import { describe, it, expect } from 'vitest';
import {
    analyzeSentiment,
    compareSentiment,
    getDefaultLexicon,
    analyzeSentences,
    analyzeArticleSentiment,
    NEGATORS,
    AMPLIFIERS,
    BUT_WORDS,
} from './lexicon.js';

describe('analyzeSentiment', () => {
    it('returns neutral for empty text', () => {
        const r = analyzeSentiment('');
        expect(r.label).toBe('neutral');
        expect(r.confidence).toBe(0);
        expect(r.sentenceCount).toBe(0);
    });

    it('detects positive sentiment', () => {
        const r = analyzeSentiment('This is a great and wonderful achievement.');
        expect(r.label).toBe('positive');
        expect(r.normalizedScore).toBeGreaterThan(0);
        expect(r.sentimentWords).toBeGreaterThan(0);
    });

    it('detects negative sentiment', () => {
        const r = analyzeSentiment('The disaster caused terrible damage and suffering.');
        expect(r.label).toBe('negative');
        expect(r.normalizedScore).toBeLessThan(0);
    });

    it('handles negation window (3-word look-back)', () => {
        const negated = analyzeSentiment('This is not at all good.');
        const plain = analyzeSentiment('This is good.');
        // "not" is 3 words before "good" — should negate
        expect(negated.normalizedScore).toBeLessThan(plain.normalizedScore);
    });

    it('handles intensifiers', () => {
        const intense = analyzeSentiment('This is extremely good.');
        const plain = analyzeSentiment('This is good.');
        expect(intense.score).toBeGreaterThan(plain.score);
    });

    it('applies but-clause weighting', () => {
        // "good but terrible" — post-but content weighted more
        const result = analyzeSentiment('The movie was good but the ending was terrible.');
        expect(result.normalizedScore).toBeLessThan(0);
    });

    it('provides breakdown percentages', () => {
        const r = analyzeSentiment('Great success but terrible failure.');
        expect(r.breakdown.positive).toBeGreaterThan(0);
        expect(r.breakdown.negative).toBeGreaterThan(0);
        expect(r.breakdown.positive + r.breakdown.negative + r.breakdown.neutral).toBeCloseTo(1, 1);
    });

    it('counts sentences', () => {
        const r = analyzeSentiment('First sentence. Second sentence. Third one!');
        expect(r.sentenceCount).toBe(3);
    });

    it('returns confidence based on coverage', () => {
        const short = analyzeSentiment('Good.');
        const long = analyzeSentiment('The great and wonderful achievement brought hope and joy to the community.');
        expect(long.confidence).toBeGreaterThan(short.confidence);
    });

    it('accepts custom lexicon', () => {
        const customLexicon = { 'bazinga': 5 };
        const r = analyzeSentiment('bazinga bazinga bazinga', customLexicon);
        expect(r.label).toBe('positive');
    });
});

describe('analyzeSentences', () => {
    it('returns per-sentence results', () => {
        const results = analyzeSentences('Great news! Terrible outcome.');
        expect(results).toHaveLength(2);
        expect(results[0].score).toBeGreaterThan(0);
        expect(results[1].score).toBeLessThan(0);
    });

    it('marks sentences with but-clause', () => {
        const results = analyzeSentences('Good but bad.');
        expect(results[0].hasBut).toBe(true);
    });
});

describe('compareSentiment', () => {
    it('detects agreement on positive texts', () => {
        const r = compareSentiment('Great achievement!', 'Wonderful success!');
        expect(r.agreementLabel).toBe('agree');
    });

    it('detects disagreement between positive and negative', () => {
        const r = compareSentiment('Wonderful success!', 'Terrible disaster!');
        expect(r.agreementLabel).toBe('disagree');
        expect(r.difference).toBeGreaterThan(0);
    });
});

describe('analyzeArticleSentiment', () => {
    it('combines title and body with weighted scoring', () => {
        const r = analyzeArticleSentiment(
            'Amazing discovery!',
            'Scientists achieved a great breakthrough in medical research.',
        );
        expect(r.title.label).toBe('positive');
        expect(r.body.label).toBe('positive');
        expect(r.combined.label).toBe('positive');
        expect(r.combined.sentenceCount).toBeGreaterThanOrEqual(2);
    });

    it('handles empty title gracefully', () => {
        const r = analyzeArticleSentiment('', 'Terrible disaster struck the region.');
        expect(r.combined.label).toBe('negative');
    });
});

describe('getDefaultLexicon', () => {
    it('returns a copy with many words', () => {
        const lex = getDefaultLexicon();
        expect(Object.keys(lex).length).toBeGreaterThan(400);
        expect(lex['good']).toBeGreaterThan(0);
        expect(lex['terrible']).toBeLessThan(0);
    });
});

describe('word sets', () => {
    it('has negation words', () => {
        expect(NEGATORS.has('not')).toBe(true);
        expect(NEGATORS.has("doesn't")).toBe(true);
    });

    it('has amplifiers', () => {
        expect(AMPLIFIERS['very']).toBeGreaterThan(1);
        expect(AMPLIFIERS['slightly']).toBeLessThan(1);
    });

    it('has but-words', () => {
        expect(BUT_WORDS.has('but')).toBe(true);
        expect(BUT_WORDS.has('however')).toBe(true);
    });
});
