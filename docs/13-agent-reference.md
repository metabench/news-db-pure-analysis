# Chapter 13: Agent Reference

Dense, machine-optimized reference for AI agents consuming this library. Every exported symbol, every type constraint, every algorithm detail in one place.

---

## PACKAGE IDENTITY

```
name: news-db-pure-analysis
version: 1.0.0
type: module
entry_esm: dist/index.js
entry_cjs: dist/index.cjs
entry_types: dist/index.d.ts
runtime_deps: zod@^3.22.0, date-fns@^3.0.0
import_style: import { X } from 'news-db-pure-analysis'
key_property: ZERO_IO — all functions are pure, no network/fs/db calls
```

---

## COMPLETE EXPORT MAP

### src/types.ts

| Export | Kind | Signature |
|---|---|---|
| `DateRangeSchema` | ZodObject | `z.object({ startDate: z.string().or(z.date()), endDate: z.string().or(z.date()) })` |
| `DateRange` | Type | `{ startDate: string \| Date; endDate: string \| Date }` |
| `ArticleInputSchema` | ZodObject | `z.object({ id: z.string(), content: z.string().optional(), headline: z.string(), simHash: z.string().regex(/^[a-fA-F0-9]{16}$/), publishedAt: z.string().or(z.date()), sourceDomain: z.string() })` |
| `ArticleInput` | Type | `{ id: string; content?: string; headline: string; simHash: string; publishedAt: string \| Date; sourceDomain: string }` |
| `ClusterSchema` | ZodObject | `z.object({ id: z.string(), memberIds: z.array(z.string()), centerSimHash: z.string(), createdAt: z.date() })` |
| `Cluster` | Type | `{ id: string; memberIds: string[]; centerSimHash: string; createdAt: Date }` |

### src/text/tokenizer.ts

| Export | Kind | Signature |
|---|---|---|
| `STOPWORDS` | `Set<string>` | 80+ English stopwords: a, an, the, and, or, but, in, on, at, to, for, of, with, by, from, as, is, was, are, were, been, be, have, has, had, do, does, did, will, would, could, should, may, might, must, shall, can, need, dare, ought, used, this, that, these, those, i, you, he, she, it, we, they, what, which, who, whom, where, when, why, how, all, each, every, both, few, more, most, other, some, such, no, nor, not, only, own, same, so, than, too, very, s, t, just, don, now |
| `TokenizeOptions` | Interface | `{ minLength?: number; removeStopwords?: boolean; lowercase?: boolean }` |
| `tokenize` | Function | `(text: string, options?: TokenizeOptions) => string[]` |
| `splitSentences` | Function | `(text: string) => string[]` |
| `countWords` | Function | `(text: string) => number` |
| `ngrams` | Function | `(tokens: string[], n: number) => string[]` |
| `wordFrequency` | Function | `(text: string, options?: TokenizeOptions) => Map<string, number>` |
| `topWords` | Function | `(text: string, n?: number, options?: TokenizeOptions) => { word: string; count: number }[]` |
| `isLikelyEnglish` | Function | `(text: string) => boolean` — returns true if >10% stopword density or <5 tokens |

### src/clustering/simhash.ts

| Export | Kind | Signature |
|---|---|---|
| `fnv1a64` | Function | `(str: string) => bigint` — FNV-1a 64-bit hash |
| `computeSimHash` | Function | `(text: string) => string` — returns 16-char hex. Empty text → `'0000000000000000'` |
| `hammingDistance` | Function | `(a: string, b: string) => number` — bit diff count 0-64 |
| `isNearDuplicate` | Function | `(a: string, b: string, threshold?: number=3) => boolean` |
| `distanceToSimilarity` | Function | `(distance: number) => number` — formula: `1 - distance/64` |
| `getMatchType` | Function | `(distance: number) => 'exact'\|'near'\|'similar'\|'different'` — 0=exact, 1-3=near, 4-10=similar, 11+=different |

### src/clustering/similarity.ts

