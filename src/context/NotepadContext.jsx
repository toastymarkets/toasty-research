import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { CITY_BY_SLUG } from '../config/cities';

const NotepadContext = createContext(null);

// Create an empty TipTap document
const createEmptyDocument = (storageKey = '') => {
  // Special default for daily summary notepad
  if (storageKey === 'toasty_research_notes_v1_daily_summary') {
    const today = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 1 },
          content: [{ type: 'text', text: today }]
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: "Today's Forecasts:" }]
        },
        {
          type: 'paragraph',
        }
      ]
    };
  }

  // Special default for city notes
  if (storageKey.startsWith('toasty_research_notes_v1_city_')) {
    const citySlug = storageKey.replace('toasty_research_notes_v1_city_', '');
    const city = CITY_BY_SLUG[citySlug];

    if (city) {
      // Format date as "Friday, December 27, 2025"
      const dateString = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      return {
        type: 'doc',
        content: [
          {
            type: 'heading',
            attrs: { level: 1 },
            content: [{ type: 'text', text: `${city.name} | ${dateString}` }]
          },
          {
            type: 'heading',
            attrs: { level: 2 },
            content: [{ type: 'text', text: 'My forecast:' }]
          },
          {
            type: 'paragraph',
          }
        ]
      };
    }
  }

  // Default for other notepads (workspace)
  return {
    type: 'doc',
    content: [
      {
        type: 'heading',
        attrs: { level: 1 },
        content: [{ type: 'text', text: 'Research Notes' }]
      },
      {
        type: 'paragraph',
        content: [{ type: 'text', text: 'Start typing or use / to insert blocks...' }]
      }
    ]
  };
};

// Helper to extract text from TipTap document
const extractTextFromDoc = (doc) => {
  if (!doc || !doc.content) return '';
  const extractText = (node) => {
    if (node.type === 'text') return node.text || '';
    if (node.content) return node.content.map(extractText).join(' ');
    return '';
  };
  return doc.content.map(extractText).join(' ');
};

// Check if document has non-default content worth archiving
const hasNonDefaultContent = (doc) => {
  if (!doc || !doc.content) return false;

  const text = extractTextFromDoc(doc).trim().replace(/\s+/g, ' ');

  // Skip if empty
  if (text.length === 0) return false;

  // Skip default workspace content
  if (text === 'Research Notes Start typing or use / to insert blocks...') return false;

  // Skip if only contains date header patterns (city/daily defaults)
  // Pattern: "City Name | Day, Month DD, YYYY My forecast:" or "Day, Month DD, YYYY Today's Forecasts:"
  const cityDefaultPattern = /^[A-Za-z\s]+ \| [A-Za-z]+, [A-Za-z]+ \d+, \d{4} My forecast:$/;
  const dailyDefaultPattern = /^[A-Za-z]+, [A-Za-z]+ \d+, \d{4} Today's Forecasts:$/;

  if (cityDefaultPattern.test(text) || dailyDefaultPattern.test(text)) return false;

  return true;
};

export function NotepadProvider({ storageKey, children }) {
  const [document, setDocument] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastSaved, setLastSaved] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const saveTimeoutRef = useRef(null);

  // Check if it's a new day (notes should reset daily)
  const shouldResetDaily = (createdDate) => {
    if (!createdDate) return false;

    // Only auto-reset for daily summary and city notes
    const isDailyOrCity = storageKey === 'toasty_research_notes_v1_daily_summary' ||
                          storageKey.startsWith('toasty_research_notes_v1_city_');
    if (!isDailyOrCity) return false;

    // Check if it's a different calendar day
    const created = new Date(createdDate);
    const now = new Date();

    const createdDay = created.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric'
    });
    const today = now.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric'
    });

    return createdDay !== today;
  };

  // Load notes on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);

        // Check if note should be reset (new day)
        if (shouldResetDaily(parsed.createdDate)) {
          // Archive the old note if it has real content
          if (parsed.document && hasNonDefaultContent(parsed.document)) {
            const archiveKey = `${storageKey}_${Date.now()}`;
            localStorage.setItem(archiveKey, saved);
          }

          // Auto-reset: create new document with today's date
          const newDoc = createEmptyDocument(storageKey);
          setDocument(newDoc);
          setLastSaved(null);

          // Save the new document immediately
          const saveData = {
            document: newDoc,
            createdDate: new Date().toISOString(),
            lastSaved: new Date().toISOString(),
            version: 1,
          };
          localStorage.setItem(storageKey, JSON.stringify(saveData));
        } else {
          setDocument(parsed.document);
          setLastSaved(parsed.lastSaved ? new Date(parsed.lastSaved) : null);
        }
      } else {
        setDocument(createEmptyDocument(storageKey));
      }
    } catch (e) {
      console.error('Failed to load notes:', e);
      setDocument(createEmptyDocument(storageKey));
    }
    setIsLoading(false);
  }, [storageKey]);

  // Debounced save function
  const saveDocument = useCallback((newDoc) => {
    // Clear any pending save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    setIsSaving(true);

    // Debounce the actual save by 500ms
    saveTimeoutRef.current = setTimeout(() => {
      try {
        // Get existing createdDate or set new one
        const existing = localStorage.getItem(storageKey);
        let createdDate = new Date().toISOString();

        if (existing) {
          try {
            const parsed = JSON.parse(existing);
            createdDate = parsed.createdDate || createdDate;
          } catch (e) {
            // Use new date if parsing fails
          }
        }

        const saveData = {
          document: newDoc,
          createdDate: createdDate,
          lastSaved: new Date().toISOString(),
          version: 1,
        };
        localStorage.setItem(storageKey, JSON.stringify(saveData));
        setLastSaved(new Date());
        setDocument(newDoc);
      } catch (e) {
        console.error('Failed to save notes:', e);
      }
      setIsSaving(false);
    }, 500);
  }, [storageKey]);

  // Archive current note before creating a new one
  const archiveCurrentNote = useCallback(() => {
    try {
      const currentData = localStorage.getItem(storageKey);
      if (currentData) {
        const parsed = JSON.parse(currentData);
        // Only archive if there's real content (not just default template)
        if (parsed.document && hasNonDefaultContent(parsed.document)) {
          const archiveKey = `${storageKey}_${Date.now()}`;
          localStorage.setItem(archiveKey, currentData);
          return true;
        }
      }
    } catch (e) {
      console.error('Failed to archive note:', e);
    }
    return false;
  }, [storageKey]);

  // Create new note (archives current note first)
  const createNewNote = useCallback(() => {
    // Archive the current note before creating new one
    archiveCurrentNote();

    const newDoc = createEmptyDocument(storageKey);
    setDocument(newDoc);
    setLastSaved(null);

    // Save immediately with new createdDate
    const saveData = {
      document: newDoc,
      createdDate: new Date().toISOString(),
      lastSaved: new Date().toISOString(),
      version: 1,
    };
    localStorage.setItem(storageKey, JSON.stringify(saveData));
  }, [storageKey, archiveCurrentNote]);

  // Clear notes
  const clearDocument = useCallback(() => {
    setDocument(createEmptyDocument(storageKey));
    localStorage.removeItem(storageKey);
    setLastSaved(null);
  }, [storageKey]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const value = {
    document,
    isLoading,
    isSaving,
    lastSaved,
    saveDocument,
    createNewNote,
    clearDocument,
  };

  return (
    <NotepadContext.Provider value={value}>
      {children}
    </NotepadContext.Provider>
  );
}

export function useNotepad() {
  const context = useContext(NotepadContext);
  if (!context) {
    throw new Error('useNotepad must be used within a NotepadProvider');
  }
  return context;
}
