/**
 * TF-IDF Vectorization
 *
 * Pure-functional TF-IDF (Term Frequency – Inverse Document Frequency)
 * for document vectorization and similarity computation.
 *
 * Ported from copilot-dl-news TfIdfVectorizer with improvements:
 * - Fully stateless (no class, just functions)
 * - Sparse vector representation (Map<number, number>)
 * - Cosine similarity with optimized smaller-vector iteration
 * - Full similarity matrix builder
 * - L2-normalization support
 */

// ---------------------------------------------------------------------------
// Tokenization
// ---------------------------------------------------------------------------

const DEFAULT_MIN_LENGTH = 3;
const DEFAULT_MAX_LENGTH = 30;

// Common English stop words (news domain)
const STOP_WORDS = new Set([
    'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
    'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
    'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
    'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what',
    'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me',
    'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know', 'take',
    'people', 'into', 'year', 'your', 'some', 'could', 'them', 'see', 'other',
    'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over', 'think',
    'also', 'back', 'after', 'use', 'two', 'how', 'our', 'way', 'even',
    'new', 'want', 'because', 'any', 'these', 'give', 'day', 'most', 'us',
    'was', 'were', 'been', 'has', 'had', 'are', 'is', 'did', 'does',
    'said', 'may', 'more', 'very', 'much', 'too', 'own', 'such', 'each',
]);

/**
 * Tokenize text into words suitable for TF-IDF.
 * Lowercases, strips non-alpha, removes stop words and very short/long tokens.
 */
export function tokenizeForTfIdf(
    text: string,
    options: { minLength?: number; maxLength?: number } = {},
): string[] {
    const minLen = options.minLength ?? DEFAULT_MIN_LENGTH;
    const maxLen = options.maxLength ?? DEFAULT_MAX_LENGTH;

    if (!text) return [];

    return text
        .toLowerCase()
        .replace(/['']/g, '')
        .split(/[^a-z]+/)
        .filter(t =>
            t.length >= minLen &&
            t.length <= maxLen &&
            !STOP_WORDS.has(t) &&
            !/^\d+$/.test(t),
        );
}

// ---------------------------------------------------------------------------
// TF-IDF core
// ---------------------------------------------------------------------------

/**
 * Calculate term frequency for a token list.
 * Returns normalized TF: count(term) / totalTokens.
 */
export function tfidfTF(tokens: string[]): Map<string, number> {
    const freq = new Map<string, number>();
    for (const t of tokens) {
        freq.set(t, (freq.get(t) || 0) + 1);
    }
    const total = tokens.length;
    if (total === 0) return freq;
    for (const [term, count] of freq) {
        freq.set(term, count / total);
    }
    return freq;
}

/**
 * Calculate inverse document frequency from a corpus.
 *
 * IDF(t) = log(N / (df(t) + 1)) + 1   (smoothed)
 *
 * @param documents - Array of token arrays (one per document)
 * @returns Map<term, idf>
 */
export function tfidfIDF(documents: string[][]): Map<string, number> {
    const N = documents.length;
    const docFreq = new Map<string, number>();
    for (const doc of documents) {
        const unique = new Set(doc);
        for (const term of unique) {
            docFreq.set(term, (docFreq.get(term) || 0) + 1);
        }
    }
    const idf = new Map<string, number>();
    for (const [term, df] of docFreq) {
        idf.set(term, Math.log(N / (df + 1)) + 1);
    }
    return idf;
}

/**
 * Build a vocabulary index mapping terms to column numbers.
 */
export function buildVocabulary(idf: Map<string, number>): Map<string, number> {
    const vocab = new Map<string, number>();
    let idx = 0;
    for (const term of idf.keys()) {
        vocab.set(term, idx++);
    }
    return vocab;
}

/**
 * Create a sparse TF-IDF vector for a document.
 *
 * @param tokens - Token list for the document
 * @param idf - Pre-computed IDF map
 * @param vocab - Vocabulary index map
 * @param normalize - L2-normalize the vector (default: true)
 */