| Export | Kind | Signature |
|---|---|---|
| `calculateHammingDistance` | Function | `(hashA: string, hashB: string) => number` — throws if not 16 chars |
| `areArticlesSimilar` | Function | `(a: ArticleInput, b: ArticleInput, threshold?: number=3) => boolean` |

### src/clustering/grouper.ts

| Export | Kind | Signature |
|---|---|---|
| `ArticleGroup` | Interface | `{ id: string; centerArticleId: string; memberIds: string[]; averageDistance: number }` |
| `groupArticlesBySimilarity` | Function | `(articles: ArticleInput[], threshold?: number=3) => ArticleGroup[]` — greedy O(n^2), sorts by publishedAt DESC |

### src/sentiment/lexicon.ts

| Export | Kind | Signature |
|---|---|---|
| `NEGATORS` | `Set<string>` | `not, no, never, neither, n't, none, nobody, nothing` |
| `AMPLIFIERS` | `Record<string, number>` | `very:1.5, really:1.3, extremely:2.0, absolutely:1.8, incredibly:1.7, completely:1.5, totally:1.4` |
| `SentimentResultSchema` | ZodObject | score, normalizedScore, label, confidence, wordCount, sentimentWords |
| `SentimentResult` | Type | `{ score: number; normalizedScore: number; label: 'positive'\|'negative'\|'neutral'; confidence: number; wordCount: number; sentimentWords: number }` |
| `analyzeSentiment` | Function | `(text: string, lexicon?: Record<string, number>) => SentimentResult` |
| `compareSentiment` | Function | `(textA: string, textB: string) => { aScore: number; bScore: number; difference: number; agreementLabel: 'agree'\|'disagree' }` |
| `getDefaultLexicon` | Function | `() => Record<string, number>` — returns copy of 54-word lexicon |

Sentiment scoring: normalizedScore = clamp(rawScore / (sentimentWords * 3), -1, 1). Label: >0.1=positive, <-0.1=negative, else neutral. Confidence: min(1, (sentimentWords/wordCount)*2).

### src/trends/detector.ts

| Export | Kind | Signature |
|---|---|---|
| `TopicCountSchema` | ZodObject | topicId, topicName?, date, count |
| `TopicCount` | Type | `{ topicId: string\|number; topicName?: string; date: string; count: number }` |
| `TrendResultSchema` | ZodObject | topicId, topicName?, currentCount, baselineMean, baselineStdDev, zScore, percentChange, isTrending |
| `TrendResult` | Type | `{ topicId: string\|number; topicName?: string; currentCount: number; baselineMean: number; baselineStdDev: number; zScore: number; percentChange: number; isTrending: boolean }` |
| `mean` | Function | `(values: number[]) => number` — arithmetic mean, 0 for empty |
| `stddev` | Function | `(values: number[], avg?: number) => number` — population stddev, 0 for <2 values |
| `calculateBaseline` | Function | `(historicalCounts: number[]) => { mean: number; stddev: number }` |
| `calculateTrendScore` | Function | `(currentCount: number, baseline: {mean,stddev}, sigmaThreshold?: number=2.0) => { zScore: number; percentChange: number; isTrending: boolean }` |
| `detectTrends` | Function | `(topicCounts: {topicId,topicName?,counts:number[]}[], options?: {sigmaThreshold?:2.0, minBaseline?:3}) => TrendResult[]` — counts[0]=current, counts[1..]=historical. Sorted by zScore DESC. |
| `filterTrending` | Function | `(results: TrendResult[]) => TrendResult[]` — filter to isTrending===true |

### src/quality/anomaly.ts

| Export | Kind | Signature |
|---|---|---|
| `TimeSeriesPointSchema` | ZodObject | date, value |
| `TimeSeriesPoint` | Type | `{ date: string\|Date; value: number }` |
| `AnomalySchema` | ZodObject | date, value, zScore, isAnomaly, direction |
| `Anomaly` | Type | `{ date: string; value: number; zScore: number; isAnomaly: boolean; direction: 'above'\|'below'\|'normal' }` |
| `AnomalyReport` | Interface | `{ anomalies: Anomaly[]; mean: number; stdDev: number; threshold: number }` |
| `detectAnomalies` | Function | `(points: TimeSeriesPoint[], config?: {sigma?:2}) => AnomalyReport` — returns report for all points |
| `isValueAnomalous` | Function | `(historicalValues: number[], newValue: number, sigma?: number=2) => boolean` |

