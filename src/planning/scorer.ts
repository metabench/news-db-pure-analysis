import { z } from 'zod';

// --- Input Schema ---
export const UrlSignalsSchema = z.object({
    url: z.string().url(),
    visits: z.number().int().min(0),
    lastVisited: z.date().or(z.string()),
    lastChanged: z.date().or(z.string()).optional(),
    topicRelevance: z.number().min(0).max(1).default(0.5),
    hubDepth: z.number().int().min(0).default(0),
    isHub: z.boolean().default(false)
});

export type UrlSignals = z.infer<typeof UrlSignalsSchema>;

// --- Output Schema ---
export const ScoredUrlSchema = z.object({
    url: z.string(),
    score: z.number(),
    reasons: z.array(z.string())
});

export type ScoredUrl = z.infer<typeof ScoredUrlSchema>;

/**
 * Calculates a priority score for a URL based on crawl signals.
 * Higher scores = higher priority for crawling.
 * 
 * @param signals - URL metadata and visit history
 * @returns Priority score (0-100) with reasoning
 */
export function scoreUrlPriority(signals: UrlSignals): ScoredUrl {
    const reasons: string[] = [];
    let score = 50; // Base score

    // 1. Freshness decay: penalize recently visited
    const now = new Date();
    const lastVisit = new Date(signals.lastVisited);
    const hoursSinceVisit = (now.getTime() - lastVisit.getTime()) / (1000 * 60 * 60);

    if (hoursSinceVisit < 1) {
        score -= 30;
        reasons.push('Recently visited (<1h)');
    } else if (hoursSinceVisit < 24) {
        score -= 10;
        reasons.push('Visited today');
    } else if (hoursSinceVisit > 168) {
        score += 15;
        reasons.push('Not visited in 7+ days');
    }

    // 2. Change Detection: boost if content changed recently
    if (signals.lastChanged) {
        const lastChange = new Date(signals.lastChanged);
        const hoursSinceChange = (now.getTime() - lastChange.getTime()) / (1000 * 60 * 60);
        if (hoursSinceChange < 24) {
            score += 20;
            reasons.push('Changed in last 24h');
        }
    }

    // 3. Topic Relevance: boost high-relevance URLs
    score += Math.round(signals.topicRelevance * 15);
    if (signals.topicRelevance > 0.8) {
        reasons.push('High topic relevance');
    }

    // 4. Hub Priority: hubs are important for discovery
    if (signals.isHub) {
        score += 10;
        reasons.push('Is a hub page');
    }

    // 5. Depth penalty: prefer shallower URLs
    if (signals.hubDepth > 3) {
        score -= 5;
        reasons.push('Deep URL');
    }

    // Clamp to 0-100
    score = Math.max(0, Math.min(100, score));

    return {
        url: signals.url,
        score,
        reasons
    };
}

/**
 * Ranks a list of URLs by crawl priority (highest first).
 * 
 * @param urls - Array of URL signals
 * @returns Sorted array of scored URLs
 */
export function rankUrlsForCrawling(urls: UrlSignals[]): ScoredUrl[] {
    return urls
        .map(scoreUrlPriority)
        .sort((a, b) => b.score - a.score);
}
