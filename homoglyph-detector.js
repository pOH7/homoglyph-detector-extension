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

class HomoglyphDetector {
  constructor() {
    this.homoglyphMap = this.buildHomoglyphMap();
    this.suspiciousChars = new Set();
    this.mixedScriptThreshold = 0.1;
  }

  buildHomoglyphMap() {
    return {
      // Latin to Cyrillic lookalikes
      'a': ['а', 'ɑ', 'α'], // Cyrillic а, Latin ɑ, Greek α
      'c': ['с', 'ϲ'], // Cyrillic с, Greek ϲ
      'e': ['е', 'ε'], // Cyrillic е, Greek ε
      'h': ['һ', 'η'], // Cyrillic һ, Greek η
      'i': ['і', 'ι', 'ǐ'], // Cyrillic і, Greek ι, Latin ǐ
      'j': ['ј'], // Cyrillic ј
      'o': ['о', 'ο', 'σ'], // Cyrillic о, Greek ο, Greek σ
      'p': ['р', 'ρ'], // Cyrillic р, Greek ρ
      'r': ['г'], // Cyrillic г
      's': ['ѕ', 'ς'], // Cyrillic ѕ, Greek ς
      't': ['т', 'τ'], // Cyrillic т, Greek τ
      'u': ['υ'], // Greek υ
      'x': ['х', 'χ'], // Cyrillic х, Greek χ
      'y': ['у', 'ү', 'γ'], // Cyrillic у, ү, Greek γ
      
      // Numbers and special characters
      '0': ['О', 'о', 'Ο', 'ο'], // Cyrillic О, о, Greek Ο, ο
      '1': ['l', 'I', '|', 'і', 'Ι'], // Latin l, I, pipe, Cyrillic і, Greek Ι
      '3': ['З', 'з'], // Cyrillic З, з
      '6': ['б'], // Cyrillic б
      
      // Mathematical and other Unicode blocks
      'A': ['А', 'Α', 'А'], // Cyrillic А, Greek Α
      'B': ['В', 'Β'], // Cyrillic В, Greek Β
      'C': ['С', 'Ϲ'], // Cyrillic С, Greek Ϲ
      'E': ['Е', 'Ε'], // Cyrillic Е, Greek Ε
      'H': ['Н', 'Η'], // Cyrillic Н, Greek Η
      'I': ['І', 'Ι'], // Cyrillic І, Greek Ι
      'J': ['Ј'], // Cyrillic Ј
      'K': ['К', 'Κ'], // Cyrillic К, Greek Κ
      'M': ['М', 'Μ'], // Cyrillic М, Greek Μ
      'N': ['Ν'], // Greek Ν
      'O': ['О', 'Ο'], // Cyrillic О, Greek Ο
      'P': ['Р', 'Ρ'], // Cyrillic Р, Greek Ρ
      'S': ['Ѕ'], // Cyrillic Ѕ
      'T': ['Т', 'Τ'], // Cyrillic Т, Greek Τ
      'X': ['Х', 'Χ'], // Cyrillic Х, Greek Χ
      'Y': ['У', 'Υ'], // Cyrillic У, Greek Υ
      'Z': ['Ζ'] // Greek Ζ
    };
  }

  detectHomoglyphs(text) {
    const results = [];
    const chars = Array.from(text);
    
    for (let i = 0; i < chars.length; i++) {
      const char = chars[i];
      const analysis = this.analyzeCharacter(char, i);
      
      if (analysis.isSuspicious) {
        results.push(analysis);
      }
    }
    
    // Check for mixed scripts
    const scriptAnalysis = this.analyzeScripts(text);
    if (scriptAnalysis.isMixedScript) {
      results.unshift({
        type: 'mixed-script',
        message: `Mixed scripts detected: ${scriptAnalysis.scripts.join(', ')}`,
        confidence: scriptAnalysis.confidence
      });
    }
    
    return results;
  }

  analyzeCharacter(char, position) {
    const codePoint = char.codePointAt(0);
    const script = this.getScript(codePoint);
    
    // Check if character has lookalikes
    const lookalikes = this.findLookalikes(char);
    
    const analysis = {
      char: char,
      position: position,
      codePoint: codePoint,
      script: script,
      isSuspicious: false,
      reason: '',
      lookalikes: lookalikes,
      confidence: 0
    };

    // Check for non-Latin characters that look like Latin
    if (script !== 'Latin' && lookalikes.length > 0) {
      analysis.isSuspicious = true;
      analysis.reason = `${script} character '${char}' looks like Latin character(s): ${lookalikes.join(', ')}`;
      analysis.confidence = 0.9;
    }

    // Check for unusual Unicode blocks
    if (this.isUnusualUnicodeBlock(codePoint)) {
      analysis.isSuspicious = true;
      analysis.reason = `Character from unusual Unicode block: ${this.getUnicodeBlockName(codePoint)}`;
      analysis.confidence = 0.7;
    }

    return analysis;
  }

