/**
 * CORE TRANSLATION ENGINE
 * Normalizes JCR structures and computes cross-domain routes for different environments.
 * Exposed globally to support offline file loading.
 * 
 * @param {string} rawInput - The input string (URL or path)
 * @param {boolean} isWcmCheck - If true, include wcmmode=disabled on Author Editor targets
 * @returns {Object|null} Map of targets or null
 */
window.autoConvertUrl = function(rawInput, isWcmCheck = true) {
    const BRAND_CONFIGS = window.BRAND_CONFIGS;
    const AEM_CONSOLE_PREFIXES = window.AEM_CONSOLE_PREFIXES;
    const detectBrandAndEnv = window.detectBrandAndEnv;

    if (!BRAND_CONFIGS || !AEM_CONSOLE_PREFIXES || !detectBrandAndEnv) return null;

    let cleanInput = rawInput.trim();
    if (!cleanInput) return null;

    const sourceContext = detectBrandAndEnv(cleanInput);
    if (!sourceContext) return null;

    const currentBrand = BRAND_CONFIGS[sourceContext.brand];
    let pureJcrPath = '';

    if (sourceContext.env === 'jcr-path') {
        pureJcrPath = cleanInput;
    } else {
        try {
            const parsed = new URL(cleanInput);
            let pathWithParams = parsed.pathname + parsed.search + parsed.hash;
            pathWithParams = pathWithParams.replace('/editor.html', '').replace('/sites.html', '').replace('/cf#', '');
            pureJcrPath = pathWithParams;
        } catch (e) {
            // Fallback if URL parsing failed but it was categorized as a URL
            pureJcrPath = cleanInput;
        }
    }

    // Standardize short proxy routes to full content roots internally, avoiding overlapping directories
    if (!pureJcrPath.startsWith('/content')) {
        pureJcrPath = joinPathsWithOverlap(currentBrand.rootPath, pureJcrPath);
    }

    const outputVersions = {};

    // Generate matching profiles for every tracked destination environment matrix
    Object.keys(AEM_CONSOLE_PREFIXES).forEach(env => {
        const targetDomain = currentBrand.environments[env];
        const targetConsolePrefix = AEM_CONSOLE_PREFIXES[env];
        let targetPath = pureJcrPath;

        if (env === 'author-sites') {
            targetPath = targetPath.replace(/\.html$/, '');
        }

        if (env === 'author-editor') {
            targetPath = targetPath.replace(/\.html$/, '');
        }

        targetPath = targetConsolePrefix + targetPath;

        // Strip the brand JCR root prefix (e.g., /content/pepsi) on vanity/live configurations to preserve language folder (e.g., /en)
        if (env === 'prod-live' || env === 'stage') {
            const brandJcrRoot = currentBrand.rootPath.substring(0, currentBrand.rootPath.lastIndexOf('/'));
            if (targetPath.startsWith(brandJcrRoot)) {
                targetPath = targetPath.substring(brandJcrRoot.length);
            }
        }

        try {
            let finalUrlObj = new URL(targetPath, targetDomain);

            if (env === 'author-editor' && isWcmCheck) {
                finalUrlObj.searchParams.set('wcmmode', 'disabled');
            } else if (env === 'preview' && isWcmCheck) {
                finalUrlObj.searchParams.set('wcmmode', 'disabled');
            }
             else {
                finalUrlObj.searchParams.delete('wcmmode');
            }

            outputVersions[env] = finalUrlObj.toString();
        } catch (e) {
            outputVersions[env] = '#';
        }
    });

    return {
        detectedBrand: sourceContext.brand,
        detectedSource: sourceContext.env,
        urls: outputVersions
    };
};

/**
 * Helper to join a root JCR path and a relative/absolute path,
 * resolving any overlapping subdirectories (e.g. locale segments like /en).
 */
function joinPathsWithOverlap(rootPath, subPath) {
    const root = rootPath.replace(/\/+$/, '');
    const sub = subPath.replace(/^\/+/, '');
    
    const rootSegments = root.split('/');
    const subSegments = sub.split('/');
    
    let overlapCount = 0;
    const maxOverlap = Math.min(rootSegments.length, subSegments.length);
    
    for (let i = 1; i <= maxOverlap; i++) {
        const rootTail = rootSegments.slice(-i).join('/');
        const subHead = subSegments.slice(0, i).join('/');
        if (rootTail === subHead) {
            overlapCount = i;
        }
    }
    
    if (overlapCount > 0) {
        const remainingSub = subSegments.slice(overlapCount).join('/');
        return root + (remainingSub ? '/' + remainingSub : '');
    }
    
    return root + '/' + sub;
}
