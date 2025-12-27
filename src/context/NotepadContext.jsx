import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

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

  // Default for other notepads (city/workspace)
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

  // Load notes on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        setDocument(parsed.document);
        setLastSaved(parsed.lastSaved ? new Date(parsed.lastSaved) : null);
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
        const saveData = {
          document: newDoc,
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
