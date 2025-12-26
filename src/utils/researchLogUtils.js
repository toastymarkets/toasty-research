import { CITY_BY_SLUG } from '../config/cities';
import { getWorkspaceList } from '../stores/workspaceStore';

// Key patterns for localStorage
const CITY_NOTE_PREFIX = 'toasty_research_notes_v1_city_';
const WORKSPACE_NOTE_PREFIX = 'toasty_research_notes_v1_workspace_';

// Weather type detection keywords
const WEATHER_KEYWORDS = {
  Temperature: ['temp', 'hot', 'cold', 'heat', 'freeze', 'degree', 'warm', 'cool'],
  Rain: ['rain', 'precip', 'shower', 'storm', 'wet', 'flood'],
  Snow: ['snow', 'winter', 'blizzard', 'ice', 'frost', 'flurry'],
  Wind: ['wind', 'gust', 'breeze', 'hurricane', 'tornado'],
};

/**
 * Extract all text content from a TipTap document
 */
function extractTextFromDoc(doc) {
  if (!doc || !doc.content) return '';

  const extractText = (node) => {
    if (node.type === 'text') {
      return node.text || '';
    }
    if (node.content) {
      return node.content.map(extractText).join(' ');
    }
    return '';
  };

  return doc.content.map(extractText).join(' ');
}

/**
 * Extract research topic from document (first heading or first line)
 */
export function extractResearchTopic(doc) {
  if (!doc || !doc.content) return 'Untitled';

  // Look for first heading
  for (const node of doc.content) {
    if (node.type === 'heading' && node.content) {
      const text = node.content.map(n => n.text || '').join('').trim();
      if (text && text !== 'Research Notes') {
        return text;
      }
    }
  }

  // Fall back to first paragraph with content
  for (const node of doc.content) {
    if (node.type === 'paragraph' && node.content) {
      const text = node.content.map(n => n.text || '').join('').trim();
      if (text && !text.startsWith('Start typing')) {
        return text.length > 50 ? text.slice(0, 47) + '...' : text;
      }
    }
  }

  return 'Untitled';
}

/**
 * Detect weather type from document content
 */
export function detectWeatherType(doc) {
  const text = extractTextFromDoc(doc).toLowerCase();

  for (const [type, keywords] of Object.entries(WEATHER_KEYWORDS)) {
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        return type;
      }
    }
  }

  return 'General';
}

/**
 * Check if document has non-default content
 */
function hasRealContent(doc) {
  if (!doc || !doc.content) return false;

  const text = extractTextFromDoc(doc).trim();

  // Check for default content
  const defaultContent = 'Research Notes Start typing or use / to insert blocks';
  const normalizedText = text.replace(/\s+/g, ' ');

  return normalizedText.length > 0 && normalizedText !== defaultContent;
}

/**
 * Get all research notes from localStorage
 */
export function getAllResearchNotes() {
  const notes = [];
  const workspaces = getWorkspaceList();
  const workspaceMap = new Map(workspaces.map(w => [w.id, w]));

  // Scan all localStorage keys
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;

    try {
      // Check for city notes
      if (key.startsWith(CITY_NOTE_PREFIX)) {
        const citySlug = key.slice(CITY_NOTE_PREFIX.length);
        const city = CITY_BY_SLUG[citySlug];
        if (!city) continue;

        const data = JSON.parse(localStorage.getItem(key));
        if (!data || !hasRealContent(data.document)) continue;

        notes.push({
          id: key,
          type: 'city',
          slug: citySlug,
          location: city.name,
          topic: extractResearchTopic(data.document),
          lastSaved: new Date(data.lastSaved),
          weatherType: detectWeatherType(data.document),
          hasContent: true,
        });
      }

      // Check for workspace notes
      if (key.startsWith(WORKSPACE_NOTE_PREFIX)) {
        const workspaceId = key.slice(WORKSPACE_NOTE_PREFIX.length);
        const workspace = workspaceMap.get(workspaceId);
        if (!workspace) continue;

        const data = JSON.parse(localStorage.getItem(key));
        if (!data || !hasRealContent(data.document)) continue;

        notes.push({
          id: key,
          type: 'workspace',
          slug: workspaceId,
          location: workspace.name,
          topic: extractResearchTopic(data.document),
          lastSaved: new Date(data.lastSaved),
          weatherType: detectWeatherType(data.document),
          hasContent: true,
        });
      }
    } catch (e) {
      console.error('Failed to parse note:', key, e);
    }
  }

  // Sort by most recent first
  notes.sort((a, b) => b.lastSaved - a.lastSaved);

  return notes;
}

/**
 * Get recent research notes (limited count)
 */
export function getRecentResearchNotes(limit = 3) {
  return getAllResearchNotes().slice(0, limit);
}
