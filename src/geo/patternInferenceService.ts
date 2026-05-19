export interface InferredPattern {
    pattern: string;
    count: number;
    weight: number;
}

/**
 * Pure analysis service to dynamically infer hub URL patterns for a domain
 * based on the history of crawled URLs.
 */
export class PatternInferenceService {
    /**
     * Infers URL patterns for a given domain by identifying where known
     * place slugs appear in the domain's crawled URLs.
     * 
     * @param urlPaths A list of URL paths (e.g., ['/world/australia', '/uk', '/us'])
     * @param knownCountrySlugs A list of known country slugs/names
     */
    public static inferCountryHubPatterns(urlPaths: string[], knownCountrySlugs: string[]): InferredPattern[] {
        const slugs = new Set(knownCountrySlugs.map(s => s.toLowerCase().replace(/[^a-z0-9]+/g, '')));
        // Standard shortcodes
        ['uk', 'us', 'au', 'nz', 'za', 'ca', 'ie', 'in'].forEach(code => slugs.add(code));

        const patternCounts = new Map<string, number>();

        for (const path of urlPaths) {
            const tokens = path.split('/').filter(Boolean);
            if (tokens.length === 0) continue;

            for (let i = 0; i < tokens.length; i++) {
                const token = tokens[i].toLowerCase().replace(/[^a-z0-9]+/g, '');
                if (slugs.has(token)) {
                    const patternTokens = [...tokens];
                    patternTokens[i] = '{slug}';

                    if (patternTokens.length <= 3) {
                        const pattern = '/' + patternTokens.join('/');
                        patternCounts.set(pattern, (patternCounts.get(pattern) || 0) + 1);
                    }
                }
            }
        }

        const sortedPatterns = Array.from(patternCounts.entries())
            .filter(([pattern, count]) => {
                if (count < 2) return false;
                const parts = pattern.split('/').filter(Boolean);
                const slugIdx = parts.indexOf('{slug}');
                if (slugIdx >= 0 && slugIdx < parts.length - 1) return false;
                return true;
            })
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);

        if (sortedPatterns.length === 0) {
            return [];
        }

        const topCount = sortedPatterns[0][1];

        return sortedPatterns.map(([pattern, count]) => {
            const relativeFreq = count / topCount;
            const weight = 0.8 + (relativeFreq * 0.7);
            return { pattern, count, weight: Number(weight.toFixed(2)) };
        });
    }

    /**
     * Discovers country hub URLs from a set of already-known URLs by matching
     * their path structure against known country slugs.
     * 
     * This is a zero-fetch strategy — it finds hubs that already exist in
     * the crawled data without needing any new HTTP requests.
     * 
     * @param urlPaths Array of URL pathnames from the target domain
     * @param countrySlugsMap Map of slug -> place metadata (name, code, id)
     * @returns Array of discovered hub candidates with matched country info
     */
    public static discoverHubsFromPaths(
        urlPaths: string[],
        countrySlugsMap: Map<string, { name: string; code: string; id?: number }>
    ): Array<{ path: string; country: { name: string; code: string; id?: number }; depth: number }> {
        const discovered: Array<{ path: string; country: { name: string; code: string; id?: number }; depth: number }> = [];
        const seen = new Set<string>();

        for (const path of urlPaths) {
            const tokens = path.split('/').filter(Boolean);
            // Only consider short hub-like paths (1-2 segments)
            if (tokens.length === 0 || tokens.length > 2) continue;

            // Check the last token against our country slug map
            const lastToken = tokens[tokens.length - 1].toLowerCase();
            const match = countrySlugsMap.get(lastToken);
            if (match && !seen.has(path)) {
                seen.add(path);
                discovered.push({
                    path,
                    country: match,
                    depth: tokens.length
                });
            }
        }

        return discovered;
    }

    /**
     * Detect compound news sections like /australia-news, /us-news from URL structure.
     * These are domain-specific country sections that use a {country}-{suffix} naming.
     * 
     * @param urlPaths Array of URL pathnames from the target domain
     * @param knownCountrySlugs Array of known country slugs
     * @returns Map of compound section -> country slug (e.g. 'australia-news' -> 'australia')
     */
    public static detectCompoundSections(
        urlPaths: string[],
        knownCountrySlugs: string[]
    ): Map<string, string> {
        const slugSet = new Set(knownCountrySlugs.map(s => s.toLowerCase().replace(/[^a-z0-9]+/g, '')));
        const suffixes = ['news', 'politics', 'sport', 'culture', 'opinion', 'economy', 'business'];

        // Count first-segment occurrences
        const segmentCounts = new Map<string, number>();
        for (const path of urlPaths) {
            const first = path.split('/').filter(Boolean)[0];
            if (first) segmentCounts.set(first, (segmentCounts.get(first) || 0) + 1);
        }

        const results = new Map<string, string>();

        for (const [segment, count] of segmentCounts) {
            if (count < 5) continue; // Minimum threshold for compound section

            for (const suffix of suffixes) {
                if (segment.endsWith('-' + suffix)) {
                    const prefix = segment.slice(0, -(suffix.length + 1));
                    const normalized = prefix.replace(/[^a-z0-9]+/g, '');
                    if (slugSet.has(normalized)) {
                        results.set(segment, prefix);
                    }
                }
            }
        }

        return results;
    }
}
