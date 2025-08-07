// Background script for Homoglyph Detector Extension

class BackgroundController {
  constructor() {
    this.init();
  }

  init() {
    // Handle messages from content scripts
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      switch (message.action) {
        case 'updateBadge':
          this.updateBadge(sender.tab.id, message.count);
          break;
      }
    });

    // Clear badge when tab is updated
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (changeInfo.status === 'loading') {
        this.clearBadge(tabId);
      }
    });

    // Clear badge when tab is activated
    chrome.tabs.onActivated.addListener((activeInfo) => {
      // Badge will be updated by content script if needed
    });
  }

  updateBadge(tabId, count) {
    if (count > 0) {
      chrome.action.setBadgeText({
        tabId: tabId,
        text: count.toString()
      });
      
      chrome.action.setBadgeBackgroundColor({
        tabId: tabId,
        color: '#f44336'
      });
      
      chrome.action.setTitle({
        tabId: tabId,
        title: `Homoglyph Detector - ${count} suspicious character(s) found`
      });
    } else {
      this.clearBadge(tabId);
    }
  }

  clearBadge(tabId) {
    chrome.action.setBadgeText({
      tabId: tabId,
      text: ''
    });
    
    chrome.action.setTitle({
      tabId: tabId,
      title: 'Homoglyph Detector - No suspicious characters detected'
    });
  }
}

// Initialize background controller
new BackgroundController();