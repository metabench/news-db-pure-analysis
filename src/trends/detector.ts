/**
 * Trend Detection - Statistical trend scoring
 * 
 * Pure functions for detecting trending topics based on
 * comparing current values against rolling baselines.
 */

import { z } from 'zod';

// --- Types ---
export const TopicCountSchema = z.object({
    topicId: z.string().or(z.number()),
    topicName: z.string().optional(),
    date: z.string(),
    count: z.number()
});

export type TopicCount = z.infer<typeof TopicCountSchema>;

export const TrendResultSchema = z.object({
    topicId: z.string().or(z.number()),
    topicName: z.string().optional(),
    currentCount: z.number(),
    baselineMean: z.number(),
    baselineStdDev: z.number(),
    zScore: z.number(),
    percentChange: z.number(),
    isTrending: z.boolean()
});

export type TrendResult = z.infer<typeof TrendResultSchema>;

/**
 * Calculate mean of values
 */
export function mean(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
}

/**
 * Calculate standard deviation
 */
export function stddev(values: number[], avg?: number): number {
    if (values.length < 2) return 0;
    const m = avg ?? mean(values);
    const variance = values.reduce((sum, v) => sum + Math.pow(v - m, 2), 0) / values.length;
    return Math.sqrt(variance);
}

/**
 * Calculate baseline statistics from historical counts
 * @param historicalCounts - Array of past daily counts
 * @returns Baseline mean and standard deviation
 */
export function calculateBaseline(historicalCounts: number[]): { mean: number; stddev: number } {
    const m = mean(historicalCounts);
    const s = stddev(historicalCounts, m);
    return {
        mean: Math.round(m * 100) / 100,
        stddev: Math.round(s * 100) / 100
    };
}

/**
 * Calculate trend score (z-score) for a topic
 * @param currentCount - Today's article count
 * @param baseline - Baseline statistics
 * @returns Trend metrics
 */
export function calculateTrendScore(
    currentCount: number,
    baseline: { mean: number; stddev: number },
    sigmaThreshold: number = 2.0
): { zScore: number; percentChange: number; isTrending: boolean } {
    // Avoid division by zero
    const zScore = baseline.stddev > 0
        ? (currentCount - baseline.mean) / baseline.stddev
        : (currentCount > baseline.mean ? 10 : 0);

    const percentChange = baseline.mean > 0
        ? ((currentCount - baseline.mean) / baseline.mean) * 100
        : (currentCount > 0 ? 100 : 0);

    return {
        zScore: Math.round(zScore * 100) / 100,
        percentChange: Math.round(percentChange),
        isTrending: zScore >= sigmaThreshold
    };
}

/**
 * Detect trends from topic counts data
 * @param topicCounts - Array of topic counts (current + historical per topic)
 * @param options - Detection options
 * @returns Array of trending topic results
 */
export function detectTrends(
    topicCounts: { topicId: string | number; topicName?: string; counts: number[] }[],
    options: { sigmaThreshold?: number; minBaseline?: number } = {}
): TrendResult[] {
    const { sigmaThreshold = 2.0, minBaseline = 3 } = options;
    const results: TrendResult[] = [];

    for (const topic of topicCounts) {
        if (topic.counts.length < 2) continue;

        const currentCount = topic.counts[0];
        const historicalCounts = topic.counts.slice(1);

        if (historicalCounts.length < minBaseline) continue;

        const baseline = calculateBaseline(historicalCounts);
        const trend = calculateTrendScore(currentCount, baseline, sigmaThreshold);

        results.push({
            topicId: topic.topicId,
            topicName: topic.topicName,
            currentCount,
            baselineMean: baseline.mean,
            baselineStdDev: baseline.stddev,
            zScore: trend.zScore,
            percentChange: trend.percentChange,
            isTrending: trend.isTrending
        });
    }

    // Sort by z-score descending
    return results.sort((a, b) => b.zScore - a.zScore);
}

/**
 * Filter to only trending topics
 */
export function filterTrending(results: TrendResult[]): TrendResult[] {
    return results.filter(r => r.isTrending);
}
