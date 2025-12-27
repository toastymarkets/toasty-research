import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { MARKET_CITIES } from '../../config/cities';
import { getWorkspaceList } from '../../stores/workspaceStore';
import { KalshiMarketsProvider } from '../../hooks/useAllKalshiMarkets.jsx';
import CityCard from './CityCard';
import WorkspaceCard from './WorkspaceCard';
import CreateWorkspaceModal from './CreateWorkspaceModal';
import InteractiveMarketsMap from './InteractiveMarketsMap';
import ResearchNotepad from '../notepad/ResearchNotepad';
import { NotepadProvider } from '../../context/NotepadContext';
import { DataChipProvider } from '../../context/DataChipContext';

export default function HomePage() {
  const [workspaces, setWorkspaces] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Load workspaces on mount and when modal closes
  useEffect(() => {
    setWorkspaces(getWorkspaceList());
  }, [showCreateModal]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-8">
      {/* Map and Daily Summary Notepad - Side by side on desktop */}
      <section className="mb-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Map */}
          <div>
            <InteractiveMarketsMap />
          </div>

          {/* Daily Summary Notepad */}
          <div className="h-[450px] md:h-[400px] sm:h-[350px]">
            <DataChipProvider>
              <NotepadProvider storageKey="toasty_research_notes_v1_daily_summary">
                <ResearchNotepad storageKey="toasty_research_notes_v1_daily_summary" />
              </NotepadProvider>
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
