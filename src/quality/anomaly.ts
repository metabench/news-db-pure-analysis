import { z } from 'zod';

// --- Input Schema ---
export const TimeSeriesPointSchema = z.object({
    date: z.string().or(z.date()),
    value: z.number()
});

export type TimeSeriesPoint = z.infer<typeof TimeSeriesPointSchema>;

// --- Output Schema ---
export const AnomalySchema = z.object({
    date: z.string(),
    value: z.number(),
    zScore: z.number(),
    isAnomaly: z.boolean(),
    direction: z.enum(['above', 'below', 'normal'])
});

export type Anomaly = z.infer<typeof AnomalySchema>;

export interface AnomalyReport {
    anomalies: Anomaly[];
    mean: number;
    stdDev: number;
    threshold: number;
}

/**
 * Detects statistical anomalies in a time series using z-score method.
 * 
 * @param points - Array of time series data points
 * @param config - Configuration with sigma threshold (default: 2)
 * @returns Anomaly report with detected outliers
 */
export function detectAnomalies(
    points: TimeSeriesPoint[],
    config: { sigma?: number } = {}
): AnomalyReport {
    const sigma = config.sigma ?? 2;

    if (points.length < 2) {
        return { anomalies: [], mean: 0, stdDev: 0, threshold: sigma };
    }

    // Calculate mean
    const values = points.map(p => p.value);
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;

    // Calculate standard deviation
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    const variance = squaredDiffs.reduce((sum, v) => sum + v, 0) / values.length;
    const stdDev = Math.sqrt(variance);

    // Detect anomalies
    const anomalies: Anomaly[] = points.map(point => {
        const zScore = stdDev === 0 ? 0 : (point.value - mean) / stdDev;
        const isAnomaly = Math.abs(zScore) > sigma;

        let direction: 'above' | 'below' | 'normal' = 'normal';
        if (isAnomaly) {
            direction = zScore > 0 ? 'above' : 'below';
        }

        return {
            date: typeof point.date === 'string' ? point.date : point.date.toISOString(),
            value: point.value,
            zScore: Math.round(zScore * 100) / 100,
            isAnomaly,
            direction
        };
    });

    return {
        anomalies,
        mean: Math.round(mean * 100) / 100,
        stdDev: Math.round(stdDev * 100) / 100,
        threshold: sigma
    };
}

/**
 * Detects if a new value would be an anomaly given historical data.
 * 
 * @param historicalValues - Past values
 * @param newValue - Incoming value to check
 * @param sigma - Z-score threshold
 */
export function isValueAnomalous(
    historicalValues: number[],
    newValue: number,
    sigma: number = 2
): boolean {
    if (historicalValues.length < 2) return false;

    const mean = historicalValues.reduce((a, b) => a + b, 0) / historicalValues.length;
    const variance = historicalValues.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / historicalValues.length;
    const stdDev = Math.sqrt(variance);

    if (stdDev === 0) return newValue !== mean;

    const zScore = Math.abs((newValue - mean) / stdDev);
    return zScore > sigma;
}
