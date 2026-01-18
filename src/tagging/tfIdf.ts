/**
 * TF-IDF Keyword Extraction
 * 
 * Extracts keywords using Term Frequency-Inverse Document Frequency.
 */

import { z } from 'zod';
import { tokenize } from '../text/tokenizer.js';

// --- Types ---
export interface Keyword {
    word: string;
    score: number;
}

export type DocumentFrequencyMap = Map<string, number>;

/**
 * Calculate Term Frequency (TF)
 * Normalized by document length (augmented frequency)
 * TF(t) = 0.5 + 0.5 * (count(t) / max_count)
 */
export function calculateTF(tokens: string[]): Map<string, number> {
    const counts = new Map<string, number>();
    let maxCount = 0;

    for (const token of tokens) {
        const count = (counts.get(token) || 0) + 1;
        counts.set(token, count);
        maxCount = Math.max(maxCount, count);
    }

    const tf = new Map<string, number>();
    for (const [token, count] of counts.entries()) {
        // Standard Augmented Frequency to prevent bias for long docs
        tf.set(token, 0.5 + 0.5 * (count / maxCount));
    }

    return tf;
}

/**
 * Calculate Inverse Document Frequency (IDF)
 * IDF(t) = log(N / (df(t) + 1))
 */
export function calculateIDF(
    term: string,
    dfMap: DocumentFrequencyMap,
    totalDocs: number
): number {
    const df = dfMap.get(term) || 0;
    // +1 smoothing to avoid division by zero
    return Math.log((totalDocs + 1) / (df + 1)) + 1;
}

// Helper to check if letter is a vowel
function isVowel(char: string): boolean {
    return /[aeiou]/.test(char);
}

/**
 * Simple English Stemmer (Porter-like, simplified)
 * Pure regex-based substitution for common suffixes
 */
export function simpleStem(word: string): string {
    if (word.length < 3) return word;

    let stem = word;

    // Step 1a
    if (stem.endsWith('sses')) stem = stem.slice(0, -2);
    else if (stem.endsWith('ies')) stem = stem.slice(0, -3) + 'i'; // flies -> fli
    else if (stem.endsWith('ss')) stem = stem;
    else if (stem.endsWith('s')) stem = stem.slice(0, -1);

    // Step 1b
    if (stem.endsWith('eed')) {
        if (stem.length > 4) stem = stem.slice(0, -1);
    } else if (stem.endsWith('ed')) {
        if (stem.includes('at') || stem.length > 4) stem = stem.slice(0, -2);
    } else if (stem.endsWith('ing')) {
        if (stem.length > 5) stem = stem.slice(0, -3);
    }

    // Step 1c - Y -> I
    if (stem.endsWith('y')) {
        const prev = stem[stem.length - 2];
        if (!isVowel(prev)) {
            stem = stem.slice(0, -1) + 'i';
        }
    }

    return stem;
}

/**
 * Extract Keywords using TF-IDF
 */
export function extractKeywords(
    text: string,
    dfMap: DocumentFrequencyMap,
    totalDocs: number,
    topN: number = 10
): Keyword[] {
    const rawTokens = tokenize(text, { removeStopwords: true, minLength: 3 });
    if (rawTokens.length === 0) return [];

    // Apply stemming
    const tokens = rawTokens.map(simpleStem);

    const tf = calculateTF(tokens);
    const scores: Keyword[] = [];

    for (const [term, tfScore] of tf.entries()) {
        const idfScore = calculateIDF(term, dfMap, totalDocs);
        scores.push({
            word: term,
            score: tfScore * idfScore
        });
    }

    return scores
        .sort((a, b) => b.score - a.score)
        .slice(0, topN);
}
