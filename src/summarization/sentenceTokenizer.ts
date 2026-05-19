/**
 * Sentence Tokenizer
 *
 * Splits text into sentences with proper handling of:
 * - Common abbreviations (Mr., Dr., U.S., etc.)
 * - Decimal numbers (3.14)
 * - Quoted text
 * - Multiple punctuation (!!, ?!, ...)
 * - Initials (J. K. Rowling)
 *
 * Ported from copilot-dl-news SentenceTokenizer.js.
 * Two modes: full tokenizer (position-aware) and simple splitter (fast).
 */

// ---------------------------------------------------------------------------
// Abbreviation database
// ---------------------------------------------------------------------------

export const ABBREVIATIONS = new Set([
    // Titles
    'mr', 'mrs', 'ms', 'dr', 'prof', 'sr', 'jr', 'rev', 'gov', 'sen', 'rep',
    'hon', 'gen', 'col', 'lt', 'sgt', 'cpl', 'pvt', 'capt', 'cmdr', 'adm',
    // Academic
    'ph', 'b', 'm', 'd', 'phd', 'md', 'mba', 'ma', 'ba', 'bs', 'esq',
    // Organizations/Places
    'inc', 'corp', 'ltd', 'co', 'llc', 'dept', 'div', 'assn', 'univ',
    'st', 'ave', 'blvd', 'rd', 'ct', 'pl', 'sq', 'mt',
    // Countries/States
    'u', 's', 'u.s', 'us', 'uk', 'e', 'i', 'n', 'w', 'ne', 'nw', 'se', 'sw',
    // Common
    'vs', 'etc', 'al', 'eg', 'ie', 'cf', 'viz', 'approx', 'est', 'min', 'max',
    'no', 'nos', 'fig', 'figs', 'vol', 'vols', 'ed', 'eds', 'pp', 'p', 'ch',
    'jan', 'feb', 'mar', 'apr', 'jun', 'jul', 'aug', 'sep', 'sept', 'oct', 'nov', 'dec',
    'mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun',
]);

const SENTENCE_ENDERS = /[.!?]+/;

// ---------------------------------------------------------------------------
// Core helpers
// ---------------------------------------------------------------------------

/**
 * Check if a word ending with a period is an abbreviation.
 */
export function isAbbreviation(word: string, nextWord = ''): boolean {
    const base = word.replace(/\.+$/, '').toLowerCase();
    if (ABBREVIATIONS.has(base)) return true;
    // Single letter initial (A., B., etc.)
    if (base.length === 1 && /[a-z]/i.test(base)) return true;
    // Next word starts with lowercase → unlikely sentence start
    if (nextWord && /^[a-z]/.test(nextWord)) return true;
    return false;
}

// ---------------------------------------------------------------------------
// Full tokenizer (position-aware)
// ---------------------------------------------------------------------------

export interface SentenceToken {
    text: string;
    start: number;
    end: number;
    index: number;
}

/**
 * Full sentence tokenizer with abbreviation, quote, and decimal handling.
 *
 * @returns Array of sentence tokens with text, start/end offsets, and index.
 */
