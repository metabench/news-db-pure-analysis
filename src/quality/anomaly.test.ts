import { describe, it, expect } from 'vitest';
import { detectAnomalies, isValueAnomalous } from './anomaly.js';

describe('Anomaly Detection', () => {
    it('returns empty for insufficient data', () => {
        const result = detectAnomalies([{ date: '2026-01-01', value: 10 }]);
        expect(result.anomalies).toEqual([]);
    });

    it('detects outliers beyond 2 sigma', () => {
        // With 6 values of 10 and 1 value of 100, mean ≈ 22.9, but 100 is still far out
        const points = [
            { date: '2026-01-01', value: 10 },
            { date: '2026-01-02', value: 10 },
            { date: '2026-01-03', value: 10 },
            { date: '2026-01-04', value: 10 },
            { date: '2026-01-05', value: 10 },
            { date: '2026-01-06', value: 10 },
            { date: '2026-01-07', value: 100 }, // Outlier
        ];

        const report = detectAnomalies(points, { sigma: 2 });
        const outliers = report.anomalies.filter(a => a.isAnomaly);

        expect(outliers.length).toBeGreaterThan(0);
        expect(outliers.some(a => a.value === 100)).toBe(true);
    });

    it('isValueAnomalous checks single value', () => {
        const history = [10, 12, 11, 10, 11];
        expect(isValueAnomalous(history, 11)).toBe(false);
        expect(isValueAnomalous(history, 100)).toBe(true);
    });
});
