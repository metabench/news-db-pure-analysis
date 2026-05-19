/**
 * Content Confidence Scorer
 *
 * Pure functions for scoring extraction quality based on:
 * - Title quality
 * - Content length
 * - Metadata completeness (with weighted date/author/section)
 * - Readability output quality (content, title, byline, excerpt)
 * - Visual analysis confidence (layout, main content, metadata)
 *
 * Enhanced with production logic from ContentConfidenceScorer.js:
 * - Readability output scoring with component weights
 * - Visual analysis scoring with layout detection
 * - More nuanced recommendations (accept/review-needed/teacher-required)
 * - Date validation for metadata scoring
 * - Garbage title pattern detection
 */

import { z } from 'zod';

// --- Types ---
export const ExtractionInputSchema = z.object({
    title: z.string().optional(),
    content: z.string().optional(),
    author: z.string().optional(),
    publishDate: z.string().optional(),
    section: z.string().optional(),
    wordCount: z.number().optional(),
    readability: z.object({
        content: z.string().optional(),
        textContent: z.string().optional(),
        title: z.string().optional(),
        byline: z.string().optional(),
        excerpt: z.string().optional(),
    }).optional(),
    visualAnalysis: z.object({
        valid: z.boolean().optional(),
        confidence: z.number().optional(),
        hasMainContent: z.boolean().optional(),
        hasMetadata: z.boolean().optional(),
        layout: z.object({ type: z.string() }).optional(),
    }).optional(),
});

export type ExtractionInput = z.infer<typeof ExtractionInputSchema>;

export const ConfidenceResultSchema = z.object({
    score: z.number(),
    level: z.enum(['high', 'good', 'medium', 'low']),
    factors: z.record(z.number()),
    recommendation: z.string(),
    needsTeacherReview: z.boolean(),
});

export type ConfidenceResult = z.infer<typeof ConfidenceResultSchema>;

// --- Configuration ---
export interface ConfidenceConfig {
    minWordCount: number;
    idealWordCount: number;
    maxWordCount: number;
}

const DEFAULT_CONFIG: ConfidenceConfig = {
    minWordCount: 100,
    idealWordCount: 500,
    maxWordCount: 10000,
};

/**
 * Count words in text
 */
function countWords(text: string | undefined): number {
    if (!text) return 0;
    return text.trim().split(/\s+/).filter(w => w.length > 0).length;
}

/**
 * Validate a date string is plausible (1990 – 7 days in the future).
 */
export function isValidDate(dateStr: string | undefined): boolean {
    if (!dateStr) return false;
    const parsed = Date.parse(dateStr);
    if (isNaN(parsed)) return false;
    const date = new Date(parsed);
    const min = new Date('1990-01-01');
    const max = new Date(Date.now() + 86400000 * 7);
    return date >= min && date <= max;
}

// --- Scoring factors ---

// Garbage title patterns that indicate extraction failure
const GARBAGE_TITLE_PATTERNS = [
    /^untitled/i,
    /^page \d+/i,
    /^https?:/i,
    /^www\./i,
    /^\d+$/,
    /^loading/i,
    /^error/i,
    /^404/i,
    /^null$/i,
    /^not found/i,
];

/**
 * Score title quality (0-1)
 */
export function scoreTitleQuality(title: string | undefined): number {
    if (!title) return 0;

    const trimmed = title.trim();
    if (trimmed.length === 0) return 0;
    if (trimmed.length < 10) return 0.3;
    if (trimmed.length > 200) return 0.5; // Too long

    // Check for garbage patterns
    const lower = trimmed.toLowerCase();
    for (const pattern of GARBAGE_TITLE_PATTERNS) {
        if (pattern.test(lower)) return 0.2;
    }

    // Good title length
    if (trimmed.length >= 20 && trimmed.length <= 150) return 1.0;
    if (trimmed.length >= 10 && trimmed.length <= 200) return 0.8;

    return 0.7;
}

/**
 * Score content length quality (0-1)
 */
export function scoreLengthQuality(
    wordCount: number,
    config = DEFAULT_CONFIG,
): number {
    if (!wordCount || wordCount < 10) return 0;
    if (wordCount < config.minWordCount) return 0.3;
    if (wordCount > config.maxWordCount) return 0.5; // Suspiciously long
    if (wordCount >= config.idealWordCount) return 1.0;

    // Linear interpolation between min and ideal
    const range = config.idealWordCount - config.minWordCount;
    const progress = (wordCount - config.minWordCount) / range;
    return 0.3 + 0.7 * progress;
}

/**
 * Score metadata completeness (0-1)
 *
 * Weighted: date 40%, author 30%, section 30%.
 */
export function scoreMetadataCompleteness(extraction: ExtractionInput): {
    score: number;
    hasDate: boolean;
    hasAuthor: boolean;
    hasSection: boolean;
} {
    let score = 0;
    const hasDate = isValidDate(extraction.publishDate);
    const hasAuthor = !!(extraction.author && extraction.author.trim().length > 1);
    const hasSection = !!(extraction.section && extraction.section.trim().length > 0);

    if (hasDate) score += 0.4;
    if (hasAuthor) score += 0.3;
    if (hasSection) score += 0.3;

    return { score, hasDate, hasAuthor, hasSection };
}

/**
 * Score Readability.js output quality (0-1)
 *
 * Components: content 40%, title 25%, byline 20%, excerpt 15%.
 * Returns 0.5 (neutral) if no readability data available.
 */
