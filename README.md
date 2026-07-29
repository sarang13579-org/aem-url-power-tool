# AEM URL Power Tool

AEM URL Power Tool is a static browser-based utility for converting and previewing AEM URLs across multiple environments and brands. It supports both a single URL converter and a bulk launcher with history, environment selection, and copy functionality.

## Features

- Single URL conversion with output links for multiple AEM environments
- Bulk input support for mixed URLs and JCR paths
- Bulk "Open as Is" button for opening raw URL inputs directly
- Environment selection toggles for preview, author/editor, author/sites, prod-live, stage, publish, and CF#
- A dynamic bulk preview box that updates with the selected environment
- Copy buttons for converted links in both single and bulk views
- Batch history for bulk launches with copy-all support
- Lightweight static implementation using plain HTML, CSS, and JavaScript

## Getting Started

1. Open `index.html` in your browser.
2. Use the **Smart Single URL** tab to enter one URL or JCR path and see converted links for selected environments.
3. Use the **Bulk Launcher** tab to paste one URL/path per line and:
   - Open converted links by environment
   - Open raw URLs using the **Open as Is** button
   - Preview converted links for the selected environment
   - Copy preview results or history links

## File Structure

- `index.html` - Main UI markup and component layout.
- `css/main.css` - Styling for the page, tabs, buttons, preview panel, and history.
- `js/app.js` - App bootstrapper and tab switching logic.
- `js/components/SingleConverter.js` - Single URL conversion UI behavior and clipboard support.
- `js/components/BulkLauncher.js` - Bulk input handling, history, preview/copy panel, and environment toggle support.
- `js/core/converter.js` - URL normalization and environment link generation logic.
- `js/core/detector.js` - Brand and environment detection helper.
- `js/config/brands.js` - Brand definitions, environment endpoints, and console path prefixes.

## How It Works

### Single URL Mode

- Enter a URL or JCR path in the input field.
- The converter detects the brand and source environment.
- It generates cross-environment mappings for the selected environments.
- Each output row includes a clickable link and a copy button.

### Bulk Launcher Mode

- Paste mixed URLs and paths, one per line.
- Select which environments should be visible and available.
- Use the environment buttons to open all converted links in that target environment.
- Use **Open as Is** to open only valid raw URLs directly.
- The preview panel displays the current selected environment’s converted URL for each input line.
- Copy mode copies either the preview text and URLs or raw preview content as configured.
- History cards keep a record of launched batches and offer one-click copy for the full batch.

## Customizing Brands

Update `js/config/brands.js` to add or change brand configuration:

- `rootPath` — root JCR path for the brand
- `environments` — environment endpoints for preview, author/editor, author/sites, publish, stage, prod-live, and CF#

The converter will use these settings to build normalized URLs for each environment.

## Notes

- The tool is designed to run locally with no server required.
- If links do not open in bulk mode, verify browser popup settings.
- The `cf#` environment is handled using the `cf#` prefix mapping in `js/config/brands.js`.

## License

This project is a simple internal utility and can be adapted as needed for brand-specific AEM URL conversion workflows.
