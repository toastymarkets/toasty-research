import { createContext, useContext, useState, useCallback } from 'react';

const NotesSidebarContext = createContext(null);

export function NotesSidebarProvider({ children }) {
  // Three-state view mode: 'collapsed' | 'sidebar' | 'dashboard'
  const [viewMode, setViewMode] = useState('sidebar');
  const [selectedNoteKey, setSelectedNoteKey] = useState(null);

  // Derived state for backward compatibility
  const isCollapsed = viewMode === 'collapsed';
  const isDashboard = viewMode === 'dashboard';
  const isSidebar = viewMode === 'sidebar';

  // Sidebar toggle (between collapsed and sidebar)
  const toggle = useCallback(() => {
    setViewMode(prev => prev === 'collapsed' ? 'sidebar' : 'collapsed');
  }, []);

  const collapse = useCallback(() => setViewMode('collapsed'), []);
  const expand = useCallback(() => setViewMode('sidebar'), []);

  // Dashboard controls
  const openDashboard = useCallback(() => setViewMode('dashboard'), []);
  const closeDashboard = useCallback(() => setViewMode('sidebar'), []);

  // Note selection for dashboard
  const selectNote = useCallback((key) => setSelectedNoteKey(key), []);
  const clearSelection = useCallback(() => setSelectedNoteKey(null), []);

  return (
    <NotesSidebarContext.Provider value={{
      viewMode,
      isCollapsed,
      isDashboard,
      isSidebar,
      selectedNoteKey,
      toggle,
      collapse,
      expand,
      openDashboard,
      closeDashboard,
      selectNote,
      clearSelection,
    }}>
      {children}
    </NotesSidebarContext.Provider>
  );
}

export function useNotesSidebar() {
  const context = useContext(NotesSidebarContext);
  if (!context) {
    throw new Error('useNotesSidebar must be used within NotesSidebarProvider');
  }
  return context;
}