export function tokenizeSentences(text: string): SentenceToken[] {
    if (!text || text.trim().length === 0) return [];

    const normalized = text.replace(/\s+/g, ' ').trim();
    if (normalized.length === 0) return [];

    const sentences: SentenceToken[] = [];
    let current = '';
    let sentenceStart = 0;
    let inQuote = false;
    let i = 0;

    while (i < normalized.length) {
        const char = normalized[i];

        // Track quotes
        if (char === '"' || char === '\u201C' || char === '\u201D') {
            inQuote = !inQuote;
        }

        current += char;

        // Check for sentence end
        if (SENTENCE_ENDERS.test(char)) {
            // Consume trailing punctuation (e.g. "..." or "!?")
            let endIdx = i;
            while (endIdx < normalized.length - 1 && SENTENCE_ENDERS.test(normalized[endIdx + 1])) {
                endIdx++;
                current += normalized[endIdx];
            }

            // Include trailing close-quote
            if (inQuote && (normalized[endIdx + 1] === '"' || normalized[endIdx + 1] === '\u201D')) {
                endIdx++;
                current += normalized[endIdx];
                inQuote = false;
            }

            let isSentenceEnd = true;

            // Get word before punctuation
            const beforeMatch = current.match(/(\S+)[.!?]+ *["\u201D]?$/);
            const wordBeforePunct = beforeMatch ? beforeMatch[1] : '';

            // Get next word
            let nextWordStart = endIdx + 1;
            while (nextWordStart < normalized.length && /\s/.test(normalized[nextWordStart])) {
                nextWordStart++;
            }
            let nextWordEnd = nextWordStart;
            while (nextWordEnd < normalized.length && /\S/.test(normalized[nextWordEnd])) {
                nextWordEnd++;
            }
            const nextWord = normalized.slice(nextWordStart, nextWordEnd);

            // Abbreviation / decimal / initial checks (periods only)
            if (char === '.' && wordBeforePunct) {
                if (isAbbreviation(wordBeforePunct + '.', nextWord)) {
                    isSentenceEnd = false;
                }
                // Decimal numbers
                const numMatch = current.match(/(\d+\.\d*)$/);
                if (numMatch && nextWord && /^\d/.test(nextWord)) {
                    isSentenceEnd = false;
                }
                // Initials (J. K. Rowling)
                if (wordBeforePunct.length === 1 && /[A-Z]/.test(wordBeforePunct)) {
                    if (nextWord && (/^[A-Z]\.$/.test(nextWord) || /^[A-Z][a-z]/.test(nextWord))) {
                        isSentenceEnd = false;
                    }
                }
            }

            // Inside quotes → continue
            if (inQuote) isSentenceEnd = false;

            if (isSentenceEnd && current.trim().length > 0) {
                const trimmed = current.trim();
                sentences.push({
                    text: trimmed,
                    start: sentenceStart,
                    end: sentenceStart + trimmed.length,
                    index: sentences.length,
                });
                current = '';
                sentenceStart = endIdx + 1;
                while (sentenceStart < normalized.length && /\s/.test(normalized[sentenceStart])) {
                    sentenceStart++;
                }
            }

            i = endIdx;
        }

        i++;
    }

    // Remaining text (no final punctuation)
    const remaining = current.trim();
    if (remaining.length > 0) {
        sentences.push({
            text: remaining,
            start: sentenceStart,
            end: sentenceStart + remaining.length,
            index: sentences.length,
        });
    }

    return sentences;
}

// ---------------------------------------------------------------------------
// Simple splitter (fast, abbreviation-protected)
// ---------------------------------------------------------------------------

/**
 * Fast sentence splitting: splits on .!? followed by space + capital letter.
 * Protects known abbreviations from false splits.
 */
export function simpleSplitSentences(text: string): string[] {
    if (!text || text.trim().length === 0) return [];

    // Protect abbreviations
    let processed = text;
    const placeholders: string[] = [];

    for (const abbr of ABBREVIATIONS) {
        const pattern = new RegExp(`\\b${abbr}\\.`, 'gi');
        processed = processed.replace(pattern, (match) => {
            const placeholder = `__ABBR_${placeholders.length}__`;
            placeholders.push(match);
            return placeholder;
        });
    }

    // Split on sentence boundaries
    const parts = processed.split(/(?<=[.!?])\s+(?=[A-Z])/);

    // Restore abbreviations
    return parts.map(part => {
        let restored = part;
        placeholders.forEach((abbr, idx) => {
            restored = restored.replace(`__ABBR_${idx}__`, abbr);
        });
        return restored.trim();
    }).filter(s => s.length > 0);
}

// ---------------------------------------------------------------------------
// Utility functions
// ---------------------------------------------------------------------------

/**
 * Count words in text.
 */
export function sentenceCountWords(text: string): number {
    if (!text) return 0;
    return text.split(/\s+/).filter(w => w.length > 0).length;
}

/**
 * Truncate text to approximately N words.
 */
export function truncateToWords(text: string, maxWords: number): string {
    if (!text) return '';
    const words = text.split(/\s+/).filter(w => w.length > 0);
    if (words.length <= maxWords) return text;
    return words.slice(0, maxWords).join(' ') + '...';
}
