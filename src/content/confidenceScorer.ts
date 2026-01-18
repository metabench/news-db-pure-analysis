/**
 * Content Confidence Scorer
 * 
 * Pure functions for scoring extraction quality based on:
 * - Title quality
 * - Content length
 * - Metadata completeness
 */

import { z } from 'zod';

// --- Types ---
export const ExtractionInputSchema = z.object({
    title: z.string().optional(),
    content: z.string().optional(),
    author: z.string().optional(),
    publishDate: z.string().optional(),
    section: z.string().optional(),
    wordCount: z.number().optional()
});

export type ExtractionInput = z.infer<typeof ExtractionInputSchema>;

export const ConfidenceResultSchema = z.object({
    score: z.number(),
    level: z.enum(['high', 'good', 'medium', 'low']),
    factors: z.record(z.number()),
    recommendation: z.string()
});

export type ConfidenceResult = z.infer<typeof ConfidenceResultSchema>;

// --- Configuration ---
const DEFAULT_CONFIG = {
    minWordCount: 100,
    idealWordCount: 500,
    maxWordCount: 10000
};

/**
 * Count words in text
 */
function countWords(text: string | undefined): number {
    if (!text) return 0;
    return text.trim().split(/\s+/).filter(w => w.length > 0).length;
}

/**
 * Score title quality (0-1)
 */
export function scoreTitleQuality(title: string | undefined): number {
    if (!title) return 0;

    const trimmed = title.trim();
    if (trimmed.length === 0) return 0;
    if (trimmed.length < 10) return 0.3;
    if (trimmed.length > 200) return 0.5; // Too long

    // Check for suspicious patterns
    if (/^(error|404|not found|loading)/i.test(trimmed)) return 0.1;
    if (/^\d+$/.test(trimmed)) return 0.2;

    // Good title length
    if (trimmed.length >= 20 && trimmed.length <= 150) return 1.0;
    if (trimmed.length >= 10 && trimmed.length <= 200) return 0.8;

    return 0.6;
}

/**
 * Score content length quality (0-1)
 */
export function scoreLengthQuality(
    wordCount: number,
    config = DEFAULT_CONFIG
): number {
    if (wordCount === 0) return 0;
    if (wordCount < config.minWordCount * 0.5) return 0.2;
    if (wordCount < config.minWordCount) return 0.5;
    if (wordCount > config.maxWordCount) return 0.6; // Suspiciously long
    if (wordCount >= config.idealWordCount) return 1.0;

    // Linear interpolation between min and ideal
    const ratio = (wordCount - config.minWordCount) /
        (config.idealWordCount - config.minWordCount);
    return 0.5 + (ratio * 0.5);
}

/**
 * Score metadata completeness (0-1)
 */
export function scoreMetadataCompleteness(extraction: ExtractionInput): number {
    const fields = ['author', 'publishDate', 'section'];
    let score = 0;
    let total = 0;

    for (const field of fields) {
        const value = extraction[field as keyof ExtractionInput];
        if (typeof value === 'string' && value.trim().length > 0) {
            score += 1;
        }
        total += 1;
    }

    return total > 0 ? score / total : 0;
}

/**
 * Convert score to confidence level
 */
export function scoreToLevel(score: number): 'high' | 'good' | 'medium' | 'low' {
    if (score >= 0.8) return 'high';
    if (score >= 0.6) return 'good';
    if (score >= 0.3) return 'medium';
    return 'low';
}

/**
 * Get recommendation based on factors
 */
export function getRecommendation(score: number, factors: Record<string, number>): string {
    if (score >= 0.8) return 'Content extraction looks reliable';

    const issues: string[] = [];
    if (factors.title < 0.5) issues.push('verify title');
    if (factors.length < 0.5) issues.push('check content length');
    if (factors.metadata < 0.5) issues.push('missing metadata');

    if (issues.length === 0) return 'Minor quality concerns';
    return `Consider: ${issues.join(', ')}`;
}

/**
 * Score extraction confidence
 * @param extraction - Extracted content data
 * @returns Confidence scoring result
 */
export function scoreConfidence(extraction: ExtractionInput): ConfidenceResult {
    const wordCount = extraction.wordCount ?? countWords(extraction.content);

    const factors = {
        title: scoreTitleQuality(extraction.title),
        length: scoreLengthQuality(wordCount),
        metadata: scoreMetadataCompleteness(extraction)
    };

    // Weighted average
    const weights = { title: 0.3, length: 0.5, metadata: 0.2 };
    const score =
        factors.title * weights.title +
        factors.length * weights.length +
        factors.metadata * weights.metadata;

    return {
        score: Math.round(score * 100) / 100,
        level: scoreToLevel(score),
        factors,
        recommendation: getRecommendation(score, factors)
    };
}

/**
 * Batch score multiple extractions
 */
export function scoreBatch(
    extractions: { id: string; extraction: ExtractionInput }[]
): { id: string; result: ConfidenceResult }[] {
    return extractions.map(({ id, extraction }) => ({
        id,
        result: scoreConfidence(extraction)
    }));
}

/**
 * Filter low-confidence items
 */
export function filterLowConfidence(
    scored: { id: string; result: ConfidenceResult }[],
    threshold = 0.4
): { id: string; result: ConfidenceResult }[] {
    return scored
        .filter(item => item.result.score < threshold)
        .sort((a, b) => a.result.score - b.result.score);
}
