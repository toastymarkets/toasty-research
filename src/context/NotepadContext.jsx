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

export function NotepadProvider({ storageKey, children }) {
  const [document, setDocument] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastSaved, setLastSaved] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const saveTimeoutRef = useRef(null);

  // Check if 24 hours have passed
  const shouldResetDaily = (createdDate) => {
    if (!createdDate || storageKey !== 'toasty_research_notes_v1_daily_summary') {
      return false;
    }
    const created = new Date(createdDate);
    const now = new Date();
    const hoursDiff = (now - created) / (1000 * 60 * 60);
    return hoursDiff >= 24;
  };

  // Load notes on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);

        // Check if daily note should be reset
        if (shouldResetDaily(parsed.createdDate)) {
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

  // Create new note (manual reset)
  const createNewNote = useCallback(() => {
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
  }, [storageKey]);

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
