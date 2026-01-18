/**
 * Vector Similarity Utilities
 * 
 * Pure functions for calculating similarity between numeric vectors
 * and sets.
 */

/**
 * Calculate Cosine Similarity between two vectors
 * cosine_sim(A, B) = (A · B) / (||A|| * ||B||)
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) {
        throw new Error('Vectors must have same length');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }

    if (normA === 0 || normB === 0) return 0;

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Calculate Jaccard Similarity between two sets (or arrays treated as sets)
 * J(A, B) = |A ∩ B| / |A ∪ B|
 */
export function jaccardSimilarity<T>(a: T[] | Set<T>, b: T[] | Set<T>): number {
    const setA = a instanceof Set ? a : new Set(a);
    const setB = b instanceof Set ? b : new Set(b);

    if (setA.size === 0 && setB.size === 0) return 1.0;

    let intersection = 0;
    for (const item of setA) {
        if (setB.has(item)) {
            intersection++;
        }
    }

    const union = setA.size + setB.size - intersection;
    return intersection / union;
}

/**
 * Calculate Dot Product of two vectors
 */
export function dotProduct(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) {
        throw new Error('Vectors must have same length');
    }
    return vecA.reduce((sum, val, i) => sum + val * vecB[i], 0);
}

/**
 * Calculate Euclidean Distance between two vectors
 */
export function euclideanDistance(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) {
        throw new Error('Vectors must have same length');
    }

    let sum = 0;
    for (let i = 0; i < vecA.length; i++) {
        const diff = vecA[i] - vecB[i];
        sum += diff * diff;
    }

    return Math.sqrt(sum);
}

/**
 * Create a sparse vector from tokens (Bag of Words)
 */
export function toSparseVector(tokens: string[], vocabulary: Map<string, number>): number[] {
    const vector = new Array(vocabulary.size).fill(0);

    for (const token of tokens) {
        const index = vocabulary.get(token);
        if (index !== undefined) {
            vector[index]++;
        }
    }

    return vector;
}