### src/classification/decisionTree.ts

| Export | Kind | Signature |
|---|---|---|
| `Condition` | Type | `{ type: 'url_matches'\|'text_contains'\|'compare'\|'flag'\|'and'\|'or'; pattern?: string; field?: string; operator?: '>'\|'<'\|'>='\|'<='\|'=='\|'!='; value?: any; conditions?: Condition[] }` |
| `ConditionSchema` | ZodLazy | Recursive validation |
| `DecisionNode` | Type | `{ id: string; condition?: Condition; yes?: DecisionNode; no?: DecisionNode; result?: boolean; confidence?: number }` |
| `DecisionNodeSchema` | ZodLazy | Recursive validation |
| `EvaluationContext` | Interface | `{ url?: string; title?: string; content?: string; wordCount?: number; flags?: Record<string,boolean>; [key:string]: any }` |
| `PathStep` | Interface | `{ nodeId: string; condition: string; result: boolean; branch: 'yes'\|'no' }` |
| `EvaluationResult` | Interface | `{ match: boolean; confidence: number; path: PathStep[]; reason: string }` |
| `evaluateTree` | Function | `(tree: DecisionNode, context: EvaluationContext) => EvaluationResult` |
| `evaluateAllTrees` | Function | `(trees: {id:string; tree:DecisionNode}[], context: EvaluationContext) => {id:string; result:EvaluationResult}[]` |
| `getMatches` | Function | `(trees: {id:string; tree:DecisionNode}[], context: EvaluationContext) => {id:string; result:EvaluationResult}[]` — filtered to match===true |

Condition evaluation: url_matches → regex test (fallback includes), text_contains → lowercase substring in title+content, compare → field[operator]value, flag → context.flags[field]===true, and → every, or → some. Default leaf confidence: true=0.8, false=0.2.

### src/content/categoryDetector.ts

| Export | Kind | Signature |
|---|---|---|
| `CATEGORY_PATTERNS` | Object | `Record<CategoryType, RegExp[]>` — inDepth, opinion, live, explainer, multimedia, hub |
| `CategoryType` | Type | `'inDepth'\|'opinion'\|'live'\|'explainer'\|'multimedia'\|'hub'` |
| `CategoryResultSchema` | ZodObject | category, confidence, matchedPattern? |
| `CategoryResult` | Type | `{ category: string; confidence: number; matchedPattern?: string }` |
| `matchesPatterns` | Function | `(url: string, patterns: RegExp[]) => { matches: boolean; pattern?: string }` |
| `detectCategoriesFromUrl` | Function | `(url: string) => CategoryResult[]` — confidence 0.8 for URL matches |
| `detectFromContentSignals` | Function | `(signals: {wordCount?,hasVideo?,hasGallery?,paragraphCount?,linkDensity?}) => CategoryResult[]` |
| `detectPageCategories` | Function | `(url: string, contentSignals?) => CategoryResult[]` — merged, sorted by confidence DESC |
| `getPrimaryCategory` | Function | `(url: string, contentSignals?) => CategoryResult\|null` |
| `isCategory` | Function | `(url: string, category: CategoryType, minConfidence?: number=0.5) => boolean` |

### src/content/confidenceScorer.ts

