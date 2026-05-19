/**
 * City Hub Gap Analysis — Pure Functions
 *
 * Pure business logic for identifying city hub coverage gaps.
 * No I/O — takes data in, returns analysis results out.
 *
 * Used by:
 *  - news-db-analysis (CityHubGapService integration layer)
 *  - copilot-dl-news   (discover-city-hubs.js CLI tool)
 */

import { z } from 'zod';
import type { PlaceMetadata } from './hubUrlPredictor.js';
import { analyzeGaps, predictCityHubUrls, toSlug } from './hubUrlPredictor.js';

// --- Schemas ---

export const CountrySchema = z.object({
    code: z.string(),
    name: z.string(),
    population: z.number(),
});
export type Country = z.infer<typeof CountrySchema>;

export const CitySchema = z.object({
    id: z.number(),
    name: z.string(),
    population: z.number(),
    importance: z.number().optional(),
    countryCode: z.string().optional(),
    regionName: z.string().optional(),
});
export type City = z.infer<typeof CitySchema>;

export const CountryWithCitiesSchema = z.object({
    countryCode: z.string(),
    countryName: z.string(),
    countryPopulation: z.number(),
    cities: z.array(CitySchema),
});
export type CountryWithCities = z.infer<typeof CountryWithCitiesSchema>;

export interface CityHubGapOptions {
    /** Min country population to qualify (default: 500_000) */
    minPopulation?: number;
    /** Max cities to include per country (default: 5) */
    citiesPerCountry?: number;
}

// --- Pure Functions ---

/**
 * Filter countries to those qualifying for city hub discovery.
 * Excludes microstates (population < threshold).
 */
export function filterQualifyingCountries(
    countries: Country[],
    minPopulation: number = 500_000,
): Country[] {
    return countries
        .filter(c => c.population >= minPopulation)
        .sort((a, b) => b.population - a.population);
}

/**
 * Select top N cities for a country, ranked by population.
 */
export function selectTopCities(
    cities: City[],
    limit: number = 5,
): City[] {
    return [...cities]
        .sort((a, b) => b.population - a.population)
        .slice(0, limit);
}

/**
 * Build the full list of qualifying countries with their top cities.
 *
 * @param countries - All countries from gazetteer
 * @param citiesByCountry - Map of countryCode → City[] from gazetteer
 * @param options - Filtering options
 * @returns Array of CountryWithCities, one per qualifying country that has cities
 */
export function buildCityHubTargets(
    countries: Country[],
    citiesByCountry: Map<string, City[]>,
    options: CityHubGapOptions = {},
): CountryWithCities[] {
    const { minPopulation = 500_000, citiesPerCountry = 5 } = options;

    const qualifying = filterQualifyingCountries(countries, minPopulation);
    const results: CountryWithCities[] = [];

    for (const country of qualifying) {
        const allCities = citiesByCountry.get(country.code) ?? [];
        const topCities = selectTopCities(allCities, citiesPerCountry);

        if (topCities.length > 0) {
            results.push({
                countryCode: country.code,
                countryName: country.name,
                countryPopulation: country.population,
                cities: topCities,
            });
        }
    }

    return results;
}

/**
 * Convert City to PlaceMetadata for hub URL prediction.
 */
export function cityToPlaceMetadata(city: City): PlaceMetadata {
    return {
        name: city.name,
        code: city.countryCode,
        slug: toSlug(city.name),
        importance: city.importance ?? city.population,
    };
}

/**
 * Analyze city hub gaps for a domain.
 *
 * @param domain - Target domain
 * @param targetCities - Cities we want to find hubs for
 * @param knownCityHubs - Cities that already have verified hubs
 * @returns Gap analysis with predictions for missing cities
 */
export function analyzeCityHubGaps(
    domain: string,
    targetCities: City[],
    knownCityHubs: PlaceMetadata[],
): {
    covered: PlaceMetadata[];
    missing: PlaceMetadata[];
    coveragePercent: number;
    predictions: Array<{
        city: City;
        candidateUrls: Array<{ url: string; weight: number }>;
    }>;
} {
    const allPlaces = targetCities.map(cityToPlaceMetadata);
    const { covered, missing, coveragePercent } = analyzeGaps(knownCityHubs, allPlaces);

    // Generate URL predictions for missing cities
    const predictions = targetCities
        .filter(city => missing.some(m => toSlug(m.name) === toSlug(city.name)))
        .map(city => ({
            city,
            candidateUrls: predictCityHubUrls(domain, cityToPlaceMetadata(city)),
        }));

    return { covered, missing, coveragePercent, predictions };
}
