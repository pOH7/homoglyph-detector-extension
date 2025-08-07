class PopupController {
  constructor() {
    this.enabled = true;
    this.stats = {};
    
    this.init();
  }

  async init() {
    // Load settings
    await this.loadSettings();
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Update UI
    this.updateUI();
    
    // Load stats
    this.loadStats();
  }

  async loadSettings() {
    try {
      const result = await chrome.storage.sync.get(['enabled']);
      this.enabled = result.enabled !== false; // Default to true
    } catch (error) {
      console.log('Could not load settings, using defaults');
      this.enabled = true;
    }
  }

  async saveSettings() {
    try {
      await chrome.storage.sync.set({ enabled: this.enabled });
    } catch (error) {
      console.error('Could not save settings:', error);
    }
  }

  setupEventListeners() {
    // Enable/disable toggle
    const enableToggle = document.getElementById('enableToggle');
    enableToggle.addEventListener('change', async (e) => {
      this.enabled = e.target.checked;
      await this.saveSettings();
      this.updateUI();
    });

    // Scan button
    document.getElementById('scanButton').addEventListener('click', async () => {
      await this.scanCurrentTab();
    });

    // Clear button
    document.getElementById('clearButton').addEventListener('click', async () => {
      await this.clearHighlights();
    });

    // Test button
    document.getElementById('testButton').addEventListener('click', () => {
      this.openTestPage();
    });

    // About link
    document.getElementById('aboutLink').addEventListener('click', (e) => {
      e.preventDefault();
      this.showAbout();
    });
  }

  updateUI() {
    // Update toggle
    document.getElementById('enableToggle').checked = this.enabled;

    // Update status
    const statusElement = document.getElementById('status');
    const statusText = document.getElementById('status-text');
    
    if (this.enabled) {
      statusElement.className = 'status enabled';
      statusText.textContent = 'Detection Enabled';
    } else {
      statusElement.className = 'status disabled';
      statusText.textContent = 'Detection Disabled';
    }

    // Enable/disable buttons based on status
    const scanButton = document.getElementById('scanButton');
    const clearButton = document.getElementById('clearButton');
    
    scanButton.disabled = !this.enabled;
    clearButton.disabled = !this.enabled;

    if (!this.enabled) {
      scanButton.style.opacity = '0.6';
      clearButton.style.opacity = '0.6';
    } else {
      scanButton.style.opacity = '1';
      clearButton.style.opacity = '1';
    }
  }

  async loadStats() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      chrome.tabs.sendMessage(tab.id, { action: 'getStats' }, (response) => {
        if (chrome.runtime.lastError) {
          // Content script might not be loaded yet
          document.getElementById('highlightCount').textContent = '0';
          document.getElementById('scannerStatus').textContent = 'Not loaded';
          return;
        }

        if (response) {
          this.stats = response;
          document.getElementById('highlightCount').textContent = response.highlightedElements || '0';
          document.getElementById('scannerStatus').textContent = response.isScanning ? 'Active' : 'Inactive';
        }
      });
    } catch (error) {
      console.log('Could not load stats:', error);
      document.getElementById('highlightCount').textContent = 'Error';
      document.getElementById('scannerStatus').textContent = 'Error';
    }
  }

  async scanCurrentTab() {
    const scanButton = document.getElementById('scanButton');
    const originalText = scanButton.textContent;
    
    scanButton.textContent = '🔍 Scanning...';
    scanButton.disabled = true;

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      chrome.tabs.sendMessage(tab.id, { action: 'scan' }, (response) => {
        scanButton.textContent = originalText;
        scanButton.disabled = false;

        if (chrome.runtime.lastError) {
          this.showError('Could not scan page. Try refreshing the page first.');
          return;
        }

        if (response && response.success) {
          // Refresh stats after a short delay
          setTimeout(() => {
            this.loadStats();
          }, 500);
        } else {
          this.showError('Scan failed. Please try again.');
        }
      });
    } catch (error) {
      scanButton.textContent = originalText;
      scanButton.disabled = false;
      this.showError('Could not access current tab.');
    }
  }

  async clearHighlights() {
    const clearButton = document.getElementById('clearButton');
    const originalText = clearButton.textContent;
    
    clearButton.textContent = '🧹 Clearing...';
    clearButton.disabled = true;

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      chrome.tabs.sendMessage(tab.id, { action: 'clear' }, (response) => {
        clearButton.textContent = originalText;
        clearButton.disabled = false;

        if (chrome.runtime.lastError) {
          this.showError('Could not clear highlights. Try refreshing the page.');
          return;
        }

        if (response && response.success) {
          // Refresh stats
          setTimeout(() => {
            this.loadStats();
          }, 100);
        } else {
          this.showError('Clear failed. Please try again.');
        }
      });
    } catch (error) {
      clearButton.textContent = originalText;
      clearButton.disabled = false;
      this.showError('Could not access current tab.');
    }
  }

  openTestPage() {
    const testHTML = `
<!DOCTYPE html>
<html>
<head>
    <title>Homoglyph Test Page</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; }
        .test-section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        .test-section h3 { margin-top: 0; }
        code { background: #f5f5f5; padding: 2px 4px; font-family: monospace; }
    </style>
</head>
<body>
    <h1>Homoglyph Detector Test Page</h1>
    <p>This page contains various homoglyphs and suspicious Unicode characters for testing.</p>
    
    <div class="test-section">
        <h3>Basic Cyrillic Lookalikes</h3>
        <p>Normal: <code>master</code> - All Latin characters</p>
        <p>Suspicious: <code>ma&#1109;ter</code> - Contains Cyrillic '&#1109;' (U+0455)</p>
        <p>Suspicious: <code>&#1040;pple</code> - Contains Cyrillic '&#1040;' (U+0410)</p>
        <p>Suspicious: <code>micros&#1086;ft</code> - Contains Cyrillic '&#1086;' (U+043E)</p>
    </div>
    
    <div class="test-section">
        <h3>Greek Lookalikes</h3>
        <p>Suspicious: <code>g&#959;&#959;gle</code> - Contains Greek omicron '&#959;' (U+03BF)</p>
        <p>Suspicious: <code>&#945;pple</code> - Contains Greek alpha '&#945;' (U+03B1)</p>
    </div>
    
    <div class="test-section">
        <h3>Mixed Scripts</h3>
        <p>Suspicious: <code>&#1088;&#1072;ypal</code> - Contains Cyrillic '&#1088;' and '&#1072;'</p>
        <p>Suspicious: <code>&#1072;mazon</code> - Contains Cyrillic '&#1072;'</p>
        <p>Normal: <code>amazon</code> - All Latin characters</p>
    </div>
    
    <div class="test-section">
        <h3>Mathematical and Special Unicode</h3>
        <p>Suspicious: <code>&#119808;pple</code> - Mathematical bold 'A' (U+1D400)</p>
        <p>Suspicious: <code>test&#120793;&#120794;&#120795;</code> - Mathematical bold digits</p>
    </div>
    
    <div class="test-section">
        <h3>Common Domain Examples</h3>
        <p>Suspicious domain: <code>g&#1086;&#1086;gle.com</code> (Cyrillic &#1086;)</p>
        <p>Suspicious domain: <code>f&#1072;cebook.com</code> (Cyrillic &#1072;)</p>
        <p>Suspicious domain: <code>&#1072;pple.com</code> (Cyrillic &#1072;)</p>
    </div>
    
    <p><strong>Instructions:</strong> Enable the Homoglyph Detector extension and click "Scan Current Page" to see the suspicious characters highlighted.</p>
</body>
</html>`;

    const blob = new Blob([testHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    chrome.tabs.create({ url: url });
  }

  showAbout() {
    const aboutHTML = `
<!DOCTYPE html>
<html>
<head>
    <title>About Homoglyph Detector</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; max-width: 800px; margin: 0 auto; }
        .header { text-align: center; margin-bottom: 30px; }
        .section { margin: 20px 0; }
        code { background: #f5f5f5; padding: 2px 4px; font-family: monospace; }
        .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 10px; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🔍 Homoglyph Detector</h1>
        <p>Unicode Lookalike Character Detection Extension</p>
    </div>
    
    <div class="section">
        <h2>What are Homoglyphs?</h2>
        <p>Homoglyphs are characters that look visually identical or very similar but have different Unicode code points. 
        They can be used in phishing attacks, domain spoofing, and other deceptive practices.</p>
        
        <div class="warning">
            <strong>Example:</strong> The word "master" can be written as "maѕter" using a Cyrillic 'ѕ' instead of Latin 's'. 
            To the human eye, they look identical, but computers treat them as completely different characters.
        </div>
    </div>
    
    <div class="section">
        <h2>How This Extension Works</h2>
        <ul>
            <li>Automatically scans web pages for suspicious Unicode characters</li>
            <li>Highlights characters that look like Latin letters but come from other scripts (Cyrillic, Greek, etc.)</li>
            <li>Provides detailed information about each suspicious character</li>
            <li>Monitors for mixed-script usage that might indicate deception</li>
        </ul>
    </div>
    
    <div class="section">
        <h2>Features</h2>
        <ul>
            <li><strong>Real-time Detection:</strong> Automatically scans pages as they load</li>
            <li><strong>Visual Highlighting:</strong> Suspicious characters are highlighted with yellow background and red underline</li>
            <li><strong>Detailed Tooltips:</strong> Hover over highlights to see Unicode information</li>
            <li><strong>Script Detection:</strong> Identifies Cyrillic, Greek, and other non-Latin scripts</li>
            <li><strong>Performance Optimized:</strong> Minimal impact on page loading</li>
        </ul>
    </div>
    
    <div class="section">
        <h2>Common Homoglyph Examples</h2>
        <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%;">
            <tr>
                <th>Latin Character</th>
                <th>Homoglyph</th>
                <th>Script</th>
                <th>Unicode</th>
            </tr>
            <tr>
                <td>a</td>
                <td>а</td>
                <td>Cyrillic</td>
                <td>U+0430</td>
            </tr>
            <tr>
                <td>c</td>
                <td>с</td>
                <td>Cyrillic</td>
                <td>U+0441</td>
            </tr>
            <tr>
                <td>e</td>
                <td>е</td>
                <td>Cyrillic</td>
                <td>U+0435</td>
            </tr>
            <tr>
                <td>o</td>
                <td>о</td>
                <td>Cyrillic</td>
                <td>U+043E</td>
            </tr>
            <tr>
                <td>s</td>
                <td>ѕ</td>
                <td>Cyrillic</td>
                <td>U+0455</td>
            </tr>
        </table>
    </div>
    
    <div class="section">
        <h2>Privacy & Security</h2>
        <ul>
            <li>This extension only analyzes text content on web pages</li>
            <li>No data is sent to external servers</li>
            <li>All processing happens locally in your browser</li>
            <li>Settings are stored locally using Chrome's storage API</li>
        </ul>
    </div>
    
    <div class="section">
        <h2>Usage Tips</h2>
        <ul>
            <li>Pay attention to highlights on login pages and URLs</li>
            <li>Be extra cautious with highlighted domain names</li>
            <li>Use the manual scan feature for important documents</li>
            <li>Disable temporarily if highlights interfere with reading</li>
        </ul>
    </div>
</body>
</html>`;

    const blob = new Blob([aboutHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    chrome.tabs.create({ url: url });
  }

  showError(message) {
    // Simple error display - could be enhanced with a proper modal
    const originalStatus = document.getElementById('status-text').textContent;
    const statusText = document.getElementById('status-text');
    statusText.textContent = `Error: ${message}`;
    statusText.style.color = '#c62828';
    
    setTimeout(() => {
      statusText.textContent = originalStatus;
      statusText.style.color = '';
    }, 3000);
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new PopupController();
});