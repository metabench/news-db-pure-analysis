import { describe, it, expect } from 'vitest';
import { evaluateTree, evaluateAllTrees, DecisionNode } from './decisionTree.js';

describe('Decision Tree Engine', () => {
    const simpleTree: DecisionNode = {
        id: 'root',
        condition: { type: 'url_matches', pattern: '/article/' },
        yes: { id: 'article', result: true, confidence: 0.9 },
        no: { id: 'not-article', result: false, confidence: 0.3 }
    };

    it('evaluates tree with matching condition', () => {
        const result = evaluateTree(simpleTree, { url: 'https://news.com/article/123' });
        expect(result.match).toBe(true);
        expect(result.confidence).toBe(0.9);
    });

    it('evaluates tree with non-matching condition', () => {
        const result = evaluateTree(simpleTree, { url: 'https://news.com/about/' });
        expect(result.match).toBe(false);
    });

    it('creates audit trail', () => {
        const result = evaluateTree(simpleTree, { url: 'https://news.com/article/123' });
        expect(result.path.length).toBeGreaterThan(0);
        expect(result.path[0].branch).toBe('yes');
    });

    it('evaluates multiple trees', () => {
        const trees = [
            { id: 'cat1', tree: simpleTree },
            { id: 'cat2', tree: { ...simpleTree, condition: { type: 'url_matches' as const, pattern: '/home/' } } }
        ];
        const results = evaluateAllTrees(trees, { url: 'https://news.com/article/1' });
        expect(results.find(r => r.id === 'cat1')?.result.match).toBe(true);
        expect(results.find(r => r.id === 'cat2')?.result.match).toBe(false);
    });
});
