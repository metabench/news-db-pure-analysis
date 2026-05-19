/**
 * Home Country Detection — Detect the origin country of a news domain
 * 
 * Pure functions for:
 * - Detecting home country from TLD (e.g. .co.uk → GB, .com.au → AU)
 * - Generating compound section candidates (e.g. /uk-news, /australia-news)
 * - Country alias lookups (e.g. GB → ['uk', 'britain', 'england'])
 * 
 * These are used by the hub discovery system to probe special top-level
 * sections that news websites use for their home country and other
 * major countries they cover heavily.
 */

// Country code TLD → ISO 3166-1 alpha-2 mapping
// News websites based in a country often use special top-level paths for that country
export const TLD_TO_COUNTRY: Record<string, string> = {
    'uk': 'GB', 'co.uk': 'GB',
    'au': 'AU', 'com.au': 'AU',
    'nz': 'NZ', 'co.nz': 'NZ',
    'ca': 'CA',
    'ie': 'IE',
    'za': 'ZA', 'co.za': 'ZA',
    'in': 'IN', 'co.in': 'IN',
    'fr': 'FR',
    'de': 'DE',
    'es': 'ES',
    'it': 'IT',
    'jp': 'JP', 'co.jp': 'JP',
    'br': 'BR', 'com.br': 'BR',
    'mx': 'MX', 'com.mx': 'MX',
    'ng': 'NG', 'com.ng': 'NG',
    'ke': 'KE', 'co.ke': 'KE',
    'sg': 'SG', 'com.sg': 'SG',
    'ph': 'PH', 'com.ph': 'PH',
    'pk': 'PK', 'com.pk': 'PK',
    'ar': 'AR', 'com.ar': 'AR',
    'cl': 'CL',
    'co': 'CO', 'com.co': 'CO',
    'nl': 'NL',
    'be': 'BE',
    'ch': 'CH',
    'at': 'AT',
    'se': 'SE',
    'no': 'NO',
    'dk': 'DK',
    'fi': 'FI',
    'pt': 'PT',
    'pl': 'PL',
    'ru': 'RU',
    'kr': 'KR', 'co.kr': 'KR',
    'cn': 'CN', 'com.cn': 'CN',
    'tw': 'TW', 'com.tw': 'TW',
    'il': 'IL', 'co.il': 'IL',
    'ae': 'AE',
    'sa': 'SA', 'com.sa': 'SA',
    'eg': 'EG', 'com.eg': 'EG',
    'gh': 'GH', 'com.gh': 'GH'
};

// Country code → common short aliases used by news sites in their URL paths
export const COUNTRY_ALIASES: Record<string, string[]> = {
    'GB': ['uk', 'britain', 'england'],
    'US': ['us', 'usa', 'america'],
    'AU': ['au', 'australia'],
    'NZ': ['nz', 'new-zealand'],
    'CA': ['ca', 'canada'],
    'IE': ['ie', 'ireland'],
    'ZA': ['za', 'south-africa'],
    'IN': ['in', 'india'],
    'FR': ['fr', 'france'],
    'DE': ['de', 'germany'],
    'ES': ['es', 'spain'],
    'IT': ['it', 'italy'],
    'JP': ['jp', 'japan'],
    'BR': ['br', 'brazil'],
    'NG': ['ng', 'nigeria'],
    'KE': ['ke', 'kenya']
};

// Major countries that news websites commonly give special top-level sections
export const MAJOR_SECTION_COUNTRIES = [
    { code: 'US', aliases: ['us', 'america'] },
    { code: 'AU', aliases: ['australia'] },
    { code: 'GB', aliases: ['uk', 'britain'] },
    { code: 'CA', aliases: ['canada'] },
    { code: 'IN', aliases: ['india'] },
    { code: 'NZ', aliases: ['new-zealand'] },
    { code: 'ZA', aliases: ['south-africa'] },
    { code: 'IE', aliases: ['ireland'] }
];

// Common suffixes used in compound country sections
export const COMPOUND_SUFFIXES = ['-news', '-politics', '-sport', '-opinion', '-business'];

/**
 * Detect the home country of a news domain from its TLD.
 * @param domain - e.g. 'www.theguardian.com', 'www.smh.com.au', 'www.bbc.co.uk'
 * @returns ISO 3166-1 alpha-2 country code or null for generic TLDs (.com, .org, .net)
 */
export function detectHomeCountry(domain: string): string | null {
    const parts = domain.toLowerCase().split('.');
    // Try compound TLD first (e.g. 'co.uk', 'com.au')
    if (parts.length >= 3) {
        const compoundTld = parts.slice(-2).join('.');
        if (TLD_TO_COUNTRY[compoundTld]) return TLD_TO_COUNTRY[compoundTld];
    }
    // Try simple TLD
    const tld = parts[parts.length - 1];
    return TLD_TO_COUNTRY[tld] || null;
}

/**
 * Generate compound section URL candidates for probing.
 * 
 * For the home country (if detected from TLD), generates:
 *   /{alias}, /{alias}-news, /{alias}-politics, /{alias}-sport, etc.
 * 
 * For other major countries, generates:
 *   /{alias}-news, /{alias}
 * 
 * This handles the common pattern where news websites give their home country
 * and other key markets special top-level sections rather than burying them
 * under /world/{slug}.
 * 
 * @param domain - The domain being probed (used for TLD detection)
 * @returns Array of URL paths to probe, e.g. ['/uk', '/uk-news', '/us-news', '/australia-news']
 */
export function generateCompoundSectionCandidates(domain: string): {
    paths: string[];
    homeCountryCode: string | null;
} {
    const homeCountryCode = detectHomeCountry(domain);
    const candidates: string[] = [];

    // If we detected a home country from TLD, probe special paths for it
    if (homeCountryCode) {
        const aliases = COUNTRY_ALIASES[homeCountryCode] || [homeCountryCode.toLowerCase()];
        for (const alias of aliases) {
            candidates.push(`/${alias}`);
            for (const suffix of COMPOUND_SUFFIXES) {
                candidates.push(`/${alias}${suffix}`);
            }
        }
    }

    // Always probe compound news sections for major countries
    // (e.g. The Guardian uses /australia-news, /us-news, /uk-news even on .com)
    for (const country of MAJOR_SECTION_COUNTRIES) {
        if (country.code === homeCountryCode) continue;
        for (const alias of country.aliases) {
            candidates.push(`/${alias}-news`);
            candidates.push(`/${alias}`);
        }
    }

    // Deduplicate while preserving order
    const unique = [...new Set(candidates)];

    return { paths: unique, homeCountryCode };
}
