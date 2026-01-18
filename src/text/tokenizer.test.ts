import { describe, it, expect } from 'vitest';
import { tokenize, splitSentences, countWords, ngrams, topWords, isLikelyEnglish } from './tokenizer.js';

describe('Text Utilities', () => {
    it('tokenizes text', () => {
        const tokens = tokenize('Hello, world! This is a test.');
        expect(tokens).toContain('hello');
        expect(tokens).toContain('world');
    });

    it('respects minLength', () => {
        const tokens = tokenize('I am a cat', { minLength: 3 });
        expect(tokens).not.toContain('a');
        expect(tokens).toContain('cat');
    });

    it('removes stopwords when requested', () => {
        const tokens = tokenize('The quick brown fox', { removeStopwords: true });
        expect(tokens).not.toContain('the');
        expect(tokens).toContain('quick');
    });

    it('splits sentences', () => {
        const sentences = splitSentences('Hello. How are you? I am fine!');
        expect(sentences.length).toBe(3);
    });

    it('counts words', () => {
        expect(countWords('One two three')).toBe(3);
    });

    it('extracts ngrams', () => {
        const tokens = ['a', 'b', 'c', 'd'];
        const bigrams = ngrams(tokens, 2);
        expect(bigrams).toContain('a b');
        expect(bigrams).toContain('c d');
    });

    it('gets top words', () => {
        const top = topWords('hello hello world world world', 2);
        expect(top[0].word).toBe('world');
        expect(top[0].count).toBe(3);
    });

    it('detects English text', () => {
        expect(isLikelyEnglish('The quick brown fox jumps over the lazy dog')).toBe(true);
    });
});