| Export | Kind | Signature |
|---|---|---|
| `ExtractionInputSchema` | ZodObject | title?, content?, author?, publishDate?, section?, wordCount? |
| `ExtractionInput` | Type | `{ title?: string; content?: string; author?: string; publishDate?: string; section?: string; wordCount?: number }` |
| `ConfidenceResultSchema` | ZodObject | score, level, factors, recommendation |
| `ConfidenceResult` | Type | `{ score: number; level: 'high'\|'good'\|'medium'\|'low'; factors: Record<string,number>; recommendation: string }` |
| `scoreTitleQuality` | Function | `(title?: string) => number` — 0-1 |
| `scoreLengthQuality` | Function | `(wordCount: number, config?: {minWordCount:100,idealWordCount:500,maxWordCount:10000}) => number` — 0-1 |
| `scoreMetadataCompleteness` | Function | `(extraction: ExtractionInput) => number` — 0-1, checks author/publishDate/section |
| `scoreToLevel` | Function | `(score: number) => 'high'\|'good'\|'medium'\|'low'` — >=0.8=high, >=0.6=good, >=0.3=medium, <0.3=low |
| `getRecommendation` | Function | `(score: number, factors: Record<string,number>) => string` |
| `scoreConfidence` | Function | `(extraction: ExtractionInput) => ConfidenceResult` — weights: title=0.3, length=0.5, metadata=0.2 |
| `scoreBatch` | Function | `(extractions: {id:string; extraction:ExtractionInput}[]) => {id:string; result:ConfidenceResult}[]` |
| `filterLowConfidence` | Function | `(scored: {id:string; result:ConfidenceResult}[], threshold?: number=0.4) => {id:string; result:ConfidenceResult}[]` — sorted by score ASC |

### src/geo/hubUrlPredictor.ts

| Export | Kind | Signature |
|---|---|---|
| `PlaceMetadataSchema` | ZodObject | name, code?, slug?, nameVariants?, region?, importance? |
| `PlaceMetadata` | Type | `{ name: string; code?: string; slug?: string; nameVariants?: string[]; region?: string; importance?: number }` |
| `UrlPatternSchema` | ZodObject | pattern, weight(default:1), isPrefix(default:false) |
| `UrlPattern` | Type | `{ pattern: string; weight: number; isPrefix: boolean }` |
| `DEFAULT_COUNTRY_PATTERNS` | `UrlPattern[]` | /location/{slug}:1.2, /world/{slug}:1.1, /news/{slug}:1.0, /{slug}:0.9, /topics/{slug}:0.8, /tag/{slug}:0.7, /region/{slug}:0.8, /international/{slug}:0.6 |
| `DEFAULT_CITY_PATTERNS` | `UrlPattern[]` | /local/{slug}:1.2, /city/{slug}:1.1, /news/{slug}:1.0, /{slug}:0.9, /metro/{slug}:0.8 |
| `toSlug` | Function | `(name: string) => string` — lowercase, NFD normalize, strip diacritics, strip non-alnum, spaces→hyphens |
| `generateNameVariants` | Function | `(place: PlaceMetadata) => string[]` — slugified name + code + slug + nameVariants |
| `predictHubUrls` | Function | `(domain: string, place: PlaceMetadata, patterns?: UrlPattern[]) => {url:string; weight:number}[]` — sorted weight DESC, deduped |
| `predictCountryHubUrls` | Function | `(domain: string, country: PlaceMetadata) => {url:string; weight:number}[]` |
| `predictCityHubUrls` | Function | `(domain: string, city: PlaceMetadata) => {url:string; weight:number}[]` |
| `extractPlaceSlugFromUrl` | Function | `(url: string, patterns?: UrlPattern[]) => string\|null` |
| `analyzeGaps` | Function | `(knownPlaces: PlaceMetadata[], allPlaces: PlaceMetadata[]) => {covered:PlaceMetadata[]; missing:PlaceMetadata[]; coveragePercent:number}` |

### src/summarization/textRank.ts

| Export | Kind | Signature |
|---|---|---|
| `TextRankOptionsSchema` | ZodObject | damping(0.85), maxIterations(100), convergence(0.0001), minSimilarity(0.1) |
| `TextRankOptions` | Type | `{ damping: number; maxIterations: number; convergence: number; minSimilarity: number }` |
| `RankedSentence` | Interface | `{ index: number; text: string; score: number }` |
| `TextRank` | Class | Constructor: `(options?: Partial<TextRankOptions>)`. Methods: `rank(sentences: string[]) => RankedSentence[]` (sorted score DESC), `summarize(sentences: string[], count?: number=3) => RankedSentence[]` (top N sorted by index ASC) |

