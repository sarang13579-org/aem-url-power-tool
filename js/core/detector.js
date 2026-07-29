/**
 * DYNAMIC MATCHING ENGINE
 * Maps inputs back to their brand ownership profiles and source environment.
 * Exposed globally to support offline file loading.
 * 
 * @param {string} cleanInput - Trimmed user URL or JCR path
 * @returns {Object|null} { brand, env } or null if invalid URL
 */
window.detectBrandAndEnv = function(cleanInput) {
    const BRAND_CONFIGS = window.BRAND_CONFIGS;
    if (!BRAND_CONFIGS) return null;

    if (cleanInput.startsWith('/')) {
        let cleanPath = cleanInput.replace('/editor.html', '').replace('/sites.html', '');
        for (const [brandName, config] of Object.entries(BRAND_CONFIGS)) {
            if (cleanPath.startsWith(config.rootPath)) {
                if (cleanInput.startsWith('/editor.html')) return { brand: brandName, env: 'author-editor' };
                if (cleanInput.startsWith('/sites.html')) return { brand: brandName, env: 'author-sites' };
                return { brand: brandName, env: 'jcr-path' };
            }
        }
        // Default to first brand if starting with '/' but not matching specific roots
        return { brand: Object.keys(BRAND_CONFIGS)[0], env: 'jcr-path' }; 
    }

    try {
        const parsed = new URL(cleanInput);
        const origin = parsed.origin;

        for (const [brandName, config] of Object.entries(BRAND_CONFIGS)) {
            for (const [envName, domainUrl] of Object.entries(config.environments)) {
                if (origin === domainUrl) {
                    if (envName.startsWith('author')) {
                        if (parsed.pathname.startsWith('/editor.html')) return { brand: brandName, env: 'author-editor' };
                        if (parsed.pathname.startsWith('/sites.html')) return { brand: brandName, env: 'author-sites' };
                    }
                    return { brand: brandName, env: envName };
                }
            }
        }
    } catch (e) {
        return null;
    }
    return null;
};
