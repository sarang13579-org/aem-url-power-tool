/**
 * BULK LAUNCHER COMPONENT
 * Manages bulk input field operations, batch tab launching, and logs history.
 * Exposed globally to support offline file loading.
 */
class BulkLauncher {
    constructor() {
        this.bulkUrls = document.getElementById('bulkUrls');
        this.wcmDisabled = document.getElementById('wcmDisabled');
        this.bulkOutputArea = document.getElementById('bulkOutputArea');
        this.btnGroup = document.querySelector('#bulk-tab .btn-group');
        this.environmentToggles = Array.from(document.querySelectorAll('.env-toggle[data-scope="bulk"]'));
        this.bulkPreviewBox = document.getElementById('bulkPreviewBox');
        this.bulkPreviewStatus = document.getElementById('bulkPreviewStatus');
        this.bulkPreviewToggles = Array.from(document.querySelectorAll('.bulk-preview-toggle'));
        this.bulkPreviewMode = 'preview';

        this.init();
    }

    init() {
        if (this.btnGroup) {
            this.btnGroup.addEventListener('click', (e) => {
                const targetBtn = e.target.closest('.bulk-open-btn');
                if (!targetBtn) return;

                const action = targetBtn.getAttribute('data-action');
                if (action === 'as-is') {
                    this.handleOpenAsIs();
                    return;
                }

                const targetEnv = targetBtn.getAttribute('data-env');
                if (targetEnv) {
                    this.handleBulk(targetEnv);
                }
            });
        }

        this.environmentToggles.forEach(toggle => {
            toggle.addEventListener('change', () => {
                this.refreshEnvironmentButtons();
                this.renderPreviewBox();
            });
        });

        if (this.bulkPreviewToggles.length) {
            this.bulkPreviewToggles.forEach(toggle => {
                toggle.addEventListener('click', () => this.setPreviewMode(toggle.getAttribute('data-mode')));
            });
        }

        if (this.bulkUrls) {
            this.bulkUrls.addEventListener('input', () => this.renderPreviewBox());
        }

        this.refreshEnvironmentButtons();
        this.renderPreviewBox();
    }

    getSelectedEnvironments() {
        return this.environmentToggles.reduce((selected, toggle) => {
            if (toggle.dataset.env) {
                selected[toggle.dataset.env] = toggle.checked;
            }
            return selected;
        }, {});
    }

    refreshEnvironmentButtons() {
        const selectedEnvironments = this.getSelectedEnvironments();
        if (!this.btnGroup) return;

        this.btnGroup.querySelectorAll('.bulk-open-btn').forEach(btn => {
            const env = btn.getAttribute('data-env');
            if (!env) {
                btn.style.display = '';
                return;
            }
            btn.style.display = selectedEnvironments[env] ? '' : 'none';
        });
    }

    setPreviewMode(mode) {
        this.bulkPreviewMode = mode === 'copy' ? 'copy' : 'preview';
        this.bulkPreviewToggles.forEach(toggle => {
            toggle.classList.toggle('active', toggle.getAttribute('data-mode') === this.bulkPreviewMode);
        });

        if (this.bulkPreviewMode === 'copy') {
            this.copyPreviewContent();
        } else {
            this.renderPreviewBox();
        }
    }

    getActivePreviewEnvironment() {
        const selectedEnvironments = this.getSelectedEnvironments();
        const preferredOrder = ['preview', 'author-editor', 'author-sites', 'prod-live', 'stage', 'publish', 'cf#'];

        for (const env of preferredOrder) {
            if (selectedEnvironments[env]) {
                return env;
            }
        }

        return 'preview';
    }

    buildPreviewEntries() {
        if (!this.bulkUrls || !window.autoConvertUrl) return [];

        const lines = this.bulkUrls.value.split('\n');
        const isWcmCheck = this.wcmDisabled ? this.wcmDisabled.checked : false;
        const activeEnv = this.getActivePreviewEnvironment();
        const entries = [];

        lines.forEach(line => {
            const clearedLine = line.trim();
            if (!clearedLine) return;

            let previewUrl = '';
            const conversionData = window.autoConvertUrl(clearedLine, isWcmCheck);
            if (conversionData && conversionData.urls && conversionData.urls[activeEnv] && conversionData.urls[activeEnv] !== '#') {
                previewUrl = conversionData.urls[activeEnv];
            }

            entries.push({ text: clearedLine, previewUrl, environment: activeEnv });
        });

        return entries;
    }

    renderPreviewBox() {
        if (!this.bulkPreviewBox) return;

        const entries = this.buildPreviewEntries();
        if (!entries.length) {
            this.bulkPreviewBox.innerHTML = '<div class="bulk-preview-entry"><div class="bulk-preview-text">No content to preview.</div></div>';
            if (this.bulkPreviewStatus) {
                this.bulkPreviewStatus.textContent = 'Preview shows each line with its converted preview URL.';
            }
            return;
        }

        this.bulkPreviewBox.innerHTML = entries.map(entry => `
            <div class="bulk-preview-entry">
                <div class="bulk-preview-text">${entry.text}</div>
                <div class="bulk-preview-url">
                    ${entry.previewUrl ? `<a href="${entry.previewUrl}" target="_blank" class="nav-link">${entry.previewUrl}</a>` : '—'}
                </div>
            </div>
        `).join('');

        if (this.bulkPreviewStatus) {
            const activeEnv = this.getActivePreviewEnvironment();
            this.bulkPreviewStatus.textContent = this.bulkPreviewMode === 'copy'
                ? `Copied the current text and ${activeEnv} URLs to the clipboard.`
                : `Preview shows each line with its converted ${activeEnv} URL.`;
        }
    }

