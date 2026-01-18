/**
 * Lexicon-based Sentiment Analysis
 * 
 * Pure functional sentiment scoring using AFINN-style word lists.
 * Handles negation and amplification.
 */

import { z } from 'zod';

// Simplified AFINN-inspired lexicon (subset for demonstration)
// In production, this would be loaded from a full lexicon file
const DEFAULT_LEXICON: Record<string, number> = {
    // Positive
    'good': 3, 'great': 4, 'excellent': 5, 'amazing': 5, 'wonderful': 4,
    'happy': 3, 'love': 3, 'best': 4, 'fantastic': 4, 'awesome': 4,
    'positive': 2, 'success': 3, 'win': 3, 'winning': 3, 'winner': 3,
    'beautiful': 3, 'perfect': 4, 'outstanding': 4, 'brilliant': 4,

    // Negative  
    'bad': -3, 'terrible': -4, 'awful': -4, 'horrible': -4, 'worst': -4,
    'hate': -4, 'sad': -2, 'angry': -3, 'fail': -3, 'failure': -3,
    'negative': -2, 'wrong': -2, 'problem': -2, 'crisis': -3, 'disaster': -4,
    'ugly': -2, 'poor': -2, 'broken': -2, 'killed': -3, 'death': -2,
    'attack': -3, 'war': -3, 'terror': -4, 'violence': -3
};

// Negation words that flip sentiment
const NEGATORS = new Set(['not', 'no', 'never', 'neither', "n't", 'none', 'nobody', 'nothing']);

// Amplifiers that boost sentiment
const AMPLIFIERS: Record<string, number> = {
    'very': 1.5, 'really': 1.3, 'extremely': 2.0, 'absolutely': 1.8,
    'incredibly': 1.7, 'completely': 1.5, 'totally': 1.4
};

// --- Types ---
export const SentimentResultSchema = z.object({
    score: z.number(),
    normalizedScore: z.number(),
    label: z.enum(['positive', 'negative', 'neutral']),
    confidence: z.number(),
    wordCount: z.number(),
    sentimentWords: z.number()
});

export type SentimentResult = z.infer<typeof SentimentResultSchema>;

/**
 * Tokenize text into words for sentiment analysis
 */
function tokenizeForSentiment(text: string): string[] {
    return text
        .toLowerCase()
        .replace(/[^\w\s'-]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 0);
}

/**
 * Analyze sentiment of text
 * @param text - Text to analyze
 * @param lexicon - Optional custom lexicon
 * @returns Sentiment analysis result
 */
export function analyzeSentiment(
    text: string,
    lexicon: Record<string, number> = DEFAULT_LEXICON
): SentimentResult {
    const words = tokenizeForSentiment(text);

    if (words.length === 0) {
        return {
            score: 0,
            normalizedScore: 0,
            label: 'neutral',
            confidence: 0,
            wordCount: 0,
            sentimentWords: 0
        };
    }

    let totalScore = 0;
    let sentimentWords = 0;
    let negationActive = false;
    let amplifier = 1.0;

    for (let i = 0; i < words.length; i++) {
        const word = words[i];

        // Check for negation
        if (NEGATORS.has(word)) {
            negationActive = true;
            continue;
        }

        // Check for amplifier
        if (AMPLIFIERS[word]) {
            amplifier = AMPLIFIERS[word];
            continue;
        }

        // Get word sentiment
        const wordScore = lexicon[word];
        if (wordScore !== undefined) {
            let adjustedScore = wordScore * amplifier;
            if (negationActive) {
                adjustedScore = -adjustedScore;
            }
            totalScore += adjustedScore;
            sentimentWords++;
        }

        // Reset modifiers after sentiment word
        negationActive = false;
        amplifier = 1.0;
    }

    // Normalize to -1 to 1 range
    const normalizedScore = sentimentWords > 0
        ? Math.max(-1, Math.min(1, totalScore / (sentimentWords * 3)))
        : 0;

    // Determine label
    let label: 'positive' | 'negative' | 'neutral';
    if (normalizedScore > 0.1) label = 'positive';
    else if (normalizedScore < -0.1) label = 'negative';
    else label = 'neutral';

    // Confidence based on coverage
    const coverage = sentimentWords / words.length;
    const confidence = Math.min(1, coverage * 2);

    return {
        score: Math.round(totalScore * 100) / 100,
        normalizedScore: Math.round(normalizedScore * 100) / 100,
        label,
        confidence: Math.round(confidence * 100) / 100,
        wordCount: words.length,
        sentimentWords
    };
}

/**
 * Compare sentiment between two texts
 */
export function compareSentiment(textA: string, textB: string): {
    aScore: number;
    bScore: number;
    difference: number;
    agreementLabel: 'agree' | 'disagree' | 'neutral';
} {
    const a = analyzeSentiment(textA);
    const b = analyzeSentiment(textB);

    const samePolarity = (a.label === b.label) || a.label === 'neutral' || b.label === 'neutral';

    return {
        aScore: a.normalizedScore,
        bScore: b.normalizedScore,
        difference: Math.abs(a.normalizedScore - b.normalizedScore),
        agreementLabel: samePolarity ? 'agree' : 'disagree'
    };
}

/**
 * Get the default lexicon (for extension)
 */
export function getDefaultLexicon(): Record<string, number> {
    return { ...DEFAULT_LEXICON };
}