export function scoreReadabilityOutput(readability: ExtractionInput['readability']): {
    score: number;
    hasContent: boolean;
    hasTitle: boolean;
    hasByline: boolean;
    hasExcerpt: boolean;
} {
    const details = { hasContent: false, hasTitle: false, hasByline: false, hasExcerpt: false };
    if (!readability) return { score: 0.5, ...details };

    let score = 0;

    // Content presence (40%)
    if (readability.content && readability.content.length > 100) {
        details.hasContent = true;
        score += 0.4;
    } else if (readability.textContent && readability.textContent.length > 100) {
        details.hasContent = true;
        score += 0.35;
    }

    // Title (25%)
    if (readability.title && readability.title.length > 5) {
        details.hasTitle = true;
        score += 0.25;
    }

    // Byline (20%)
    if (readability.byline && readability.byline.length > 2) {
        details.hasByline = true;
        score += 0.20;
    }

    // Excerpt (15%)
    if (readability.excerpt && readability.excerpt.length > 20) {
        details.hasExcerpt = true;
        score += 0.15;
    }

    return { score, ...details };
}

/**
 * Score visual analysis confidence (0-1)
 *
 * Uses the visual analyzer's own confidence if available,
 * otherwise computes from layout/content/metadata components.
 */
export function scoreVisualAnalysis(visual: ExtractionInput['visualAnalysis']): number {
    if (!visual || !visual.valid) return 0;

    // Use analyzer's own confidence if available
    if (typeof visual.confidence === 'number') {
        return Math.max(0, Math.min(1, visual.confidence));
    }

    // Fallback: compute from components
    let score = 0;
    if (visual.hasMainContent) score += 0.5;
    if (visual.hasMetadata) score += 0.3;
    if (visual.layout?.type !== 'unknown') score += 0.2;

    return Math.min(1, score);
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
 * Get actionable recommendation based on score and factors
 */
export function getRecommendation(
    score: number,
    factors: Record<string, number>,
): string {
    if (score >= 0.8) return 'accept';
    if (score >= 0.6) return 'accept-with-caution';

    const issues: string[] = [];
    if ((factors.title ?? 1) < 0.5) issues.push('title');
    if ((factors.length ?? 1) < 0.5) issues.push('content-length');
    if ((factors.metadata ?? 1) < 0.5) issues.push('metadata');
    if ((factors.readability ?? 1) < 0.5) issues.push('readability');

    if (score >= 0.3) {
        return issues.length > 0
            ? `review-needed:${issues.join(',')}`
            : 'review-needed';
    }

    return issues.length > 0
        ? `teacher-required:${issues.join(',')}`
        : 'teacher-required';
}

/**
 * Score extraction confidence with all factors.
 *
 * Enhanced factor weights (auto-normalizes when visual analysis absent):
 * - Title: 15%
 * - Content length: 25%
 * - Metadata: 20%
 * - Readability: 25%
 * - Visual analysis: 15% (optional)
 */
export function scoreConfidence(
    extraction: ExtractionInput,
    config: Partial<ConfidenceConfig> = {},
): ConfidenceResult {
    const cfg = { ...DEFAULT_CONFIG, ...config };
    const wordCount = extraction.wordCount ?? countWords(extraction.content);

    const titleScore = scoreTitleQuality(extraction.title);
    const lengthScore = scoreLengthQuality(wordCount, cfg);
    const metadata = scoreMetadataCompleteness(extraction);
    const readability = scoreReadabilityOutput(extraction.readability);
    const visualScore = extraction.visualAnalysis
        ? scoreVisualAnalysis(extraction.visualAnalysis)
        : null;

    // Build weighted sum with auto-normalization
    let totalWeight = 0;
    let weightedSum = 0;

    const addFactor = (score: number, weight: number) => {
        weightedSum += score * weight;
        totalWeight += weight;
    };

    addFactor(titleScore, 0.15);
    addFactor(lengthScore, 0.25);
    addFactor(metadata.score, 0.20);
    addFactor(readability.score, 0.25);
    if (visualScore !== null) {
        addFactor(visualScore, 0.15);
    }

    const finalScore = totalWeight > 0 ? weightedSum / totalWeight : 0;

    const factors: Record<string, number> = {
        title: titleScore,
        length: lengthScore,
        metadata: metadata.score,
        readability: readability.score,
    };
    if (visualScore !== null) {
        factors.visual = visualScore;
    }

    return {
        score: Math.round(finalScore * 1000) / 1000,
        level: scoreToLevel(finalScore),
        factors,
        recommendation: getRecommendation(finalScore, factors),
        needsTeacherReview: finalScore < 0.5,
    };
}

/**
 * Batch score multiple extractions
 */
export function scoreBatch(
    extractions: { id: string; extraction: ExtractionInput }[],
    config: Partial<ConfidenceConfig> = {},
): { id: string; result: ConfidenceResult }[] {
    return extractions.map(({ id, extraction }) => ({
        id,
        result: scoreConfidence(extraction, config),
    }));
}

/**
 * Filter low-confidence items (sorted worst-first)
 */
export function filterLowConfidence(
    scored: { id: string; result: ConfidenceResult }[],
    threshold = 0.4,
): { id: string; result: ConfidenceResult }[] {
    return scored
        .filter(item => item.result.score < threshold)
        .sort((a, b) => a.result.score - b.result.score);
}
