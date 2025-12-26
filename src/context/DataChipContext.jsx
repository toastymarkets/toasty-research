import { createContext, useContext, useRef, useCallback } from 'react';

const DataChipContext = createContext(null);

export function DataChipProvider({ children }) {
  const editorRef = useRef(null);

  const insertDataChip = useCallback((chipData) => {
    if (!editorRef.current) {
      console.warn('Editor not available for data chip insertion');
      return;
    }

    editorRef.current.chain()
      .focus()
      .insertContent({
        type: 'dataChip',
        attrs: chipData
      })
      .insertContent(' ')
      .run();
  }, []);

  const value = {
    insertDataChip,
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
      insertDataChip: () => {},
      editorRef: { current: null },
      isAvailable: false,
    };
  }
  return { ...context, isAvailable: true };
}
