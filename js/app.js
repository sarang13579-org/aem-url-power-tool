/**
 * GLOBAL COORDINATOR & BOOTSTRAPPER
 * Wires up sub-components, global configuration toggles, and UI framework tabs.
 * Does not use ES6 module imports to ensure compatibility with file:// protocols.
 */
document.addEventListener('DOMContentLoaded', () => {
    // Read class constructs from global scope
    const SingleConverter = window.SingleConverter;
    const BulkLauncher = window.BulkLauncher;
    const ConfigEditor = window.ConfigEditor;

    if (!SingleConverter || !BulkLauncher || !ConfigEditor) {
        console.error('Core components (SingleConverter, BulkLauncher, ConfigEditor) failed to load on the window namespace.');
        return;
    }

    // Instantiate component controllers
    const singleConverter = new SingleConverter();
    const bulkLauncher = new BulkLauncher();
    const configEditor = new ConfigEditor();

    // Handle interactive tabs
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.getAttribute('data-tab');
            if (targetTab) {
                // Remove active classes
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));

                // Add active classes to current tab and content
                button.classList.add('active');
                const targetContent = document.getElementById(`${targetTab}-tab`);
                if (targetContent) {
                    targetContent.classList.add('active');
                }

                // If switching back to single converter, trigger a conversion run automatically
                if (targetTab === 'single') {
                    singleConverter.triggerConversion();
                }
            }
        });
    });
});
