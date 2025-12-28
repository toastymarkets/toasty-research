import { useState, useEffect, createContext, useContext } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { PanelRightClose, PanelRightOpen } from 'lucide-react';
import { DataChipProvider } from '../../context/DataChipContext';

// Context to signal panel resize to children
const PanelResizeContext = createContext(0);
export const usePanelResize = () => useContext(PanelResizeContext);

// Custom hook for media query
function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    const handler = (e) => setMatches(e.matches);

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

export default function DashboardLayout({
  children,       // The existing GridLayout content
  notepadSlot,    // The notepad component
  storageKey      // Key for localStorage (panel sizes)
}) {
  const [isNotepadOpen, setIsNotepadOpen] = useState(true);
  const [resizeCounter, setResizeCounter] = useState(0);
  const isMobile = useMediaQuery('(max-width: 768px)');

  // Increment counter to signal resize to children
  const handlePanelResize = () => {
    setResizeCounter(n => n + 1);
  };

  // Load notepad open state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`${storageKey}_notepad_open`);
    if (saved !== null) {
      setIsNotepadOpen(saved === 'true');
    }
  }, [storageKey]);

  // Save notepad open state to localStorage
  const toggleNotepad = () => {
    const newState = !isNotepadOpen;
    setIsNotepadOpen(newState);
    localStorage.setItem(`${storageKey}_notepad_open`, String(newState));
  };

  // Mobile layout: full-screen overlay
  if (isMobile) {
    return (
      <DataChipProvider>
        <div className="relative min-h-screen">
          {/* Main content */}
          <div className="h-full">
            {children}
          </div>

          {/* Floating toggle button */}
          <button
            onClick={toggleNotepad}
            className="fixed bottom-24 right-4 z-40 p-3 rounded-full bg-[var(--color-orange-main)] text-white shadow-lg hover:bg-[var(--color-orange-hover)] transition-colors"
            aria-label={isNotepadOpen ? 'Close notepad' : 'Open notepad'}
          >
            {isNotepadOpen ? <PanelRightClose size={24} /> : <PanelRightOpen size={24} />}
          </button>

          {/* Full-screen notepad overlay */}
          {isNotepadOpen && (
            <div className="fixed inset-0 z-50 bg-[var(--color-bg)]">
              <div className="h-full flex flex-col">
                {/* Close button for mobile */}
                <div className="flex justify-end p-2 border-b border-[var(--color-border)]">
                  <button
                    onClick={toggleNotepad}
                    className="p-2 rounded-lg hover:bg-[var(--color-card-elevated)] transition-colors"
                  >
                    <PanelRightClose size={20} />
                  </button>
                </div>
                <div className="flex-1 overflow-hidden">
                  {notepadSlot}
                </div>
              </div>
            </div>
          )}
        </div>
      </DataChipProvider>
    );
  }

  // Desktop layout: split panes
  return (
    <DataChipProvider>
      <div className="h-screen flex">
        <PanelGroup
          direction="horizontal"
          autoSaveId={storageKey}
          onLayout={() => {
            setResizeCounter(n => n + 1);
          }}
        >
          {/* Widgets Panel */}
          <Panel
            defaultSize={isNotepadOpen ? 70 : 100}
            minSize={40}
            onResize={handlePanelResize}
          >
            <div className="h-full overflow-y-auto overflow-x-hidden">
              <PanelResizeContext.Provider value={resizeCounter}>
                {children}
              </PanelResizeContext.Provider>
            </div>
          </Panel>

          {/* Resize Handle */}
          {isNotepadOpen && (
            <PanelResizeHandle className="w-1.5 bg-[var(--color-border)] hover:bg-[var(--color-orange-main)] transition-colors cursor-col-resize group relative">
              <div className="absolute inset-y-0 -left-1 -right-1 group-hover:bg-[var(--color-orange-main)]/10" />
            </PanelResizeHandle>
          )}

          {/* Notepad Panel */}
          {isNotepadOpen && (
            <Panel
              defaultSize={30}
              minSize={25}
              maxSize={60}
              className="overflow-hidden"
            >
              <div className="h-full p-4">
                {notepadSlot}
              </div>
            </Panel>
          )}
        </PanelGroup>

        {/* Toggle Button */}
        <button
          onClick={toggleNotepad}
          className="fixed right-4 top-20 z-30 p-2 rounded-lg bg-[var(--color-card-elevated)] border border-[var(--color-border)] hover:border-[var(--color-orange-main)] transition-colors shadow-sm"
          aria-label={isNotepadOpen ? 'Close notepad' : 'Open notepad'}
          title={isNotepadOpen ? 'Close notepad' : 'Open notepad'}
        >
          {isNotepadOpen ? <PanelRightClose size={18} /> : <PanelRightOpen size={18} />}
        </button>
      </div>
    </DataChipProvider>
  );
}
