import { describe, it, expect } from 'vitest';
import {
    tokenizeSentences,
    simpleSplitSentences,
    isAbbreviation,
    sentenceCountWords,
    truncateToWords,
    ABBREVIATIONS,
} from './sentenceTokenizer.js';

describe('tokenizeSentences', () => {
    it('splits basic sentences', () => {
        const result = tokenizeSentences('Hello world. How are you? Fine!');
        expect(result).toHaveLength(3);
        expect(result[0].text).toBe('Hello world.');
        expect(result[1].text).toBe('How are you?');
        expect(result[2].text).toBe('Fine!');
    });

    it('handles abbreviations correctly', () => {
        const result = tokenizeSentences('Mr. Smith went to Washington. He arrived on time.');
        expect(result).toHaveLength(2);
        expect(result[0].text).toContain('Mr.');
    });

    it('handles initials', () => {
        const result = tokenizeSentences('J. K. Rowling wrote Harry Potter. It was successful.');
        expect(result).toHaveLength(2);
        expect(result[0].text).toContain('J. K. Rowling');
    });

    it('handles empty input', () => {
        expect(tokenizeSentences('')).toEqual([]);
        expect(tokenizeSentences('   ')).toEqual([]);
    });

    it('handles text without final punctuation', () => {
        const result = tokenizeSentences('A sentence. And another one without period');
        expect(result).toHaveLength(2);
        expect(result[1].text).toBe('And another one without period');
    });

    it('provides start/end offsets and index', () => {
        const result = tokenizeSentences('First. Second. Third.');
        for (let i = 0; i < result.length; i++) {
            expect(result[i].index).toBe(i);
            expect(result[i].start).toBeDefined();
            expect(result[i].end).toBeDefined();
        }
    });
});

describe('simpleSplitSentences', () => {
    it('splits on sentence boundaries', () => {
        const result = simpleSplitSentences('Hello world. How are you? Fine!');
        expect(result).toHaveLength(3);
    });

    it('protects abbreviations', () => {
        const result = simpleSplitSentences('Dr. Smith is here. He is great.');
        // Dr. should NOT cause a split
        expect(result).toHaveLength(2);
    });

    it('handles empty input', () => {
        expect(simpleSplitSentences('')).toEqual([]);
    });
});

describe('isAbbreviation', () => {
    it('recognizes known abbreviations', () => {
        expect(isAbbreviation('Mr.')).toBe(true);
        expect(isAbbreviation('Dr.')).toBe(true);
        expect(isAbbreviation('U.S.')).toBe(true);
    });

    it('recognizes single letter initials', () => {
        expect(isAbbreviation('J.')).toBe(true);
    });

    it('checks next word case', () => {
        expect(isAbbreviation('something.', 'lowercase')).toBe(true);
        expect(isAbbreviation('something.', 'Uppercase')).toBe(false);
    });
});

describe('sentenceCountWords', () => {
    it('counts words correctly', () => {
        expect(sentenceCountWords('hello world')).toBe(2);
        expect(sentenceCountWords('  multiple   spaces  ')).toBe(2);
        expect(sentenceCountWords('')).toBe(0);
    });
});

describe('truncateToWords', () => {
    it('truncates long text', () => {
        const result = truncateToWords('one two three four five', 3);
        expect(result).toBe('one two three...');
    });

    it('does not truncate short text', () => {
        expect(truncateToWords('hello world', 5)).toBe('hello world');
    });

    it('handles empty input', () => {
        expect(truncateToWords('', 5)).toBe('');
    });
});

describe('ABBREVIATIONS', () => {
    it('contains expected entries', () => {
        expect(ABBREVIATIONS.has('mr')).toBe(true);
        expect(ABBREVIATIONS.has('jan')).toBe(true);
        expect(ABBREVIATIONS.has('inc')).toBe(true);
    });
});
