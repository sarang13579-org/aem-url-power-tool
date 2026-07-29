/**
 * SINGLE CONVERTER COMPONENT
 * Manages the DOM interaction for the "Smart Single URL" view.
 * Exposed globally to support offline file loading.
 */
class SingleConverter {
    constructor() {
        this.inputUrl = document.getElementById('inputUrl');
        this.wcmDisabled = document.getElementById('wcmDisabled');
        this.badgeContainer = document.getElementById('detectedSourceContainer');
        this.badge = document.getElementById('detectedBadge');
        this.outputs = {
            'preview': document.getElementById('out-preview'),
            'prod-live': document.getElementById('out-prod-live'),
            'stage': document.getElementById('out-stage'),
            'author-editor': document.getElementById('out-author-editor'),
            'author-sites': document.getElementById('out-author-sites'),
            'publish': document.getElementById('out-publish'),
            'cf#': document.getElementById('out-cf#')
        };
        this.outputRows = Object.keys(this.outputs).reduce((rows, env) => {
            const targetEl = this.outputs[env];
            rows[env] = targetEl ? targetEl.closest('.mapping-row') : null;
            return rows;
        }, {});
        this.environmentToggles = Array.from(document.querySelectorAll('.env-toggle[data-scope="single"]'));

        this.init();
    }

    init() {
        if (this.inputUrl) {
            this.inputUrl.addEventListener('input', () => this.triggerConversion());
        }
        if (this.wcmDisabled) {
            this.wcmDisabled.addEventListener('change', () => this.triggerConversion());
        }
        this.environmentToggles.forEach(toggle => {
            toggle.addEventListener('change', () => this.triggerConversion());
        });
    }

    getSelectedEnvironments() {
        return this.environmentToggles.reduce((selected, toggle) => {
            if (toggle.dataset.env) {
                selected[toggle.dataset.env] = toggle.checked;
            }
            return selected;
        }, {});
    }

    triggerConversion() {
        if (!window.autoConvertUrl) return;

        const inputVal = this.inputUrl.value.trim();
        const isWcmCheck = this.wcmDisabled ? this.wcmDisabled.checked : false;
        const selectedEnvironments = this.getSelectedEnvironments();

        const result = window.autoConvertUrl(inputVal, isWcmCheck);

        if (result) {
            this.showBadge(result.detectedBrand, result.detectedSource);
            this.updateOutputGrid(result.urls, selectedEnvironments);
        } else {
            this.hideBadge();
            this.clearOutputGrid();
        }
    }

    showBadge(brand, source) {
        if (!this.badgeContainer || !this.badge) return;
        
        this.badgeContainer.style.display = 'inline-flex';
        this.badge.innerText = `${brand.toUpperCase()} ➔ ${source.toUpperCase()}`;
        
        // Dynamic color styling for the brand badge
        if (brand === 'brand1') {
            this.badge.className = 'detected-badge brand1-badge';
        } else if (brand === 'brand2') {
            this.badge.className = 'detected-badge brand2-badge';
        } else {
            this.badge.className = 'detected-badge';
        }
        
        // Trigger a tiny animation reflow
        this.badgeContainer.classList.remove('fade-in-up');
        void this.badgeContainer.offsetWidth; // Force reflow
        this.badgeContainer.classList.add('fade-in-up');
    }

    hideBadge() {
        if (!this.badgeContainer) return;
        this.badgeContainer.style.display = 'none';
    }

    updateOutputGrid(urls, selectedEnvironments = {}) {
        Object.keys(this.outputs).forEach(env => {
            const targetEl = this.outputs[env];
            const targetRow = this.outputRows[env];
            const isSelected = selectedEnvironments[env] !== false;

            if (!targetEl || !targetRow) return;

            if (!isSelected) {
                targetRow.style.display = 'none';
                targetEl.innerHTML = '';
                return;
            }

            targetRow.style.display = 'contents';
            const targetUrl = urls[env];
            if (targetUrl && targetUrl !== '#') {
                targetEl.innerHTML = `
                    <div class="url-output-row">
                        <a href="${targetUrl}" target="_blank" class="nav-link" title="${targetUrl}">${targetUrl}</a>
                        <button class="icon-btn copy-btn" data-url="${targetUrl}" title="Copy link">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                        </button>
                    </div>
                `;
            } else {
                targetEl.innerText = '-';
            }
        });

        // Add event listeners to newly created copy buttons
        const copyBtns = document.querySelectorAll('.copy-btn');
        copyBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const url = btn.getAttribute('data-url');
                this.copyToClipboard(url, btn);
            });
        });
    }

    clearOutputGrid() {
        Object.keys(this.outputs).forEach(env => {
            const targetEl = this.outputs[env];
            const targetRow = this.outputRows[env];
            if (targetEl) {
                targetEl.innerText = '-';
            }
            if (targetRow) {
                targetRow.style.display = 'none';
            }
        });
    }

    async copyToClipboard(text, buttonElement) {
        try {
            await navigator.clipboard.writeText(text);
            const originalIcon = buttonElement.innerHTML;
            buttonElement.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            `;
            buttonElement.classList.add('copied');
            setTimeout(() => {
                buttonElement.innerHTML = originalIcon;
                buttonElement.classList.remove('copied');
            }, 1500);
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
    }
}

// Expose globally
window.SingleConverter = SingleConverter;
