/**
 * TextRank Algorithm
 * 
 * Graph-based ranking algorithm for extractive summarization.
 * 
 * 1. Build a graph where sentences are nodes
 * 2. Edge weights are similarity (e.g., Jaccard or Cosine)
 * 3. Run PageRank to score nodes
 */

import { z } from 'zod';
import { jaccardSimilarity } from '../recommender/similarity.js';
import { tokenize } from '../text/tokenizer.js';

// --- Types ---
export const TextRankOptionsSchema = z.object({
    damping: z.number().default(0.85),
    maxIterations: z.number().default(100),
    convergence: z.number().default(0.0001),
    minSimilarity: z.number().default(0.1)
});

export type TextRankOptions = z.infer<typeof TextRankOptionsSchema>;

export interface RankedSentence {
    index: number;
    text: string;
    score: number;
}

/**
 * Calculate similarity between two sentences based on common tokens
 * (Simplified version using Jaccard on tokens)
 */
function calculateSentenceSimilarity(sentA: string[], sentB: string[]): number {
    // Use log length normalization to avoid bias towards long sentences
    const overlap = sentA.filter(token => sentB.includes(token)).length;
    if (overlap === 0) return 0;

    // Normalization factor from original TextRank paper: log(lenA) + log(lenB)
    const norm = Math.log(sentA.length) + Math.log(sentB.length);
    if (norm === 0) return 0;

    return overlap / norm;
}

/**
 * TextRank implementation
 */
export class TextRank {
    private options: TextRankOptions;

    constructor(options: Partial<TextRankOptions> = {}) {
        this.options = TextRankOptionsSchema.parse(options);
    }

    /**
     * Rank sentences
     * @param sentences - Array of sentence strings
     */
    rank(sentences: string[]): RankedSentence[] {
        const n = sentences.length;
        if (n === 0) return [];
        if (n === 1) return [{ index: 0, text: sentences[0], score: 1.0 }];

        // 1. Preprocess (tokenize)
        const tokenizedSentences = sentences.map(s =>
            tokenize(s, { removeStopwords: true, minLength: 2 })
        );

        // 2. Build Similarity Graph (Adjacency Matrix)
        const weights: number[][] = Array(n).fill(0).map(() => Array(n).fill(0));
        const outDegree: number[] = Array(n).fill(0);

        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                if (i === j) continue;

                const weight = calculateSentenceSimilarity(tokenizedSentences[i], tokenizedSentences[j]);
                if (weight >= this.options.minSimilarity) {
                    weights[i][j] = weight;
                    outDegree[i] += weight;
                }
            }
        }

        // 3. PageRank Iteration
        let scores = Array(n).fill(1.0); // Initial scores
        let newScores = Array(n).fill(0);
        let iterations = 0;
        let diff = Infinity;

        while (iterations < this.options.maxIterations && diff > this.options.convergence) {
            diff = 0;

            for (let i = 0; i < n; i++) {
                let sum = 0;

                // Sum of incoming edges (j -> i)
                for (let j = 0; j < n; j++) {
                    if (i === j) continue;

                    if (weights[j][i] > 0 && outDegree[j] > 0) {
                        sum += (weights[j][i] / outDegree[j]) * scores[j];
                    }
                }

                // PageRank formula: (1-d) + d * sum(...)
                newScores[i] = (1 - this.options.damping) + this.options.damping * sum;
                diff = Math.max(diff, Math.abs(newScores[i] - scores[i]));
            }

            scores = [...newScores];
            iterations++;
        }

        // 4. Sort and Return
        return sentences
            .map((text, index) => ({ index, text, score: scores[index] }))
            .sort((a, b) => b.score - a.score);
    }

    /**
     * Extractive summarization
     */
    summarize(sentences: string[], count = 3): RankedSentence[] {
        const ranked = this.rank(sentences);
        // Take top N by score
        const top = ranked.slice(0, count);
        // Sort back by original index for coherent reading
        return top.sort((a, b) => a.index - b.index);
    }
}
