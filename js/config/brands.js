/**
 * MULTI-BRAND CONFIGURATION
 * Domains and JCR roots mapped cleanly per-brand tenant.
 * Exposed globally to support file:// protocols without CORS restrictions.
 */
window.BRAND_CONFIGS = {
    'brand1': {
        'rootPath': '/content/brand1/',
        'environments': {
            'preview':       'https://author-brand1-p1234.adobeaemcloud.com',
            'author-editor': 'https://author-brand1-p1234.adobeaemcloud.com',
            'author-sites':  'https://author-brand1-p1234.adobeaemcloud.com',
            'publish':       'https://publish-brand1-p1234.adobeaemcloud.com',
            'stage':         'https://stage.brand1.com',
            'prod-live':     'https://www.brand1.com',
            'cf#':           'https://author-brand1-p1234.adobeaemcloud.com'
        }
    },
    'brand2': {
        'rootPath': '/content/brand2/',
        'environments': {
            'preview':       'https://author-brand2-p1234.adobeaemcloud.com',
            'author-editor': 'https://author-brand2-p1234.adobeaemcloud.com',
            'author-sites':  'https://author-brand2-p1234.adobeaemcloud.com',
            'publish':       'https://publish-brand2-p1234.adobeaemcloud.com',
            'stage':         'https://stage.brand2.com',
            'prod-live':     'https://www.brand2.com',
            'cf#':           'https://author-brand2-p1234.adobeaemcloud.com'
        }
    },
    'brand3': {
        'rootPath': '/content/brand3/',
        'environments': {
            'preview':       'https://author-brand3-p1234.adobeaemcloud.com',
            'author-editor': 'https://author-brand3-p1234.adobeaemcloud.com',
            'author-sites':  'https://author-brand3-p1234.adobeaemcloud.com',
            'publish':       'https://publish-brand3-p1234.adobeaemcloud.com',
            'stage':         'https://stage.brand3.com',
            'prod-live':     'https://www.brand3.com',
            'cf#':           'https://author-brand3-p1234.adobeaemcloud.com'
        }
    }
};

window.DEFAULT_BRAND_CONFIGS = JSON.parse(JSON.stringify(window.BRAND_CONFIGS));
window.BRAND_CONFIG_STORAGE_KEY = 'AEM_URL_TOOL_BRAND_CONFIGS';

window.saveBrandConfigToStorage = function(config) {
    try {
        window.localStorage.setItem(window.BRAND_CONFIG_STORAGE_KEY, JSON.stringify(config));
        return true;
    } catch (error) {
        console.error('Unable to save brand configuration to localStorage.', error);
        return false;
    }
};

window.loadBrandConfigFromStorage = function() {
    const saved = window.localStorage.getItem(window.BRAND_CONFIG_STORAGE_KEY);
    if (!saved) return;

    try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
            window.BRAND_CONFIGS = parsed;
        }
    } catch (error) {
        console.warn('Failed to parse saved brand config, using default configuration.', error);
    }
};

window.resetBrandConfigsToDefault = function() {
    window.BRAND_CONFIGS = JSON.parse(JSON.stringify(window.DEFAULT_BRAND_CONFIGS));
    window.saveBrandConfigToStorage(window.BRAND_CONFIGS);
};

window.loadBrandConfigFromStorage();

/**
 * Shared console UI states across AEM environments
 */
window.AEM_CONSOLE_PREFIXES = {
    'preview':'',
    'author-editor': '/editor.html',
    'author-sites': '/sites.html',
    'publish': '',
    'stage': '',
    'prod-live': '',
    'cf#': '/cf#'
};
