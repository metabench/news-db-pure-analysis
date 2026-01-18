import { describe, it, expect } from 'vitest';
import { analyzeSentiment, compareSentiment } from './lexicon.js';

describe('Sentiment Analysis', () => {
    it('detects positive sentiment', () => {
        const result = analyzeSentiment('This is a great and wonderful day');
        expect(result.label).toBe('positive');
        expect(result.score).toBeGreaterThan(0);
    });

    it('detects negative sentiment', () => {
        const result = analyzeSentiment('This is terrible and awful');
        expect(result.label).toBe('negative');
        expect(result.score).toBeLessThan(0);
    });

    it('handles negation', () => {
        const result = analyzeSentiment('This is not good');
        expect(result.normalizedScore).toBeLessThan(0);
    });

    it('handles neutral text', () => {
        const result = analyzeSentiment('The meeting is scheduled for tomorrow');
        expect(result.label).toBe('neutral');
    });

    it('compareSentiment works correctly', () => {
        const result = compareSentiment('Great success!', 'Terrible failure');
        expect(result.agreementLabel).toBe('disagree');
    });
});
