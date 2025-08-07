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

class HomoglyphScanner {
  constructor() {
    this.detector = new HomoglyphDetector();
    this.isEnabled = true;
    this.highlightedElements = new Set();
    this.observer = null;
    this.scanDelay = 500; // Debounce delay in ms
    this.scanTimeout = null;
    
    this.init();
  }

  async init() {
    // Load settings from storage
    await this.loadSettings();
    
    // Start scanning if enabled
    if (this.isEnabled) {
      this.startScanning();
    }

    // Listen for settings changes
    chrome.storage.onChanged.addListener((changes) => {
      if (changes.enabled) {
        this.isEnabled = changes.enabled.newValue;
        if (this.isEnabled) {
          this.startScanning();
        } else {
          this.stopScanning();
        }
      }
    });

    // Listen for messages from popup
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      switch (request.action) {
        case 'scan':
          this.scanPage();
          sendResponse({ success: true });
          break;
        case 'clear':
          this.clearHighlights();
          sendResponse({ success: true });
          break;
        case 'getStats':
          sendResponse(this.getStats());
          break;
      }
    });
  }

  async loadSettings() {
    try {
      const result = await chrome.storage.sync.get(['enabled']);
      this.isEnabled = result.enabled !== false; // Default to true
    } catch (error) {
      console.log('HomoglyphScanner: Could not load settings, using defaults');
      this.isEnabled = true;
    }
  }

  startScanning() {
    // Initial scan
    this.debouncedScan();

    // Set up mutation observer for dynamic content
    if (!this.observer) {
      this.observer = new MutationObserver((mutations) => {
        let shouldScan = false;
        
        for (const mutation of mutations) {
          if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            for (const node of mutation.addedNodes) {
              // Skip our own highlighting changes
              if (node.nodeType === Node.ELEMENT_NODE && 
                  (node.className === 'homoglyph-highlight' || node.className === 'homoglyph-container')) {
                continue;
              }
              
              if (node.nodeType === Node.TEXT_NODE || 
                  (node.nodeType === Node.ELEMENT_NODE && node.textContent && 
                   !node.closest('.homoglyph-container'))) {
                shouldScan = true;
                break;
              }
            }
          } else if (mutation.type === 'characterData') {
            // Skip character data changes within our highlights
            if (mutation.target.parentElement && 
                !mutation.target.parentElement.closest('.homoglyph-container, .homoglyph-highlight')) {
              shouldScan = true;
            }
          }
        }
        
        if (shouldScan) {
          this.debouncedScan();
        }
      });

      this.observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true
      });
    }
  }

  stopScanning() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    
    this.clearHighlights();
    
    if (this.scanTimeout) {
      clearTimeout(this.scanTimeout);
      this.scanTimeout = null;
    }
  }

  debouncedScan() {
    if (this.scanTimeout) {
      clearTimeout(this.scanTimeout);
    }
    
    this.scanTimeout = setTimeout(() => {
      this.scanPage();
    }, this.scanDelay);
  }

  scanPage() {
    if (!this.isEnabled) return;

    console.log('HomoglyphScanner: Starting page scan...');
    const startTime = performance.now();
    
    // Temporarily disconnect observer to prevent infinite loop
    const wasObserving = this.observer !== null;
    if (this.observer) {
      this.observer.disconnect();
    }
    
    // Clear previous highlights
    this.clearHighlights();
    
    // Get all text nodes
    const textNodes = this.getTextNodes(document.body);
    let totalSuspicious = 0;
    let totalScanned = 0;
    
    for (const textNode of textNodes) {
      const results = this.scanTextNode(textNode);
      totalSuspicious += results.suspiciousCount;
      totalScanned += results.totalChars;
    }
    
    const endTime = performance.now();
    console.log(`HomoglyphScanner: Scan completed in ${(endTime - startTime).toFixed(2)}ms`);
    console.log(`HomoglyphScanner: Found ${totalSuspicious} suspicious characters in ${totalScanned} total characters`);
    
    // Reconnect observer if it was observing before
    if (wasObserving && this.observer) {
      this.observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true
      });
    }
    
    // Update badge
    this.updateBadge(totalSuspicious);
  }

  getTextNodes(element) {
    const textNodes = [];
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          // Skip script and style elements
          const parent = node.parentElement;
          if (parent && (parent.tagName === 'SCRIPT' || parent.tagName === 'STYLE')) {
            return NodeFilter.FILTER_REJECT;
          }
          
          // Skip nodes that are already highlighted
          if (parent && parent.closest('.homoglyph-container, .homoglyph-highlight')) {
            return NodeFilter.FILTER_REJECT;
          }
          
          // Skip empty or whitespace-only nodes
          if (!node.textContent.trim()) {
            return NodeFilter.FILTER_REJECT;
          }
          
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );
    
    let currentNode;
    while (currentNode = walker.nextNode()) {
      textNodes.push(currentNode);
    }
    
    return textNodes;
  }

  scanTextNode(textNode) {
    const text = textNode.textContent;
    const results = this.detector.detectHomoglyphs(text);
    let suspiciousCount = 0;
    
    if (results.length > 0) {
      // Create highlights for suspicious characters
      const fragments = this.createHighlightFragments(text, results);
      
      // Check if we have any highlighted fragments (not just multiple fragments)
      const hasHighlights = fragments.some(fragment => 
        fragment.nodeType === Node.ELEMENT_NODE && 
        fragment.className === 'homoglyph-highlight'
      );
      
      if (hasHighlights) {
        const parent = textNode.parentNode;
        const container = document.createElement('span');
        container.className = 'homoglyph-container';
        
        for (const fragment of fragments) {
          container.appendChild(fragment);
        }
        
        parent.replaceChild(container, textNode);
        this.highlightedElements.add(container);
        
        suspiciousCount = results.filter(r => r.isSuspicious).length;
      }
    }
    
    return {
      suspiciousCount: suspiciousCount,
      totalChars: text.length
    };
  }

  createHighlightFragments(text, results) {
    const fragments = [];
    let lastIndex = 0;
    
    // Convert text to array of code points for proper indexing
    const textArray = Array.from(text);
    
    // Sort results by position
    const characterResults = results.filter(r => r.position !== undefined).sort((a, b) => a.position - b.position);
    
    for (const result of characterResults) {
      if (!result.isSuspicious) continue;
      
      const position = result.position;
      
      // Add text before suspicious character
      if (position > lastIndex) {
        const normalText = textArray.slice(lastIndex, position).join('');
        fragments.push(document.createTextNode(normalText));
      }
      
      // Add highlighted suspicious character
      const span = document.createElement('span');
      span.className = 'homoglyph-highlight';
      span.textContent = result.char;
      span.title = this.createTooltip(result);
      span.dataset.codepoint = result.codePoint.toString();
      span.dataset.script = result.script;
      
      fragments.push(span);
      lastIndex = position + 1;
    }
    
    // Add remaining text
    if (lastIndex < textArray.length) {
      const remainingText = textArray.slice(lastIndex).join('');
      fragments.push(document.createTextNode(remainingText));
    }
    
    // If no highlights were created, return original text node
    if (fragments.length === 0) {
      fragments.push(document.createTextNode(text));
    }
    
    return fragments;
  }

  createTooltip(result) {
    let tooltip = `Suspicious character: '${result.char}'\n`;
    tooltip += `Unicode: U+${result.codePoint.toString(16).toUpperCase().padStart(4, '0')}\n`;
    tooltip += `Script: ${result.script}\n`;
    tooltip += `Reason: ${result.reason}`;
    
    if (result.lookalikes && result.lookalikes.length > 0) {
      tooltip += `\nLooks like: ${result.lookalikes.join(', ')}`;
    }
    
    return tooltip;
  }

  clearHighlights() {
    for (const element of this.highlightedElements) {
      if (element.parentNode) {
        // Replace with plain text
        const textContent = element.textContent;
        const textNode = document.createTextNode(textContent);
        element.parentNode.replaceChild(textNode, element);
      }
    }
    this.highlightedElements.clear();
  }

  updateBadge(count) {
    try {
      chrome.runtime.sendMessage({
        action: 'updateBadge',
        count: count
      });
    } catch (error) {
      // Ignore errors if popup is not open
    }
  }

  getStats() {
    return {
      highlightedElements: this.highlightedElements.size,
      isEnabled: this.isEnabled,
      isScanning: this.observer !== null
    };
  }
}

// Initialize scanner when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new HomoglyphScanner();
  });
} else {
  new HomoglyphScanner();
}