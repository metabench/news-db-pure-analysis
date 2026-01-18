import { z } from 'zod';

// --- Shared Core Types ---

export const DateRangeSchema = z.object({
    startDate: z.string().or(z.date()),
    endDate: z.string().or(z.date())
});

export type DateRange = z.infer<typeof DateRangeSchema>;

// --- Clustering Types ---

export const ArticleInputSchema = z.object({
    id: z.string(),
    content: z.string().optional(),
    headline: z.string(),
    simHash: z.string().regex(/^[a-fA-F0-9]{16}$/), // 64-bit hex
    publishedAt: z.string().or(z.date()),
    sourceDomain: z.string()
});

export type ArticleInput = z.infer<typeof ArticleInputSchema>;

export const ClusterSchema = z.object({
    id: z.string(),
    memberIds: z.array(z.string()),
    centerSimHash: z.string(),
    createdAt: z.date()
});

export type Cluster = z.infer<typeof ClusterSchema>;