  findLookalikes(char) {
    const lookalikes = [];
    
    for (const [latin, variants] of Object.entries(this.homoglyphMap)) {
      if (variants.includes(char)) {
        lookalikes.push(latin);
      }
    }
    
    return lookalikes;
  }

  getScript(codePoint) {
    if (codePoint >= 0x0000 && codePoint <= 0x007F) return 'Latin';
    if (codePoint >= 0x0080 && codePoint <= 0x00FF) return 'Latin-1';
    if (codePoint >= 0x0100 && codePoint <= 0x017F) return 'Latin Extended-A';
    if (codePoint >= 0x0180 && codePoint <= 0x024F) return 'Latin Extended-B';
    if (codePoint >= 0x0370 && codePoint <= 0x03FF) return 'Greek';
    if (codePoint >= 0x0400 && codePoint <= 0x04FF) return 'Cyrillic';
    if (codePoint >= 0x0500 && codePoint <= 0x052F) return 'Cyrillic Supplement';
    if (codePoint >= 0x2000 && codePoint <= 0x206F) return 'General Punctuation';
    if (codePoint >= 0x2070 && codePoint <= 0x209F) return 'Superscripts and Subscripts';
    if (codePoint >= 0x20A0 && codePoint <= 0x20CF) return 'Currency Symbols';
    if (codePoint >= 0x2100 && codePoint <= 0x214F) return 'Letterlike Symbols';
    if (codePoint >= 0x2150 && codePoint <= 0x218F) return 'Number Forms';
    if (codePoint >= 0x2190 && codePoint <= 0x21FF) return 'Arrows';
    if (codePoint >= 0x2200 && codePoint <= 0x22FF) return 'Mathematical Operators';
    if (codePoint >= 0x2300 && codePoint <= 0x23FF) return 'Miscellaneous Technical';
    if (codePoint >= 0x1D400 && codePoint <= 0x1D7FF) return 'Mathematical Alphanumeric';
    return 'Other';
  }

  analyzeScripts(text) {
    const scripts = new Set();
    const chars = Array.from(text.replace(/\s+/g, '')); // Remove whitespace
    
    for (const char of chars) {
      const script = this.getScript(char.codePointAt(0));
      if (script !== 'Latin' && script !== 'General Punctuation') {
        scripts.add(script);
      }
    }
    
    const scriptArray = Array.from(scripts);
    const isMixedScript = scriptArray.length > 0;
    
    return {
      scripts: scriptArray,
      isMixedScript: isMixedScript,
      confidence: Math.min(scriptArray.length * 0.3, 1.0)
    };
  }

  isUnusualUnicodeBlock(codePoint) {
    return (
      (codePoint >= 0x1D400 && codePoint <= 0x1D7FF) || // Mathematical Alphanumeric
      (codePoint >= 0xFF00 && codePoint <= 0xFFEF) ||   // Halfwidth and Fullwidth Forms
      (codePoint >= 0x2100 && codePoint <= 0x214F)      // Letterlike Symbols
    );
  }

  getUnicodeBlockName(codePoint) {
    if (codePoint >= 0x1D400 && codePoint <= 0x1D7FF) return 'Mathematical Alphanumeric Symbols';
    if (codePoint >= 0xFF00 && codePoint <= 0xFFEF) return 'Halfwidth and Fullwidth Forms';
    if (codePoint >= 0x2100 && codePoint <= 0x214F) return 'Letterlike Symbols';
    return 'Unknown';
  }

  // Utility method for quick character checking
  isHomoglyph(char) {
    const analysis = this.analyzeCharacter(char, 0);
    return analysis.isSuspicious;
  }

  // Get detailed info about a character
  getCharacterInfo(char) {
    const codePoint = char.codePointAt(0);
    return {
      char: char,
      codePoint: codePoint,
      hex: '0x' + codePoint.toString(16).toUpperCase(),
      unicode: 'U+' + codePoint.toString(16).toUpperCase().padStart(4, '0'),
      script: this.getScript(codePoint),
      lookalikes: this.findLookalikes(char)
    };
  }
}

// Make it available globally
window.HomoglyphDetector = HomoglyphDetector;