export function tfidfSparseVector(
    tokens: string[],
    idf: Map<string, number>,
    vocab: Map<string, number>,
    normalize = true,
): Map<number, number> {
    const tf = tfidfTF(tokens);
    const vector = new Map<number, number>();

    for (const [term, tfVal] of tf) {
        const idx = vocab.get(term);
        if (idx === undefined) continue;
        const idfVal = idf.get(term) ?? 1;
        vector.set(idx, tfVal * idfVal);
    }

    if (normalize && vector.size > 0) {
        let mag = 0;
        for (const v of vector.values()) mag += v * v;
        mag = Math.sqrt(mag);
        if (mag > 0) {
            for (const [k, v] of vector) vector.set(k, v / mag);
        }
    }

    return vector;
}

// ---------------------------------------------------------------------------
// Similarity
// ---------------------------------------------------------------------------

/**
 * Compute dot product of two sparse TF-IDF vectors.
 */
export function tfidfDotProduct(a: Map<number, number>, b: Map<number, number>): number {
    let dot = 0;
    const [smaller, larger] = a.size <= b.size ? [a, b] : [b, a];
    for (const [idx, val] of smaller) {
        const other = larger.get(idx);
        if (other !== undefined) dot += val * other;
    }
    return dot;
}

/**
 * Compute cosine similarity between two sparse TF-IDF vectors.
 */
export function tfidfCosineSimilarity(a: Map<number, number>, b: Map<number, number>): number {
    if (a.size === 0 || b.size === 0) return 0;

    const dot = tfidfDotProduct(a, b);

    let magA = 0;
    for (const v of a.values()) magA += v * v;
    let magB = 0;
    for (const v of b.values()) magB += v * v;

    magA = Math.sqrt(magA);
    magB = Math.sqrt(magB);

    if (magA === 0 || magB === 0) return 0;
    return dot / (magA * magB);
}

/**
 * Compute Euclidean distance between two sparse TF-IDF vectors.
 */
export function tfidfEuclideanDistance(a: Map<number, number>, b: Map<number, number>): number {
    const allKeys = new Set([...a.keys(), ...b.keys()]);
    let sum = 0;
    for (const k of allKeys) {
        const diff = (a.get(k) || 0) - (b.get(k) || 0);
        sum += diff * diff;
    }
    return Math.sqrt(sum);
}

/**
 * Build an N×N similarity matrix from an array of sparse TF-IDF vectors.
 */
export function tfidfSimilarityMatrix(vectors: Map<number, number>[]): number[][] {
    const n = vectors.length;
    const matrix: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
    for (let i = 0; i < n; i++) {
        matrix[i][i] = 1;
        for (let j = i + 1; j < n; j++) {
            const sim = tfidfCosineSimilarity(vectors[i], vectors[j]);
            matrix[i][j] = sim;
            matrix[j][i] = sim;
        }
    }
    return matrix;
}

// ---------------------------------------------------------------------------
// High-level pipeline
// ---------------------------------------------------------------------------

/**
 * Fit + transform: tokenize documents, compute IDF, and return sparse vectors.
 *
 * This is the main entry point for one-shot TF-IDF vectorization.
 */
export function fitTransform(
    documents: string[],
    options: { normalize?: boolean; minLength?: number; maxLength?: number } = {},
): {
    vectors: Map<number, number>[];
    vocab: Map<string, number>;
    idf: Map<string, number>;
} {
    const tokenized = documents.map(d => tokenizeForTfIdf(d, options));
    const idf = tfidfIDF(tokenized);
    const vocab = buildVocabulary(idf);
    const vectors = tokenized.map(tokens =>
        tfidfSparseVector(tokens, idf, vocab, options.normalize !== false),
    );
    return { vectors, vocab, idf };
}
