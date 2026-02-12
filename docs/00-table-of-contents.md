# news-db-pure-analysis

## The Complete Guide

> Pure Functional Business Logic for News Platform Intelligence

This documentation covers every module, every exported function, every type, and every algorithm in the `news-db-pure-analysis` library. It is organized as a sequential book — start at Chapter 1 and read through, or jump to any chapter independently.

---

### Chapters

| # | Chapter | What You'll Learn |
|---|---|---|
| **01** | [Introduction & Architecture](01-introduction.md) | What this library is, design principles, module overview, installation |
| **02** | [Input Data Contracts](02-data-contracts.md) | Every input type, output type, and Zod schema with examples |
| **03** | [Text Processing](03-text-processing.md) | Tokenization, stopwords, n-grams, word frequency, language detection |
| **04** | [SimHash & Clustering](04-simhash-clustering.md) | 64-bit fingerprinting, Hamming distance, article deduplication and grouping |
| **05** | [Sentiment Analysis](05-sentiment-analysis.md) | Lexicon-based scoring, negation, amplifiers, custom lexicons |
| **06** | [Classification Engine](06-classification.md) | JSON decision trees, condition types, audit trails, explainability |
| **07** | [Content Analysis](07-content-analysis.md) | Page category detection, extraction quality/confidence scoring |
| **08** | [Trends & Anomaly Detection](08-trends-anomalies.md) | Z-score trending, statistical anomaly detection in time series |
| **09** | [Summarization & Tagging](09-summarization-tagging.md) | TextRank extractive summarization, TF-IDF keyword extraction |
| **10** | [Geo & URL Intelligence](10-geo-url-intelligence.md) | Hub URL prediction, place slug generation, coverage gap analysis |
| **11** | [Recommender & Similarity](11-recommender-similarity.md) | Cosine, Jaccard, Euclidean, dot product, bag-of-words vectorization |
| **12** | [Crawl Planning](12-crawl-planning.md) | URL priority scoring, crawl queue ranking |
| **13** | [Agent Reference](13-agent-reference.md) | Dense, machine-optimized reference with every export, type, and algorithm |

---

### SVG Illustrations

Each chapter includes inline SVG diagrams. They are stored alongside the chapter files with the naming convention `XX-fig-description.svg` where `XX` matches the chapter number.

| File | Chapter | Description |
|---|---|---|
| `01-fig-design-principles.svg` | 01 | Four core design principles |
| `01-fig-architecture.svg` | 01 | Module architecture overview |
| `01-fig-dependencies.svg` | 01 | Internal dependency graph |
| `02-fig-core-types.svg` | 02 | Core type relationships |
| `03-fig-text-pipeline.svg` | 03 | Text processing pipeline |
| `04-fig-simhash-overview.svg` | 04 | SimHash comparison overview |
| `04-fig-simhash-algorithm.svg` | 04 | SimHash algorithm steps |
| `05-fig-sentiment-pipeline.svg` | 05 | Sentiment analysis pipeline |
| `06-fig-decision-tree.svg` | 06 | Decision tree evaluation flow |
| `06-fig-condition-types.svg` | 06 | Condition type overview |
| `07-fig-content-overview.svg` | 07 | Content analysis overview |
| `07-fig-confidence-scoring.svg` | 07 | Confidence scoring breakdown |
| `08-fig-zscore-overview.svg` | 08 | Z-score distribution overview |
| `08-fig-trend-detection.svg` | 08 | Trend detection flow |
| `09-fig-textrank.svg` | 09 | TextRank algorithm flow |
| `09-fig-tfidf.svg` | 09 | TF-IDF keyword extraction flow |
| `10-fig-geo-overview.svg` | 10 | Geo URL prediction overview |
| `11-fig-similarity-metrics.svg` | 11 | Similarity metrics comparison |
| `11-fig-cosine.svg` | 11 | Cosine similarity illustration |
| `12-fig-planning-overview.svg` | 12 | URL priority scoring overview |
| `12-fig-scoring-factors.svg` | 12 | Scoring factor breakdown |

---

### Quick Start

```typescript
import {
    computeSimHash,
    analyzeSentiment,
    detectTrends,
    scoreConfidence,
    TextRank,
    splitSentences
} from 'news-db-pure-analysis';

// Fingerprint an article for deduplication
const hash = computeSimHash('The president signed the new trade bill today');

// Analyze sentiment
const sentiment = analyzeSentiment('The economy is showing excellent growth');

// Score extraction quality
const confidence = scoreConfidence({
    title: 'Major Policy Shift',
    content: 'The government announced...',
    author: 'Jane Smith',
    publishDate: '2024-06-15'
});

// Summarize an article
const ranker = new TextRank();
const summary = ranker.summarize(splitSentences(articleText), 3);
```

---

### Key Characteristics

- **Zero IO** — No network, filesystem, or database access. All data is passed in as function arguments.
- **Pure Functions** — Deterministic, no side effects, no hidden state.
- **TypeScript** — Full type definitions with Zod runtime validation schemas.
- **Dual Format** — ESM and CommonJS builds with TypeScript declarations.
- **Two Dependencies** — Only `zod` and `date-fns` at runtime.
