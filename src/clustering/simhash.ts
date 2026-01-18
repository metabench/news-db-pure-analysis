/**
 * SimHash - 64-bit fingerprinting for near-duplicate detection
 * 
 * Pure implementation using FNV-1a hashing and BigInt for 64-bit operations.
 * Compatible with the algorithm in copilot-dl-news.
 */

// FNV-1a constants (64-bit)
const FNV_OFFSET_BASIS = 14695981039346656037n;
const FNV_PRIME = 1099511628211n;
const MASK_64 = (1n << 64n) - 1n;

/**
 * FNV-1a 64-bit hash
 * @param str - String to hash
 * @returns 64-bit hash as bigint
 */
export function fnv1a64(str: string): bigint {
    let hash = FNV_OFFSET_BASIS;
    for (let i = 0; i < str.length; i++) {
        hash ^= BigInt(str.charCodeAt(i));
        hash = (hash * FNV_PRIME) & MASK_64;
    }
    return hash;
}

/**
 * Tokenize text into words
 * @param text - Text to tokenize
 * @param minLength - Minimum word length (default: 2)
 * @returns Array of lowercase tokens
 */
export function tokenize(text: string, minLength: number = 2): string[] {
    return text
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length >= minLength);
}

/**
 * Compute SimHash fingerprint
 * @param text - Text to fingerprint
 * @returns 16-character hex string (64 bits)
 */
export function computeSimHash(text: string): string {
    const tokens = tokenize(text);
    if (tokens.length === 0) return '0000000000000000';

    // Initialize 64-bit vector
    const vector: number[] = new Array(64).fill(0);

    for (const token of tokens) {
        const hash = fnv1a64(token);
        for (let i = 0; i < 64; i++) {
            const bit = Number((hash >> BigInt(i)) & 1n);
            vector[i] += bit === 1 ? 1 : -1;
        }
    }

    // Build fingerprint from vector
    let fingerprint = 0n;
    for (let i = 0; i < 64; i++) {
        if (vector[i] > 0) {
            fingerprint |= 1n << BigInt(i);
        }
    }

    return fingerprint.toString(16).padStart(16, '0');
}

/**
 * Calculate Hamming distance between two hex fingerprints
 * @param a - First fingerprint (16-char hex)
 * @param b - Second fingerprint (16-char hex)
 * @returns Number of differing bits (0-64)
 */
export function hammingDistance(a: string, b: string): number {
    const valA = BigInt('0x' + a);
    const valB = BigInt('0x' + b);
    let xor = valA ^ valB;

    let count = 0;
    while (xor > 0n) {
        count += Number(xor & 1n);
        xor >>= 1n;
    }
    return count;
}

/**
 * Check if two fingerprints are near-duplicates
 * @param a - First fingerprint
 * @param b - Second fingerprint
 * @param threshold - Max Hamming distance (default: 3)
 */
export function isNearDuplicate(a: string, b: string, threshold: number = 3): boolean {
    return hammingDistance(a, b) <= threshold;
}

/**
 * Convert Hamming distance to similarity score (0-1)
 */
export function distanceToSimilarity(distance: number): number {
    return 1 - (distance / 64);
}

/**
 * Classify match type based on distance
 */
export function getMatchType(distance: number): 'exact' | 'near' | 'similar' | 'different' {
    if (distance === 0) return 'exact';
    if (distance <= 3) return 'near';
    if (distance <= 10) return 'similar';
    return 'different';
}
