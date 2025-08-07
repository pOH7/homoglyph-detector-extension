# 🔍 Homoglyph Detector Chrome Extension

A Chrome extension that detects Unicode lookalike characters (homoglyphs) in web page content to help protect against phishing attacks and visual deception.

## What are Homoglyphs?

Homoglyphs are characters that look visually identical or very similar but have different Unicode code points. For example:

- Latin "a" (U+0061) vs Cyrillic "а" (U+0430) 
- Latin "s" (U+0073) vs Cyrillic "ѕ" (U+0455)
- Latin "master" vs "maѕter" (with Cyrillic ѕ)

These can be used in:
- Phishing domain names (e.g., аpple.com instead of apple.com)
- Deceptive text content
- Social engineering attacks

## Features

- 🔍 **Real-time Detection**: Automatically scans web pages for suspicious Unicode characters
- 🎯 **Visual Highlighting**: Highlights suspicious characters with yellow background and red underline
- 📊 **Detailed Analysis**: Shows Unicode code points, script origins, and character information
- 🚨 **Badge Notifications**: Displays count of suspicious characters in extension badge
- ⚙️ **Easy Controls**: Enable/disable detection and manual scanning
- 🧪 **Test Examples**: Built-in test page with common homoglyph examples

## Installation

### From Source (Development)

1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension folder
5. The extension icon should appear in your toolbar

### Usage

1. **Automatic Scanning**: The extension automatically scans pages when loaded
2. **Manual Control**: Click the extension icon to open the popup
3. **Toggle Detection**: Use the switch in the popup to enable/disable scanning
4. **View Results**: Suspicious characters are highlighted in yellow with red underlines
5. **Get Details**: Hover over highlighted characters to see detailed information
6. **Badge Counter**: The extension badge shows the number of suspicious characters found

## File Structure

```
homoglyph-detector-extension/
├── 📁 Extension Files
│   ├── manifest.json              # Extension manifest (Manifest V3)
│   ├── homoglyph-detector.js      # Core detection library
│   ├── content.js                 # Content script for page scanning
│   ├── background.js              # Background service worker
│   ├── popup.html                 # Extension popup interface
│   ├── popup.js                   # Popup functionality
│   ├── styles.css                 # Highlighting styles
│   ├── icon16.png                 # Extension icons (16x16, 48x48, 128x128)
│   ├── icon48.png
│   ├── icon128.png
│   └── create-icons.html          # Icon generation utility
│
├── 📁 Documentation (GitHub Pages)
│   ├── docs/
│   │   ├── index.html             # Project homepage
│   │   ├── test.html              # Interactive test page
│   │   └── about.html             # Detailed documentation
│
├── 📁 CI/CD & Configuration
│   ├── .github/workflows/ci.yml   # GitHub Actions pipeline
│   ├── .gitignore                 # Git ignore patterns
│   ├── CLAUDE.md                  # Claude Code guidance
│   └── README.md                  # This file
```

## Technical Details

### Detection Capabilities

The extension detects:

- **Cyrillic Lookalikes**: а, с, е, о, р, ѕ, etc.
- **Greek Lookalikes**: α, ε, ο, ρ, etc.  
- **Mathematical Unicode**: 𝐀, 𝟏, 𝟐, 𝟑, etc.
- **Mixed Script Usage**: Text containing multiple Unicode scripts
- **Unusual Unicode Blocks**: Characters from suspicious Unicode ranges

### Performance

- Efficient scanning with debounced updates
- Minimal impact on page loading performance
- Uses mutation observers for dynamic content
- Optimized text node traversal

### Privacy

- All processing happens locally in your browser
- No data is sent to external servers
- Settings stored locally using Chrome storage API
- No tracking or analytics

## Examples

The extension will highlight these suspicious characters:

| Normal | Suspicious | Script | Unicode |
|--------|------------|--------|---------|
| master | ma**ѕ**ter | Cyrillic ѕ | U+0455 |
| apple | **А**pple | Cyrillic А | U+0410 |
| google | g**о**gle | Cyrillic о | U+043E |
| paypal | **р**aypal | Cyrillic р | U+0440 |

## Testing

1. Click the extension icon
2. Click "Test on Example Page" to open the [GitHub Pages test page](https://poh7.github.io/homoglyph-detector-extension/test.html) with various homoglyphs
3. Enable detection and click "Scan Current Page"
4. Observe the highlighted suspicious characters

**Live Demo Pages:**
- 🏠 [Project Homepage](https://poh7.github.io/homoglyph-detector-extension/) - Overview and features
- 🧪 [Test Page](https://poh7.github.io/homoglyph-detector-extension/test.html) - Try the detector
- 📖 [About Page](https://poh7.github.io/homoglyph-detector-extension/about.html) - Detailed documentation

## Development

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/pOH7/homoglyph-detector-extension.git
   cd homoglyph-detector-extension
   ```

2. **Load in Chrome**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the project folder

3. **Development Workflow**
   - Make changes to the extension files
   - Click the reload button in `chrome://extensions/` to update
   - Test using the [test page](https://poh7.github.io/homoglyph-detector-extension/test.html)

### Building & CI/CD

- **No build process required** - This is a vanilla JavaScript extension
- **GitHub Actions** automatically:
  - Validates code on every push/PR
  - Runs security scans
  - Deploys documentation to GitHub Pages
  - Creates release packages when tagged

### Testing

1. **Manual Testing**
   - Load the extension in developer mode
   - Open the [test page](https://poh7.github.io/homoglyph-detector-extension/test.html) via popup or directly
   - Enable detection and click "Scan Current Page"
   - Check console for debugging information

2. **Automated Testing**
   - GitHub Actions runs validation on every commit
   - Includes manifest validation, JavaScript syntax checking, and security scans

### Contributing

Contributions welcome! Areas for improvement:

- Additional Unicode script detection
- Better performance optimization
- Enhanced UI/UX
- More comprehensive homoglyph database
- Whitelist/blacklist functionality

## Browser Compatibility

- Chrome 88+ (Manifest V3)
- Chromium-based browsers (Edge, Brave, etc.)

## License

Open source - feel free to modify and distribute.

## Security Note

This extension is designed to help detect potential security threats, but it should not be your only line of defense. Always verify suspicious content through multiple means and keep your security practices up to date.