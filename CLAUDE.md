# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Chrome Extension (Manifest V3) that detects Unicode homoglyphs - visually similar characters from different scripts (e.g., Cyrillic 'а' vs Latin 'a') that can be used in phishing attacks. The extension is built with vanilla JavaScript and requires no build process.

## Development Commands

Since this is a vanilla JavaScript Chrome extension, there are no npm scripts or build commands. Development workflow:

1. **Load Extension**: Open Chrome → `chrome://extensions/` → Enable "Developer mode" → Click "Load unpacked" → Select project folder
2. **Reload Extension**: After making changes, click the reload button in `chrome://extensions/`
3. **Debug**: Use Chrome DevTools to inspect popup, content scripts, and background worker
4. **Test**: Use the built-in test page via the extension popup → "Test on Example Page"

## Architecture

The extension consists of four main components that work together:

### Core Detection Engine (`homoglyph-detector.js`)
- **HomoglyphDetector class**: Core library for character analysis
- Contains homoglyph mapping for Latin → Cyrillic/Greek lookalikes
- Provides character script detection and Unicode block analysis
- Key methods: `detectHomoglyphs()`, `analyzeCharacter()`, `analyzeScripts()`

### Content Script (`content.js`)
- **HomoglyphScanner class**: Manages page scanning and highlighting
- Uses MutationObserver for dynamic content monitoring
- Implements debounced scanning (500ms delay) for performance
- Creates visual highlights with tooltips showing Unicode details
- Communicates with background script for badge updates

### Background Service Worker (`background.js`)
- **BackgroundController class**: Manages badge notifications and tab state
- Updates extension badge with count of suspicious characters
- Clears badges on page navigation
- Handles inter-component messaging

### Popup Interface (`popup.js` + `popup.html`)
- **PopupController class**: Extension popup controls and settings
- Toggle detection on/off (stored in Chrome sync storage)
- Manual scan and clear functions
- Built-in test page generator with homoglyph examples
- Real-time stats display

## Key Features

- **Real-time Detection**: Automatic scanning on page load and content changes
- **Visual Highlighting**: Yellow background + red underline for suspicious characters
- **Unicode Analysis**: Detailed character information (code point, script, lookalikes)
- **Performance Optimized**: Debounced scanning, efficient DOM traversal
- **Privacy-First**: All processing local, no external data transmission

## Extension Permissions

- `activeTab`: Access current page content for scanning
- `storage`: Save user preferences (enable/disable state)
- Runs on `<all_urls>` to detect homoglyphs across the web

## Testing

The extension includes built-in test capabilities:
1. Click extension icon → "Test on Example Page" 
2. Generated test page contains common homoglyph examples
3. Use manual "Scan Current Page" to verify detection
4. Check console logs for scanning performance metrics

## Common Modification Patterns

When extending the detector:
- Add new homoglyph mappings to `buildHomoglyphMap()` in `homoglyph-detector.js`
- Modify Unicode script detection in `getScript()` method
- Update highlighting styles in `styles.css`
- Extend popup functionality in `popup.js` with corresponding HTML changes