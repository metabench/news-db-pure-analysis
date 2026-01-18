import { describe, it, expect } from 'vitest';
import { groupArticlesBySimilarity } from './grouper.js';
import { ArticleInput } from '../types.js';

describe('Article Grouper', () => {
    const makeArticle = (id: string, simHash: string, publishedAt: Date = new Date()): ArticleInput => ({
        id,
        headline: `Article ${id}`,
        simHash,
        publishedAt,
        sourceDomain: 'example.com'
    });

    it('returns empty array for empty input', () => {
        expect(groupArticlesBySimilarity([], 3)).toEqual([]);
    });

    it('groups similar articles together', () => {
        const articles = [
            makeArticle('a1', 'ffffffffffffffff'),
            makeArticle('a2', 'efffffffffffffff'),  // 1 bit diff from a1
            makeArticle('a3', '0000000000000000'),  // 64 bit diff from a1
        ];

        const groups = groupArticlesBySimilarity(articles, 3);

        // a1 and a2 should be in the same cluster
        const clusterWithA1 = groups.find(g => g.memberIds.includes('a1'));
        expect(clusterWithA1?.memberIds).toContain('a2');
        expect(clusterWithA1?.memberIds).not.toContain('a3');
    });

    it('creates separate groups for dissimilar articles', () => {
        const articles = [
            makeArticle('a1', 'ffffffffffffffff'),
            makeArticle('a2', '0000000000000000'),
        ];

        const groups = groupArticlesBySimilarity(articles, 3);
        expect(groups.length).toBe(2);
    });
});
