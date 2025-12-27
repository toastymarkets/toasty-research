import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Plus, GripVertical } from 'lucide-react';
import { MARKET_CITIES } from '../../config/cities';
import { getWorkspaceList } from '../../stores/workspaceStore';
import { KalshiMarketsProvider } from '../../hooks/useAllKalshiMarkets.jsx';
import CityCard from './CityCard';
import WorkspaceCard from './WorkspaceCard';
import CreateWorkspaceModal from './CreateWorkspaceModal';
import InteractiveMarketsMap from './InteractiveMarketsMap';
import ResearchNotepad from '../notepad/ResearchNotepad';
import { DataChipProvider } from '../../context/DataChipContext';

export default function HomePage() {
  const [workspaces, setWorkspaces] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [splitPercentage, setSplitPercentage] = useState(70); // Map takes 70% by default
  const [isDragging, setIsDragging] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);
  const containerRef = useRef(null);

  // Load workspaces on mount and when modal closes
  useEffect(() => {
    setWorkspaces(getWorkspaceList());
  }, [showCreateModal]);

  // Track window resize for responsive behavior
  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle resize drag
  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging || !containerRef.current) return;

      const container = containerRef.current;
      const containerRect = container.getBoundingClientRect();
      const containerWidth = containerRect.width;
      const mouseX = e.clientX - containerRect.left;

      // Calculate percentage (clamp between 25% and 65%)
      const percentage = Math.min(Math.max((mouseX / containerWidth) * 100, 25), 65);
      setSplitPercentage(percentage);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.body.classList.add('resizing-cursor');
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    } else {
      document.body.classList.remove('resizing-cursor');
    }

    return () => {
      document.body.classList.remove('resizing-cursor');
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-8">
      {/* Map and Daily Summary Notepad - Side by side on desktop */}
      <section className="mb-12">
        <div
          ref={containerRef}
          className="flex flex-col lg:flex-row gap-0 items-stretch"
        >
          {/* Map */}
          <div
            className="flex flex-col mb-6 lg:mb-0"
            style={{ width: isDesktop ? `${splitPercentage}%` : '100%' }}
          >
            <InteractiveMarketsMap />
          </div>

          {/* Resize Handle - Desktop only */}
          {isDesktop && (
            <div
              className="flex items-center justify-center cursor-col-resize select-none group px-3"
              onMouseDown={handleMouseDown}
            >
              <div className="w-0.5 h-full bg-transparent group-hover:bg-orange-500/30 transition-colors" />
            </div>
          )}

          {/* Daily Summary Notepad */}
          <div
            className="flex flex-col min-h-[400px] lg:min-h-0"
            style={{ width: isDesktop ? `calc(${100 - splitPercentage}% - 24px)` : '100%' }}
          >
            <DataChipProvider>
              <ResearchNotepad storageKey="toasty_research_notes_v1_daily_summary" />
            </DataChipProvider>
          </div>
        </div>
      </section>

      {/* Markets Grid */}
      <KalshiMarketsProvider>
        <section className="mb-12">
          <h2 className="text-xl font-heading font-semibold mb-4">Today's Markets</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {MARKET_CITIES.map(city => (
              <CityCard key={city.id} city={city} />
            ))}
          </div>
        </section>
      </KalshiMarketsProvider>

      {/* Workspaces Grid */}
      <section>
        <h2 className="text-xl font-heading font-semibold mb-4">Your Workspaces</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {/* Create workspace card */}
          <button
            className="group p-5 rounded-2xl border-2 border-dashed border-[var(--color-border)] hover:border-orange-500/50 transition-all hover:bg-orange-500/5 flex flex-col items-center justify-center min-h-[180px]"
            onClick={() => setShowCreateModal(true)}
          >
            <div className="w-12 h-12 rounded-full bg-[var(--color-card-elevated)] group-hover:bg-orange-500/10 flex items-center justify-center mb-3 transition-colors">
              <Plus className="w-6 h-6 text-[var(--color-text-muted)] group-hover:text-orange-500" />
            </div>
            <span className="text-sm font-medium text-[var(--color-text-muted)] group-hover:text-orange-500">
              Create Workspace
            </span>
          </button>

          {/* Existing workspaces */}
          {workspaces.map(workspace => (
            <WorkspaceCard key={workspace.id} workspace={workspace} />
          ))}
        </div>
      </section>

      {/* Create workspace modal */}
      {showCreateModal && (
        <CreateWorkspaceModal onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  );
}
