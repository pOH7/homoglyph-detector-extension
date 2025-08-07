/*
 * Copyright 2025 pOH7
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

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