/**
 * Shared Text Utilities
 * 
 * Common tokenization and text processing functions.
 */

// Common English stopwords
export const STOPWORDS = new Set([
    'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
    'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare', 'ought',
    'used', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it',
    'we', 'they', 'what', 'which', 'who', 'whom', 'where', 'when', 'why', 'how',
    'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other', 'some',
    'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too',
    'very', 's', 't', 'just', 'don', 'now'
]);

export interface TokenizeOptions {
    minLength?: number;
    removeStopwords?: boolean;
    lowercase?: boolean;
}

/**
 * Tokenize text into words
 * @param text - Text to tokenize
 * @param options - Tokenization options
 */
export function tokenize(text: string, options: TokenizeOptions = {}): string[] {
    const { minLength = 2, removeStopwords = false, lowercase = true } = options;

    let processed = text;
    if (lowercase) {
        processed = processed.toLowerCase();
    }

    const tokens = processed
        .replace(/[^\w\s'-]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length >= minLength);

    if (removeStopwords) {
        return tokens.filter(word => !STOPWORDS.has(word.toLowerCase()));
    }

    return tokens;
}

/**
 * Split text into sentences
 * @param text - Text to split
 */
export function splitSentences(text: string): string[] {
    return text
        .split(/[.!?]+/)
        .map(s => s.trim())
        .filter(s => s.length > 0);
}

/**
 * Count words in text
 */
export function countWords(text: string): number {
    return tokenize(text, { minLength: 1 }).length;
}

/**
 * Extract n-grams from tokens
 * @param tokens - Array of tokens
 * @param n - N-gram size
 */
export function ngrams(tokens: string[], n: number): string[] {
    if (tokens.length < n) return [];
    const result: string[] = [];
    for (let i = 0; i <= tokens.length - n; i++) {
        result.push(tokens.slice(i, i + n).join(' '));
    }
    return result;
}

/**
 * Get word frequency map
 */
export function wordFrequency(text: string, options?: TokenizeOptions): Map<string, number> {
    const tokens = tokenize(text, options);
    const freq = new Map<string, number>();
    for (const token of tokens) {
        freq.set(token, (freq.get(token) || 0) + 1);
    }
    return freq;
}

/**
 * Get top N words by frequency
 */
export function topWords(text: string, n: number = 10, options?: TokenizeOptions): { word: string; count: number }[] {
    const freq = wordFrequency(text, options);
    return Array.from(freq.entries())
        .map(([word, count]) => ({ word, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, n);
}

/**
 * Check if text is likely in English (heuristic)
 */
export function isLikelyEnglish(text: string): boolean {
    const tokens = tokenize(text, { minLength: 2, lowercase: true });
    if (tokens.length < 5) return true; // Too short to determine

    const englishWords = tokens.filter(t => STOPWORDS.has(t));
    const ratio = englishWords.length / tokens.length;
    return ratio > 0.1; // At least 10% stopwords suggests English
}
