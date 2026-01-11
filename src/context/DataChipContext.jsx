import { createContext, useContext, useRef, useCallback, useState } from 'react';

const DataChipContext = createContext(null);

export function DataChipProvider({ children }) {
  const editorRef = useRef(null);
  const [isEditorReady, setIsEditorReady] = useState(false);

  // Called by NotepadEditor when the TipTap editor is ready
  const registerEditor = useCallback((editor) => {
    editorRef.current = editor;
    setIsEditorReady(!!editor);
  }, []);

  const insertDataChip = useCallback((chipData) => {
    if (!editorRef.current) {
      console.warn('Editor not available for data chip insertion');
      return false;
    }

    editorRef.current.chain()
      .focus()
      .insertContent({
        type: 'dataChip',
        attrs: chipData
      })
      .insertContent(' ')
      .run();

    return true;
  }, []);

  const value = {
    insertDataChip,
    registerEditor,
    isEditorReady,
    // Keep editorRef for backward compatibility
    editorRef,
  };

  return (
    <DataChipContext.Provider value={value}>
      {children}
    </DataChipContext.Provider>
  );
}

export function useDataChip() {
  const context = useContext(DataChipContext);
  // Return a no-op function if context is not available (e.g., in standalone note view)
  if (!context) {
    return {
      insertDataChip: () => false,
      registerEditor: () => {},
      editorRef: { current: null },
      isEditorReady: false,
      isAvailable: false,
    };
  }
  return { ...context, isAvailable: true };
}
