import { describe, it, expect } from 'vitest';
import { scoreUrlPriority, rankUrlsForCrawling, UrlSignals } from './scorer.js';

describe('URL Scorer', () => {
    const now = new Date();
    const hoursAgo = (h: number) => new Date(now.getTime() - h * 60 * 60 * 1000);

    const baseSignals: UrlSignals = {
        url: 'https://example.com/article',
        visits: 5,
        lastVisited: hoursAgo(48),
        topicRelevance: 0.5,
        hubDepth: 1,
        isHub: false
    };

    it('calculates a base score around 50', () => {
        const result = scoreUrlPriority(baseSignals);
        expect(result.score).toBeGreaterThanOrEqual(40);
        expect(result.score).toBeLessThanOrEqual(70);
    });

    it('penalizes recently visited URLs', () => {
        const recent = { ...baseSignals, lastVisited: hoursAgo(0.5) };
        const old = { ...baseSignals, lastVisited: hoursAgo(200) };

        expect(scoreUrlPriority(recent).score).toBeLessThan(scoreUrlPriority(old).score);
    });

    it('boosts URLs with recent changes', () => {
        const changed = { ...baseSignals, lastChanged: hoursAgo(12) };
        expect(scoreUrlPriority(changed).score).toBeGreaterThan(scoreUrlPriority(baseSignals).score);
    });

    it('ranks URLs correctly', () => {
        const urls: UrlSignals[] = [
            { ...baseSignals, url: 'https://a.com', lastVisited: hoursAgo(1) },
            { ...baseSignals, url: 'https://b.com', lastVisited: hoursAgo(200) },
        ];

        const ranked = rankUrlsForCrawling(urls);
        expect(ranked[0].url).toBe('https://b.com');
    });
});