Algorithm: PageRank on sentence similarity graph. Similarity: log-normalized token overlap. Depends on text/tokenize (stopword removal) and recommender/jaccardSimilarity (imported but uses custom similarity).

### src/tagging/tfIdf.ts

| Export | Kind | Signature |
|---|---|---|
| `Keyword` | Interface | `{ word: string; score: number }` |
| `DocumentFrequencyMap` | Type | `Map<string, number>` |
| `calculateTF` | Function | `(tokens: string[]) => Map<string, number>` — augmented TF: 0.5 + 0.5*(count/maxCount) |
| `calculateIDF` | Function | `(term: string, dfMap: DocumentFrequencyMap, totalDocs: number) => number` — log((N+1)/(df+1))+1 |
| `simpleStem` | Function | `(word: string) => string` — handles: sses→ss, ies→i, trailing s, eed→ee, ed, ing, y→i |
| `extractKeywords` | Function | `(text: string, dfMap: DocumentFrequencyMap, totalDocs: number, topN?: number=10) => Keyword[]` — tokenize(removeStopwords,minLength:3) → stem → TF*IDF → sort DESC |

### src/recommender/similarity.ts

| Export | Kind | Signature |
|---|---|---|
| `cosineSimilarity` | Function | `(vecA: number[], vecB: number[]) => number` — throws if lengths differ. Returns 0 for zero vectors. |
| `jaccardSimilarity` | Function | `<T>(a: T[]\|Set<T>, b: T[]\|Set<T>) => number` — returns 1.0 for both empty |
| `dotProduct` | Function | `(vecA: number[], vecB: number[]) => number` — throws if lengths differ |
| `euclideanDistance` | Function | `(vecA: number[], vecB: number[]) => number` — throws if lengths differ |
| `toSparseVector` | Function | `(tokens: string[], vocabulary: Map<string, number>) => number[]` — bag-of-words, length=vocabulary.size |

### src/planning/scorer.ts

| Export | Kind | Signature |
|---|---|---|
| `UrlSignalsSchema` | ZodObject | url(URL), visits(int>=0), lastVisited(Date\|string), lastChanged?(Date\|string), topicRelevance(0-1,def:0.5), hubDepth(int>=0,def:0), isHub(bool,def:false) |
| `UrlSignals` | Type | `{ url: string; visits: number; lastVisited: Date\|string; lastChanged?: Date\|string; topicRelevance: number; hubDepth: number; isHub: boolean }` |
| `ScoredUrlSchema` | ZodObject | url, score, reasons |
| `ScoredUrl` | Type | `{ url: string; score: number; reasons: string[] }` |
| `scoreUrlPriority` | Function | `(signals: UrlSignals) => ScoredUrl` — base 50, adjustments: <1h:-30, <24h:-10, >7d:+15, changed<24h:+20, relevance*15, hub:+10, depth>3:-5, clamp 0-100. Uses new Date() internally. |
| `rankUrlsForCrawling` | Function | `(urls: UrlSignals[]) => ScoredUrl[]` — sorted score DESC |

---

## INTERNAL DEPENDENCY GRAPH

```
text/tokenizer ← tagging/tfIdf (tokenize with stopwords)
text/tokenizer ← summarization/textRank (tokenize with stopwords)
recommender/similarity ← summarization/textRank (jaccardSimilarity imported)
clustering/similarity ← clustering/grouper (calculateHammingDistance)
types ← clustering/similarity (ArticleInput)
types ← clustering/grouper (ArticleInput)
```

All other modules: ZERO internal dependencies.

---

## ALGORITHM COMPLEXITY

