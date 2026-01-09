/**
 * Utility functions for NWS Discussion Widget
 * Parsing, text processing, and time formatting
 */

import {
  KEYWORD_MAP,
  ALL_KEYWORDS_SORTED,
  WEATHER_KEYWORDS,
  PATTERNS,
} from './nwsDiscussionConstants.js';

/**
 * Clean up text formatting - normalize whitespace and trim
 */
export function cleanText(text) {
  return text.replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Format issuance time for display
 */
export function formatTime(isoTime) {
  if (!isoTime) return '';
  const date = new Date(isoTime);
  return date.toLocaleString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format relative time (e.g., "12m ago", "2h ago")
 */
export function formatRelativeTime(isoTime) {
  if (!isoTime) return '';

  const diffMs = Date.now() - new Date(isoTime).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

/**
 * Parse AFD text into sections
 * Handles both standard format (.SYNOPSIS, .NEAR TERM, etc.) and
 * alternative format (.KEY MESSAGES, .DISCUSSION) used by some offices
 */
export function parseDiscussion(text, meta) {
  const sections = {};
  const sectionEnd = '(?=&&|\\n\\n\\.[A-Z])';

  // Section patterns to extract
  const sectionPatterns = [
    { key: 'synopsis', pattern: '\\.SYNOPSIS\\.{3}\\s*([\\s\\S]*?)' },
    { key: 'keyMessages', pattern: '\\.KEY MESSAGES\\.{3}\\s*([\\s\\S]*?)', fallbackFor: 'synopsis' },
    { key: 'nearTerm', pattern: '\\.NEAR TERM[^.]*\\.{3}\\s*([\\s\\S]*?)' },
    { key: 'discussion', pattern: '\\.DISCUSSION\\.{3}\\s*([\\s\\S]*?)', fallbackFor: 'nearTerm' },
    { key: 'shortTerm', pattern: '\\.SHORT TERM[^.]*\\.{3}\\s*([\\s\\S]*?)' },
    { key: 'longTerm', pattern: '\\.LONG TERM[^.]*\\.{3}\\s*([\\s\\S]*?)' },
    { key: 'aviation', pattern: '\\.AVIATION[^.]*\\.{3}\\s*([\\s\\S]*?)' },
    { key: 'marine', pattern: '\\.MARINE[^.]*\\.{3}\\s*([\\s\\S]*?)' },
  ];

  for (const { key, pattern, fallbackFor } of sectionPatterns) {
    const regex = new RegExp(pattern + sectionEnd, 'i');
    const match = text.match(regex);
    if (match) {
      const targetKey = fallbackFor && !sections[fallbackFor] ? fallbackFor : key;
      if (!sections[targetKey]) {
        sections[targetKey] = cleanText(match[1]);
      }
    }
  }

  return {
    ...meta,
    ...sections,
    fullText: text,
  };
}

/**
 * Extract a clean synopsis excerpt for preview
 * Returns first 1-2 sentences, max ~120 chars
 */
export function extractSynopsisExcerpt(synopsis) {
  if (!synopsis) return null;

  // Clean and normalize
  let text = synopsis.trim().replace(/\s+/g, ' ');

  // Remove common NWS prefixes (date stamps, leading ellipsis)
  text = text.replace(/^\d{1,2}\/\d{3,4}\s*(AM|PM)\.?\s*/i, '');
  text = text.replace(/^\.{3}\s*/, '');

  // Extract first sentence or two
  const sentences = text.match(/[^.!?]+[.!?]+/g);
  if (sentences && sentences.length > 0) {
    let excerpt = sentences[0].trim();
    if (excerpt.length < 60 && sentences.length > 1) {
      excerpt += ' ' + sentences[1].trim();
    }
    if (excerpt.length > 120) {
      excerpt = excerpt.slice(0, 117).trim() + '...';
    }
    return excerpt;
  }

  // Fallback: truncate
  return text.length > 120 ? text.slice(0, 117).trim() + '...' : text;
}

/**
 * Find unique keyword matches in text for a given category
 */
function findUniqueMatches(text, keywords, category) {
  const sortedKeywords = keywords.sort((a, b) => b.length - a.length);
  const pattern = new RegExp(
    `\\b(${sortedKeywords.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`,
    'gi'
  );

  const found = [];
  let match;
  while ((match = pattern.exec(text)) !== null) {
    const matchText = match[0].toLowerCase();
    if (!found.some(r => r.text === matchText)) {
      found.push({ text: matchText, category });
    }
  }
  return found;
}

/**
 * Extract key forecast keywords from text for widget preview
 * Prioritizes: temp ranges > precipitation > temperature keywords
 */
export function extractKeywords(text) {
  if (!text) return [];

  // Find temperature ranges
  const tempRanges = [];
  let match;
  while ((match = PATTERNS.tempRange.exec(text)) !== null) {
    tempRanges.push({ text: match[0].toLowerCase(), category: 'tempRange' });
  }
  PATTERNS.tempRange.lastIndex = 0; // Reset regex state

  // Find keyword matches by category
  const tempKeywords = findUniqueMatches(text, WEATHER_KEYWORDS.temperature, 'temperature');
  const precipKeywords = findUniqueMatches(text, WEATHER_KEYWORDS.precipitation, 'precipitation');
  const windKeywords = findUniqueMatches(text, WEATHER_KEYWORDS.wind, 'wind');

  // Build balanced results (max 4)
  const results = [];

  if (tempRanges.length > 0) results.push(tempRanges[0]);
  if (tempKeywords.length > 0) results.push(tempKeywords[0]);
  if (windKeywords.length > 0) results.push(windKeywords[0]);

  // Fill remaining slots
  const remaining = [
    ...precipKeywords,
    ...tempRanges.slice(1),
    ...tempKeywords.slice(1),
    ...windKeywords.slice(1),
  ];

  for (const item of remaining) {
    if (results.length >= 4) break;
    if (!results.some(r => r.text === item.text)) {
      results.push(item);
    }
  }

  return results;
}

/**
 * Determine the category for a matched text segment
 */
export function categorizeMatch(matchedText) {
  if (/^(highs?|lows?|temperatures?)\s+/i.test(matchedText)) {
    return 'tempRange';
  }
  if (/\d+\.?\d*\s*(-|to)\s*\d+\.?\d*\s*(inch(es)?|"|in)/i.test(matchedText)) {
    return 'rainfallAmount';
  }
  if (/\d{1,3}\s*(-|to)\s*\d{1,3}\s*degrees?/i.test(matchedText)) {
    return 'degreeRange';
  }
  return KEYWORD_MAP.get(matchedText.toLowerCase());
}

/**
 * Build combined regex pattern for all highlightable terms
 */
export function buildHighlightPattern() {
  const keywordPattern = `\\b(${ALL_KEYWORDS_SORTED.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`;
  const tempRangePattern = `\\b(highs?|lows?|temperatures?)\\s+(in the\\s+|of\\s+)?(lower\\s+|mid\\s+|upper\\s+)?(\\d{1,2}0s)(\\s+to\\s+(the\\s+)?(lower\\s+|mid\\s+|upper\\s+)?\\d{1,2}0s)?\\b`;
  const rainfallPattern = `\\b\\d+\\.?\\d*\\s*(-|to)\\s*\\d+\\.?\\d*\\s*(inch(es)?|"|in)\\s*(of\\s+)?(rain(fall)?|precip(itation)?|liquid|snow|accumulation)?\\b`;
  const degreePattern = `\\b\\d{1,3}\\s*(-|to)\\s*\\d{1,3}\\s*degrees?\\b`;

  return new RegExp(
    `(${tempRangePattern})|(${rainfallPattern})|(${degreePattern})|(${keywordPattern})`,
    'gi'
  );
}
