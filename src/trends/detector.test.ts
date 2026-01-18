import { describe, it, expect } from 'vitest';
import { mean, stddev, calculateBaseline, calculateTrendScore, detectTrends } from './detector.js';

describe('Trend Detection', () => {
    it('calculates mean correctly', () => {
        expect(mean([10, 20, 30])).toBe(20);
        expect(mean([])).toBe(0);
    });

    it('calculates stddev correctly', () => {
        expect(stddev([10, 10, 10])).toBe(0);
        expect(stddev([0, 10])).toBeCloseTo(5, 0);
    });

    it('calculates baseline from history', () => {
        const baseline = calculateBaseline([10, 12, 11, 10, 11]);
        expect(baseline.mean).toBeCloseTo(10.8, 1);
        expect(baseline.stddev).toBeGreaterThan(0);
    });

    it('calculates trend score', () => {
        const baseline = { mean: 10, stddev: 2 };
        const result = calculateTrendScore(20, baseline, 2);
        expect(result.zScore).toBe(5);
        expect(result.isTrending).toBe(true);
    });

    it('detects trending topics', () => {
        const data = [
            { topicId: 'topic1', counts: [100, 10, 11, 10, 10, 11] }, // Trending
            { topicId: 'topic2', counts: [10, 10, 11, 10, 10, 11] }   // Not trending
        ];
        const trends = detectTrends(data);
        expect(trends[0].topicId).toBe('topic1');
        expect(trends[0].isTrending).toBe(true);
    });
});