| Function | Time | Space |
|---|---|---|
| `computeSimHash` | O(n) | O(1) — 64-element vector |
| `hammingDistance` | O(1) | O(1) — 64 bits |
| `groupArticlesBySimilarity` | O(n^2) | O(n) |
| `analyzeSentiment` | O(n) | O(1) |
| `detectTrends` | O(t * h) | O(t) — t=topics, h=history length |
| `detectAnomalies` | O(n) | O(n) |
| `evaluateTree` | O(d) | O(d) — d=tree depth |
| `TextRank.rank` | O(s^2 * i) | O(s^2) — s=sentences, i=iterations |
| `extractKeywords` | O(n) | O(n) |
| `cosineSimilarity` | O(d) | O(1) — d=vector dimension |
| `predictHubUrls` | O(p * v) | O(p * v) — p=patterns, v=variants |
| `scoreUrlPriority` | O(1) | O(1) |

---

## COMMON PATTERNS FOR AGENTS

### Pattern: Full Article Analysis Pipeline

```typescript
import {
    computeSimHash, analyzeSentiment, detectPageCategories,
    scoreConfidence, extractKeywords, splitSentences, TextRank
} from 'news-db-pure-analysis';

function analyzeArticle(text: string, url: string, dfMap: Map<string,number>, totalDocs: number) {
    return {
        simHash: computeSimHash(text),
        sentiment: analyzeSentiment(text),
        categories: detectPageCategories(url, { wordCount: text.split(/\s+/).length }),
        confidence: scoreConfidence({ title: text.split('\n')[0], content: text }),
        keywords: extractKeywords(text, dfMap, totalDocs, 10),
        summary: new TextRank().summarize(splitSentences(text), 3)
    };
}
```

### Pattern: Batch Deduplication

```typescript
import { computeSimHash, groupArticlesBySimilarity, ArticleInput } from 'news-db-pure-analysis';

function deduplicateBatch(articles: { id: string; text: string; headline: string; publishedAt: string; source: string }[]) {
    const inputs: ArticleInput[] = articles.map(a => ({
        id: a.id,
        headline: a.headline,
        simHash: computeSimHash(a.text),
        publishedAt: a.publishedAt,
        sourceDomain: a.source
    }));
    return groupArticlesBySimilarity(inputs, 3);
}
```

### Pattern: Trending Topics Dashboard

```typescript
import { detectTrends, filterTrending } from 'news-db-pure-analysis';

function getTrendingTopics(data: { topicId: string; counts: number[] }[]) {
    return filterTrending(detectTrends(data, { sigmaThreshold: 2.0, minBaseline: 5 }));
}
```

### Pattern: Crawl Queue Builder

```typescript
import { rankUrlsForCrawling, UrlSignals } from 'news-db-pure-analysis';

function nextCrawlBatch(urls: UrlSignals[], batchSize = 50) {
    return rankUrlsForCrawling(urls).slice(0, batchSize).map(r => r.url);
}
```

---

## CRITICAL CONSTRAINTS FOR AGENTS

1. **simHash must be pre-computed** before passing ArticleInput to clustering functions. Use `computeSimHash(text)` and store the result. The simHash field MUST be exactly 16 hex characters matching `/^[a-fA-F0-9]{16}$/`.

2. **dfMap for TF-IDF must be externally built** from your corpus. Keys must be stemmed using `simpleStem()`. This library cannot build dfMap because it has no IO.

3. **scoreUrlPriority uses wall-clock time** via `new Date()`. This is the ONLY function that reads external state. All others are fully deterministic.

4. **groupArticlesBySimilarity is O(n^2)**. For >5000 articles, partition by time window or source domain first.

5. **TextRank is O(s^2 * iterations)**. For documents with >100 sentences, consider pre-filtering or chunking.

6. **The sentiment lexicon has 54 words**. Extend via `getDefaultLexicon()` spread + custom entries for domain-specific analysis.

7. **simpleStem is approximate**. It handles common English suffixes but is not a full Porter stemmer. Stemmed forms may not match expected dictionary forms.

8. **All Zod schemas are exported** alongside their inferred TypeScript types. Use `.parse()` at system boundaries, use TypeScript types in internal code.

9. **Every function returns JSON-serializable output** except `wordFrequency` and `calculateTF` which return `Map` objects. Convert with `Object.fromEntries()` if needed.

10. **No function mutates its inputs.** All data transformations produce new objects/arrays.