    async copyPreviewContent() {
        const entries = this.buildPreviewEntries();
        const textToCopy = entries.map(entry => {
            const isUrlLike = (() => {
                try {
                    const parsed = new URL(entry.text);
                    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
                } catch (e) {
                    return false;
                }
            })();

            if (isUrlLike) {
                return entry.previewUrl || '';
            }

            return entry.previewUrl ? `${entry.text}\t${entry.previewUrl}` : entry.text;
        }).filter(Boolean).join('\n');

        if (!textToCopy) {
            if (this.bulkPreviewStatus) {
                this.bulkPreviewStatus.textContent = 'No content to copy.';
            }
            return;
        }

        try {
            await navigator.clipboard.writeText(textToCopy);
            if (this.bulkPreviewStatus) {
                this.bulkPreviewStatus.textContent = 'Copied text and preview URLs to the clipboard.';
            }
            this.renderPreviewBox();
        } catch (err) {
            console.error('Failed to copy preview content:', err);
            if (this.bulkPreviewStatus) {
                this.bulkPreviewStatus.textContent = 'Unable to copy preview content.';
            }
        }
    }

    handleOpenAsIs() {
        if (!this.bulkUrls) return;

        const lines = this.bulkUrls.value.split('\n');
        const urlsToOpen = [];

        lines.forEach(line => {
            const clearedLine = line.trim();
            if (!clearedLine) return;

            try {
                const parsed = new URL(clearedLine);
                if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
                    urlsToOpen.push(parsed.toString());
                }
            } catch (e) {
                // Ignore non-URL lines such as JCR paths or plain text.
            }
        });

        if (urlsToOpen.length > 0) {
            urlsToOpen.forEach(url => {
                window.open(url, '_blank');
            });
            this.updateHistory(this.buildAsIsHistoryHtml(urlsToOpen), urlsToOpen.length, 'AS-IS', urlsToOpen);
        } else {
            alert('No valid URLs found to open as is.');
        }
    }

    buildAsIsHistoryHtml(urlsToOpen) {
        return urlsToOpen.map(url => `
            <div class="batch-link-item">
                <span class="badge-env">AS-IS</span>
                <a href="${url}" target="_blank" class="nav-link text-truncate">${url}</a>
            </div>
        `).join('');
    }

    handleBulk(targetEnv) {
        if (!this.bulkUrls || !window.autoConvertUrl) return;

        const lines = this.bulkUrls.value.split('\n');
        const isWcmCheck = this.wcmDisabled ? this.wcmDisabled.checked : false;
        let processedCount = 0;
        let generatedLinksHtml = '';
        const urlsToOpen = [];

        lines.forEach(line => {
            const clearedLine = line.trim();
            if (clearedLine) {
                const conversionData = window.autoConvertUrl(clearedLine, isWcmCheck);
                if (conversionData && conversionData.urls[targetEnv]) {
                    const generatedUrl = conversionData.urls[targetEnv];
                    if (generatedUrl !== '#') {
                        urlsToOpen.push(generatedUrl);
                        generatedLinksHtml += `
                            <div class="batch-link-item">
                                <span class="badge-env">${targetEnv.toUpperCase()}</span>
                                <a href="${generatedUrl}" target="_blank" class="nav-link text-truncate">${generatedUrl}</a>
                                <button class="icon-btn copy-batch-btn" type="button" data-url="${generatedUrl}" title="Copy link">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                                </button>
                            </div>
                        `;
                        processedCount++;
                    }
                }
            }
        });

        if (processedCount > 0) {
            // Trigger tab launching
            urlsToOpen.forEach(url => {
                window.open(url, '_blank');
            });

            // Write to batch history
            this.updateHistory(generatedLinksHtml, processedCount, targetEnv, urlsToOpen);
        } else {
            alert('No valid target URLs matching configurations were found to launch.');
        }
    }

    updateHistory(linksHtml, count, env, urlsToOpen = []) {
        if (!this.bulkOutputArea) return;

        const timestamp = new Date().toLocaleTimeString();
        const historyCard = document.createElement('div');
        historyCard.className = 'history-batch-card fade-in-up';
        historyCard.dataset.batchUrls = urlsToOpen.join('\n');
        
        historyCard.innerHTML = `
            <div class="batch-header">
                <div>
                    <span class="batch-title">Batch: ${count} links to ${env.toUpperCase()}</span>
                    <span class="batch-time">${timestamp}</span>
                </div>
                <button class="icon-btn copy-batch-all-btn" type="button" title="Copy all URLs">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                </button>
            </div>
            <div class="batch-links-list">
                ${linksHtml}
            </div>
        `;

        // Clear default text if first entry
        if (this.bulkOutputArea.innerText.includes('No batch operations launched yet.')) {
            this.bulkOutputArea.innerHTML = '';
        }

        // Insert at top of the history list
        this.bulkOutputArea.insertBefore(historyCard, this.bulkOutputArea.firstChild);
        this.bindCopyButtons(historyCard);
    }

    bindCopyButtons(container) {
        const copyBtns = container.querySelectorAll('.copy-batch-btn');
        copyBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.copyToClipboard(btn.getAttribute('data-url'), btn);
            });
        });

        const copyAllBtn = container.querySelector('.copy-batch-all-btn');
        if (copyAllBtn) {
            copyAllBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.copyToClipboard(container.dataset.batchUrls || '', copyAllBtn);
            });
        }
    }

    async copyToClipboard(text, buttonElement) {
        if (!text || !buttonElement) return;

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
            console.error('Failed to copy batch URL: ', err);
        }
    }
}

// Expose globally
window.BulkLauncher = BulkLauncher;
