import { ArticleInput } from '../types.js';
import { calculateHammingDistance } from './similarity.js';

export interface ArticleGroup {
    id: string;
    centerArticleId: string;
    memberIds: string[];
    averageDistance: number;
}

/**
 * Groups articles by SimHash similarity using a greedy clustering approach.
 * 
 * @param articles - Array of articles with simHash
 * @param threshold - Maximum Hamming distance for grouping (default: 3)
 * @returns Array of article groups
 */
export function groupArticlesBySimilarity(
    articles: ArticleInput[],
    threshold: number = 3
): ArticleGroup[] {
    if (articles.length === 0) return [];

    const groups: ArticleGroup[] = [];
    const assigned = new Set<string>();

    // Sort by publish date (newest first acts as center)
    const sorted = [...articles].sort((a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );

    for (const article of sorted) {
        if (assigned.has(article.id)) continue;

        // Start a new group with this article as center
        const group: ArticleGroup = {
            id: `cluster-${groups.length + 1}`,
            centerArticleId: article.id,
            memberIds: [article.id],
            averageDistance: 0
        };

        let totalDistance = 0;

        // Find all unassigned articles within threshold
        for (const candidate of sorted) {
            if (candidate.id === article.id || assigned.has(candidate.id)) continue;

            const distance = calculateHammingDistance(article.simHash, candidate.simHash);
            if (distance <= threshold) {
                group.memberIds.push(candidate.id);
                assigned.add(candidate.id);
                totalDistance += distance;
            }
        }

        if (group.memberIds.length > 1) {
            group.averageDistance = totalDistance / (group.memberIds.length - 1);
        }

        assigned.add(article.id);
        groups.push(group);
    }

    return groups;
}
