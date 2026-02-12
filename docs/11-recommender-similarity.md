# Chapter 11: Recommender & Similarity Metrics

The `recommender` module (`src/recommender/`) provides pure mathematical functions for computing similarity and distance between vectors and sets. These are building blocks for recommendation systems, clustering, and deduplication.

```
11-fig-similarity-metrics.svg
```

<p align="center">
<img src="11-fig-similarity-metrics.svg" alt="Similarity metrics visual comparison" />
</p>

## Exports

| Export | Kind | Description |
|---|---|---|
| `cosineSimilarity` | Function | Cosine similarity between two vectors |
| `jaccardSimilarity` | Function | Jaccard similarity between two sets |
| `dotProduct` | Function | Dot product of two vectors |
| `euclideanDistance` | Function | Euclidean distance between two vectors |
| `toSparseVector` | Function | Convert tokens to bag-of-words vector |

## cosineSimilarity(vecA, vecB)

Measures the cosine of the angle between two vectors. Ranges from 0 (orthogonal) to 1 (identical direction) for non-negative vectors.

```
11-fig-cosine.svg
```

<p align="center">
<img src="11-fig-cosine.svg" alt="Cosine similarity illustration" />
</p>

**Formula:** `cos(A, B) = (A . B) / (||A|| * ||B||)`

```typescript
import { cosineSimilarity } from 'news-db-pure-analysis';

cosineSimilarity([1, 0, 1], [1, 0, 1]);  // 1.0 (identical)
cosineSimilarity([1, 0, 0], [0, 1, 0]);  // 0.0 (orthogonal)
cosineSimilarity([1, 1, 0], [1, 0, 1]);  // 0.5

// Zero vectors
cosineSimilarity([0, 0, 0], [1, 2, 3]);  // 0.0
```

| Parameter | Type | Description |
|---|---|---|
| `vecA` | `number[]` | First vector |
| `vecB` | `number[]` | Second vector (must be same length) |
| **Returns** | `number` | Similarity score (0.0 to 1.0 for non-negative vectors) |
| **Throws** | `Error` | If vectors have different lengths |

**Use for:** Comparing TF-IDF vectors, document similarity, recommendation scoring. Cosine similarity is **magnitude-independent** — it cares about direction, not length. This makes it ideal for comparing documents of different lengths.

## jaccardSimilarity(a, b)

Measures the overlap between two sets as a proportion of their union.

**Formula:** `J(A, B) = |A intersect B| / |A union B|`

```typescript
import { jaccardSimilarity } from 'news-db-pure-analysis';

// With arrays (treated as sets)
jaccardSimilarity(['cat', 'dog', 'bird'], ['cat', 'dog', 'fish']);
// 0.5  (2 shared out of 4 unique)

// With Sets
jaccardSimilarity(new Set([1, 2, 3]), new Set([2, 3, 4]));
// 0.5

// Identical sets
jaccardSimilarity(['a', 'b'], ['a', 'b']);
// 1.0

// Disjoint sets
jaccardSimilarity(['a', 'b'], ['c', 'd']);
// 0.0

// Both empty
jaccardSimilarity([], []);
// 1.0
```

| Parameter | Type | Description |
|---|---|---|
| `a` | `T[] \| Set<T>` | First set |
| `b` | `T[] \| Set<T>` | Second set |
| **Returns** | `number` | Similarity score (0.0 to 1.0) |

**Use for:** Comparing keyword sets, tag overlap, topic similarity. Jaccard is best when you care about **set membership** rather than frequency/magnitude.

## dotProduct(vecA, vecB)

Computes the sum of element-wise products.

**Formula:** `A . B = sum(A[i] * B[i])`

```typescript
import { dotProduct } from 'news-db-pure-analysis';

dotProduct([1, 2, 3], [4, 5, 6]);  // 1*4 + 2*5 + 3*6 = 32
dotProduct([1, 0, 0], [0, 1, 0]);  // 0
```

