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
    chrome.tabs.create({ url: 'https://poh7.github.io/homoglyph-detector-extension/test.html' });
  }

  showAbout() {
    chrome.tabs.create({ url: 'https://poh7.github.io/homoglyph-detector-extension/about.html' });
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