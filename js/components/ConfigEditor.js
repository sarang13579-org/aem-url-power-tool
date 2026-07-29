/**
 * CONFIG EDITOR COMPONENT
 * Provides runtime editing of BRAND_CONFIGS, localStorage persistence, and import/export.
 */
class ConfigEditor {
    constructor() {
        this.brandSelect = document.getElementById('brandSelect');
        this.brandKeyInput = document.getElementById('brandKeyInput');
        this.brandRootInput = document.getElementById('brandRootInput');
        this.envConfigGrid = document.getElementById('envConfigGrid');
        this.configJsonArea = document.getElementById('configJsonArea');

        this.addBrandBtn = document.getElementById('addBrandBtn');
        this.saveConfigBtn = document.getElementById('saveConfigBtn');
        this.resetConfigBtn = document.getElementById('resetConfigBtn');
        this.exportConfigBtn = document.getElementById('exportConfigBtn');
        this.importConfigBtn = document.getElementById('importConfigBtn');
        this.deleteBrandBtn = document.getElementById('deleteBrandBtn');

        this.currentBrandKey = null;
        this.environmentKeys = ['preview', 'author-editor', 'author-sites', 'publish', 'stage', 'prod-live', 'cf#'];
        this.init();
    }

    init() {
        if (!window.BRAND_CONFIGS || !window.AEM_CONSOLE_PREFIXES) {
            console.error('Missing config globals for ConfigEditor.');
            return;
        }

        if (this.addBrandBtn) this.addBrandBtn.addEventListener('click', () => this.addBrand());
        if (this.saveConfigBtn) this.saveConfigBtn.addEventListener('click', () => this.saveCurrentBrand());
        if (this.resetConfigBtn) this.resetConfigBtn.addEventListener('click', () => this.resetConfig());
        if (this.exportConfigBtn) this.exportConfigBtn.addEventListener('click', () => this.exportConfig());
        if (this.importConfigBtn) this.importConfigBtn.addEventListener('click', () => this.importConfig());
        if (this.brandSelect) this.brandSelect.addEventListener('change', () => this.handleBrandSelection());
        if (this.deleteBrandBtn) this.deleteBrandBtn.addEventListener('click', () => this.deleteBrand());

        this.loadBrandOptions();
        this.handleBrandSelection();
    }

    loadBrandOptions() {
        if (!this.brandSelect) return;
        const current = this.brandSelect.value;
        this.brandSelect.innerHTML = '';

        Object.keys(window.BRAND_CONFIGS).forEach(key => {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = key;
            this.brandSelect.appendChild(option);
        });

        if (current && window.BRAND_CONFIGS[current]) {
            this.brandSelect.value = current;
        }

        if (!this.brandSelect.value) {
            const first = this.brandSelect.querySelector('option');
            if (first) this.brandSelect.value = first.value;
        }

        this.currentBrandKey = this.brandSelect.value;
    }

    handleBrandSelection() {
        this.currentBrandKey = this.brandSelect.value;
        this.renderBrandForm();
    }

    renderBrandForm() {
        if (!this.currentBrandKey) return;
        const config = window.BRAND_CONFIGS[this.currentBrandKey];
        if (!config) return;

        if (this.brandKeyInput) this.brandKeyInput.value = this.currentBrandKey;
        if (this.brandRootInput) this.brandRootInput.value = config.rootPath || '';

        if (!this.envConfigGrid) return;
        this.envConfigGrid.innerHTML = '';

        this.environmentKeys.forEach(env => {
            const value = config.environments[env] || '';
            const row = document.createElement('div');
            row.className = 'form-group env-row';
            row.innerHTML = `
                <label for="env-${env}">${env} endpoint</label>
                <input type="text" id="env-${env}" data-env="${env}" value="${value}" placeholder="https://..." />
            `;
            this.envConfigGrid.appendChild(row);
        });
    }

    addBrand() {
        const brandKey = `brand${Object.keys(window.BRAND_CONFIGS).length + 1}`;
        if (window.BRAND_CONFIGS[brandKey]) {
            alert('Generated brand key already exists, refresh if necessary.');
            return;
        }

        window.BRAND_CONFIGS[brandKey] = {
            rootPath: '/content/new-brand/',
            environments: this.environmentKeys.reduce((acc, env) => {
                acc[env] = '';
                return acc;
            }, {})
        };

        this.loadBrandOptions();
        this.saveConfigToStorage();
        this.renderBrandForm();
    }

    saveCurrentBrand() {
        if (!this.currentBrandKey) return;

        const newKey = this.brandKeyInput.value.trim();
        if (!newKey) {
            alert('Brand key cannot be empty.');
            return;
        }

        const rootPath = this.brandRootInput.value.trim();
        if (!rootPath) {
            alert('JCR root path cannot be empty.');
            return;
        }

        const config = window.BRAND_CONFIGS[this.currentBrandKey];
        if (!config) return;

        const environments = {};
        this.environmentKeys.forEach(env => {
            const input = document.querySelector(`#env-${env}`);
            if (input) {
                environments[env] = input.value.trim();
            }
        });

        config.rootPath = rootPath;
        config.environments = environments;

        if (newKey !== this.currentBrandKey) {
            const existing = window.BRAND_CONFIGS[newKey];
            if (existing) {
                alert('Brand key already exists. Choose a different brand key.');
                return;
            }
            window.BRAND_CONFIGS[newKey] = config;
            delete window.BRAND_CONFIGS[this.currentBrandKey];
            this.currentBrandKey = newKey;
        }

        this.loadBrandOptions();
        this.brandSelect.value = this.currentBrandKey;
        this.saveConfigToStorage();
        this.renderBrandForm();
        alert('Brand configuration saved.');
    }

    deleteBrand() {
        if (!this.currentBrandKey) return;
        if (Object.keys(window.BRAND_CONFIGS).length <= 1) {
            alert('At least one brand configuration must remain.');
            return;
        }

        if (!confirm(`Delete brand '${this.currentBrandKey}'? This cannot be undone.`)) {
            return;
        }

        delete window.BRAND_CONFIGS[this.currentBrandKey];
        this.loadBrandOptions();
        this.saveConfigToStorage();
        this.renderBrandForm();
    }

    resetConfig() {
        if (!confirm('Reset configuration to default values? This will overwrite current saved settings.')) return;
        window.resetBrandConfigsToDefault();
        this.loadBrandOptions();
        this.renderBrandForm();
        alert('Configuration reset to defaults.');
    }

    exportConfig() {
        if (!this.configJsonArea) return;
        this.configJsonArea.value = JSON.stringify(window.BRAND_CONFIGS, null, 2);
        alert('Configuration JSON generated below. Copy it to save externally.');
    }

    importConfig() {
        if (!this.configJsonArea) return;
        const value = this.configJsonArea.value.trim();
        if (!value) {
            alert('Paste a valid JSON config before importing.');
            return;
        }

        try {
            const parsed = JSON.parse(value);
            if (!parsed || typeof parsed !== 'object') {
                throw new Error('Invalid configuration format.');
            }
            window.BRAND_CONFIGS = parsed;
            this.saveConfigToStorage();
            this.loadBrandOptions();
            this.renderBrandForm();
            alert('Configuration imported successfully.');
        } catch (error) {
            console.error('Failed to import config JSON.', error);
            alert('Invalid JSON configuration. Check the syntax and try again.');
        }
    }

    saveConfigToStorage() {
        if (window.saveBrandConfigToStorage) {
            window.saveBrandConfigToStorage(window.BRAND_CONFIGS);
        }
    }
}

window.ConfigEditor = ConfigEditor;
