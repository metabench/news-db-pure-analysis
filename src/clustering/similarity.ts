import { ArticleInput } from '../types.js';

/**
 * Calculates the Hamming distance between two 16-character hex strings (64-bit hashes).
 * 
 * @param hashA - First hex string
 * @param hashB - Second hex string
 * @returns Number of differing bits (0-64)
 */
export function calculateHammingDistance(hashA: string, hashB: string): number {
    if (hashA.length !== 16 || hashB.length !== 16) {
        throw new Error("Hashes must be 16-character hex strings");
    }

    let distance = 0;
    for (let i = 0; i < 16; i += 4) {
        // Process 4 hex chars (16 bits) at a time to avoid overflow
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
 * 
 * @param a - First article
 * @param b - Second article
 * @param threshold - Maximum hamming distance (default: 3)
 */
export function areArticlesSimilar(
    a: ArticleInput,
    b: ArticleInput,
    threshold: number = 3
): boolean {
    // 1. SimHash check
    const distance = calculateHammingDistance(a.simHash, b.simHash);
    if (distance > threshold) return false;

    // 2. Add more pure logic here (e.g. time window check)
    return true;
}
