/**
 * Similarity & Clustering Utilities
 *
 * Pure functions for computing similarity between documents/articles.
 * Includes SimHash distance (existing), plus new additions:
 * - Jaccard similarity (set-based)
 * - MinHash signature generation for scalable Jaccard estimation
 * - LSH (Locality-Sensitive Hashing) bucket key generation
 *
 * Ported from copilot-dl-news SimilarityIndex.js / MinHasher.js.
 */

import { ArticleInput } from '../types.js';

// ---------------------------------------------------------------------------
// SimHash distance (existing, retained)
// ---------------------------------------------------------------------------

/**
 * Calculates the Hamming distance between two 16-character hex strings (64-bit hashes).
 */
export function calculateHammingDistance(hashA: string, hashB: string): number {
    if (hashA.length !== 16 || hashB.length !== 16) {
        throw new Error('Hashes must be 16-character hex strings');
    }
    let distance = 0;
    for (let i = 0; i < 16; i += 4) {
        const valA = parseInt(hashA.substring(i, i + 4), 16);
        const valB = parseInt(hashB.substring(i, i + 4), 16);
        let xor = valA ^ valB;
        while (xor > 0) {
            distance += xor & 1;
            xor >>= 1;
        }
    }
    return distance;
}

/**
 * Checks if two articles are similar based on SimHash distance.
 */
export function areArticlesSimilar(
    a: ArticleInput,
    b: ArticleInput,
    threshold: number = 3,
): boolean {
    const distance = calculateHammingDistance(a.simHash, b.simHash);
    return distance <= threshold;
}

// ---------------------------------------------------------------------------
// Jaccard similarity
// ---------------------------------------------------------------------------

/**
 * Compute Jaccard similarity between two sets.
 * J(A, B) = |A ∩ B| / |A ∪ B|
 *
 * @returns Similarity in [0, 1]
 */
export function jaccardSet(setA: Set<string>, setB: Set<string>): number {
    if (setA.size === 0 && setB.size === 0) return 1;
    if (setA.size === 0 || setB.size === 0) return 0;

    let intersection = 0;
    const [smaller, larger] = setA.size <= setB.size ? [setA, setB] : [setB, setA];
    for (const item of smaller) {
        if (larger.has(item)) intersection++;
    }

    const union = setA.size + setB.size - intersection;
    return union > 0 ? intersection / union : 0;
}

// ---------------------------------------------------------------------------
// MinHash
// ---------------------------------------------------------------------------

/**
 * Simple 32-bit hash function for MinHash (FNV-1a variant).
 */
function hash32(str: string, seed: number): number {
    let h = 2166136261 ^ seed;
    for (let i = 0; i < str.length; i++) {
        h ^= str.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return h >>> 0; // unsigned 32-bit
}

/**
 * Generate a MinHash signature for a set of tokens.
 *
 * For each of `numHashes` hash functions, the signature value is the
 * minimum hash across all tokens. Two documents with similar token sets
 * will produce similar signatures.
 *
 * @param tokens - Set of tokens (shingles) to hash
 * @param numHashes - Number of hash functions / signature length (default: 128)
 * @returns Uint32Array of length numHashes
 */
export function minHash(tokens: string[], numHashes: number = 128): Uint32Array {
    const sig = new Uint32Array(numHashes).fill(0xFFFFFFFF);

    for (const token of tokens) {
        for (let h = 0; h < numHashes; h++) {
            const hv = hash32(token, h * 7919); // distinct seed per hash
            if (hv < sig[h]) sig[h] = hv;
        }
    }

    return sig;
}

/**
 * Estimate Jaccard similarity from two MinHash signatures.
 *
 * @returns Estimated Jaccard similarity in [0, 1]
 */
export function estimateJaccardFromMinHash(a: Uint32Array, b: Uint32Array): number {
    if (a.length !== b.length) throw new Error('MinHash signatures must have equal length');
    if (a.length === 0) return 0;

    let agree = 0;
    for (let i = 0; i < a.length; i++) {
        if (a[i] === b[i]) agree++;
    }
    return agree / a.length;
}

// ---------------------------------------------------------------------------
// LSH (Locality-Sensitive Hashing) - band technique
// ---------------------------------------------------------------------------

/**
 * Compute an LSH bucket key for a specific band of a MinHash signature.
 *
 * The signature is divided into `numBands` bands of `rowsPerBand` rows each.
 * Two signatures that agree on all rows within any one band will hash to the
 * same bucket, making them candidate pairs.
 *
 * P(candidate) = 1 - (1 - s^r)^b  where s=Jaccard, r=rowsPerBand, b=numBands
 *
 * @param signature - MinHash signature (Uint32Array)
 * @param band - Band index (0-based)
 * @param rowsPerBand - Number of rows per band
 * @returns A string hash key for this band
 */
export function lshBucketKey(signature: Uint32Array, band: number, rowsPerBand: number): string {
    const start = band * rowsPerBand;
    const end = Math.min(start + rowsPerBand, signature.length);
    let key = '';
    for (let i = start; i < end; i++) {
        key += signature[i].toString(36) + ':';
    }
    return key;
}

/**
 * Estimate probability of two documents being candidates at a given Jaccard similarity.
 *
 * P = 1 - (1 - s^r)^b
 *
 * @param similarity - True Jaccard similarity (0-1)
 * @param rowsPerBand - Rows per band
 * @param numBands - Number of bands
 */
export function lshCandidateProbability(
    similarity: number,
    rowsPerBand: number,
    numBands: number,
): number {
    return 1 - Math.pow(1 - Math.pow(similarity, rowsPerBand), numBands);
}


