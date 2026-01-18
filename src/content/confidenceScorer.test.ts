import { describe, it, expect } from 'vitest';
import {
    scoreTitleQuality,
    scoreLengthQuality,
    scoreMetadataCompleteness,
    scoreConfidence,
    scoreBatch,
    filterLowConfidence
} from './confidenceScorer.js';

describe('Content Confidence Scorer', () => {
    describe('scoreTitleQuality', () => {
        it('returns 0 for missing title', () => {
            expect(scoreTitleQuality(undefined)).toBe(0);
        });

        it('returns low score for error-like titles', () => {
            expect(scoreTitleQuality('Error 404')).toBeLessThanOrEqual(0.3);
        });

        it('returns high score for good titles', () => {
            expect(scoreTitleQuality('Major breakthrough in climate science research')).toBe(1);
        });
    });

    describe('scoreLengthQuality', () => {
        it('returns 0 for zero words', () => {
            expect(scoreLengthQuality(0)).toBe(0);
        });

        it('returns 1 for ideal length', () => {
            expect(scoreLengthQuality(500)).toBe(1);
        });

        it('returns partial score for short content', () => {
            const score = scoreLengthQuality(80);
            expect(score).toBeGreaterThan(0);
            expect(score).toBeLessThan(1);
        });
    });

    describe('scoreConfidence', () => {
        it('returns high confidence for complete extraction', () => {
            const result = scoreConfidence({
                title: 'Great Article About Technology Advances',
                content: 'Lorem ipsum '.repeat(100),
                author: 'John Doe',
                publishDate: '2026-01-15'
            });
            expect(result.level).toBe('good');
        });

        it('returns low confidence for empty extraction', () => {
            const result = scoreConfidence({});
            expect(result.level).toBe('low');
        });
    });

    describe('filterLowConfidence', () => {
        it('filters and sorts by score', () => {
            const scored = [
                { id: 'a', result: { score: 0.8, level: 'good' as const, factors: {}, recommendation: '' } },
                { id: 'b', result: { score: 0.2, level: 'low' as const, factors: {}, recommendation: '' } },
                { id: 'c', result: { score: 0.3, level: 'low' as const, factors: {}, recommendation: '' } }
            ];
            const low = filterLowConfidence(scored, 0.5);
            expect(low.length).toBe(2);
            expect(low[0].id).toBe('b');
        });
    });
});
