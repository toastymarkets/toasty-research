import { createContext, useContext, useState } from 'react';

const NotesSidebarContext = createContext(null);

export function NotesSidebarProvider({ children }) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggle = () => setIsCollapsed(prev => !prev);
  const collapse = () => setIsCollapsed(true);
  const expand = () => setIsCollapsed(false);

  return (
    <NotesSidebarContext.Provider value={{ isCollapsed, toggle, collapse, expand }}>
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