| Parameter | Type | Description |
|---|---|---|
| `vecA` | `number[]` | First vector |
| `vecB` | `number[]` | Second vector (must be same length) |
| **Returns** | `number` | Dot product |
| **Throws** | `Error` | If vectors have different lengths |

## euclideanDistance(vecA, vecB)

Computes the straight-line distance between two points in n-dimensional space.

**Formula:** `d(A, B) = sqrt(sum((A[i] - B[i])^2))`

```typescript
import { euclideanDistance } from 'news-db-pure-analysis';

euclideanDistance([0, 0], [3, 4]);    // 5.0
euclideanDistance([1, 2, 3], [1, 2, 3]); // 0.0
euclideanDistance([0, 0, 0], [1, 1, 1]); // 1.732...
```

| Parameter | Type | Description |
|---|---|---|
| `vecA` | `number[]` | First vector |
| `vecB` | `number[]` | Second vector (must be same length) |
| **Returns** | `number` | Distance (>= 0) |
| **Throws** | `Error` | If vectors have different lengths |

**Note:** Unlike similarity metrics, distance is inversely related to similarity. Lower distance = more similar.

## toSparseVector(tokens, vocabulary)

Converts an array of tokens into a bag-of-words vector using a vocabulary index.

```typescript
import { toSparseVector } from 'news-db-pure-analysis';

const vocabulary = new Map([
    ['cat', 0],
    ['dog', 1],
    ['bird', 2],
    ['fish', 3]
]);

toSparseVector(['cat', 'dog', 'cat'], vocabulary);
// [2, 1, 0, 0]  — cat appears twice, dog once

toSparseVector(['fish', 'fish', 'bird'], vocabulary);
// [0, 0, 1, 2]

toSparseVector(['unknown'], vocabulary);
// [0, 0, 0, 0]  — unknown tokens are ignored
```

| Parameter | Type | Description |
|---|---|---|
| `tokens` | `string[]` | Array of word tokens |
| `vocabulary` | `Map<string, number>` | Map of word to vector index |
| **Returns** | `number[]` | Sparse vector of length `vocabulary.size` |

### Building a Vocabulary

```typescript
function buildVocabulary(allTokens: string[][]): Map<string, number> {
    const vocab = new Map<string, number>();
    for (const tokens of allTokens) {
        for (const token of tokens) {
            if (!vocab.has(token)) {
                vocab.set(token, vocab.size);
            }
        }
    }
    return vocab;
}
```

## Choosing the Right Metric

| Metric | Best For | Properties |
|---|---|---|
| **Cosine Similarity** | Document comparison, TF-IDF vectors | Magnitude-independent, [0, 1] for non-negative |
| **Jaccard Similarity** | Keyword/tag overlap, set comparison | Works on sets, [0, 1] |
| **Dot Product** | Raw correlation, weighted sums | Magnitude-dependent, unbounded |
| **Euclidean Distance** | Spatial proximity, clustering | Magnitude-dependent, [0, inf) |

## Usage Pattern: Article Recommendation

```typescript
import { tokenize, toSparseVector, cosineSimilarity } from 'news-db-pure-analysis';

function findSimilarArticles(
    target: string,
    candidates: { id: string; text: string }[],
    topN = 5
) {
    // Build vocabulary from all documents
    const allTokens = [target, ...candidates.map(c => c.text)]
        .map(t => tokenize(t, { removeStopwords: true }));

    const vocab = new Map<string, number>();
    for (const tokens of allTokens) {
        for (const token of tokens) {
            if (!vocab.has(token)) vocab.set(token, vocab.size);
        }
    }

    const targetVec = toSparseVector(allTokens[0], vocab);

    return candidates
        .map((c, i) => ({
            id: c.id,
            similarity: cosineSimilarity(targetVec, toSparseVector(allTokens[i + 1], vocab))
        }))
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, topN);
}
```
