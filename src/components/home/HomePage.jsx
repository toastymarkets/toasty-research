import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, FileText, ArrowRight } from 'lucide-react';
import { MARKET_CITIES } from '../../config/cities';
import { getWorkspaceList } from '../../stores/workspaceStore';
import { getRecentResearchNotes } from '../../utils/researchLogUtils';
import { KalshiMarketsProvider } from '../../hooks/useAllKalshiMarkets.jsx';
import CityCard from './CityCard';
import WorkspaceCard from './WorkspaceCard';
import CreateWorkspaceModal from './CreateWorkspaceModal';

export default function HomePage() {
  const [workspaces, setWorkspaces] = useState([]);
  const [recentNotes, setRecentNotes] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Load workspaces and research notes on mount and when modal closes
  useEffect(() => {
    setWorkspaces(getWorkspaceList());
    setRecentNotes(getRecentResearchNotes(3));
  }, [showCreateModal]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold mb-2">Weather Research Dashboard</h1>
        <p className="text-[var(--color-text-secondary)]">
          Real-time NWS data and forecast models for weather prediction markets
        </p>
      </div>

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

      {/* Your Research Section */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-heading font-semibold">Your Research</h2>
          <Link
            to="/research"
            className="flex items-center gap-1 text-orange-500 hover:text-orange-600 text-sm font-medium transition-colors"
          >
            View all <ArrowRight size={14} />
          </Link>
        </div>
        {recentNotes.length === 0 ? (
          <div className="card-elevated p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-[var(--color-card-elevated)] mx-auto mb-3 flex items-center justify-center">
              <FileText className="w-6 h-6 text-[var(--color-text-muted)]" />
            </div>
            <p className="text-[var(--color-text-secondary)] mb-3">
              No research notes yet
            </p>
            <p className="text-sm text-[var(--color-text-muted)]">
              Start taking notes on any city dashboard
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentNotes.map(note => (
              <Link
                key={note.id}
                to={`/research/${note.type}/${note.slug}`}
                className="card-elevated p-4 hover:border-orange-500/50 transition-all group"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-medium text-[var(--color-text-primary)] group-hover:text-orange-500 transition-colors line-clamp-1">
                    {note.topic}
                  </h3>
                  <span className="text-xs text-[var(--color-text-muted)] whitespace-nowrap ml-2">
                    {note.lastSaved.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                  <span>{note.location}</span>
                  <span className="text-[var(--color-text-muted)]">•</span>
                  <span className="text-[var(--color-text-muted)]">{note.weatherType}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

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
