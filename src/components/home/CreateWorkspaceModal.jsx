import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Check, Plus } from 'lucide-react';
import { MARKET_CITIES } from '../../config/cities';
import { createWorkspace } from '../../stores/workspaceStore';

export default function CreateWorkspaceModal({ onClose }) {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [selectedCities, setSelectedCities] = useState([]);
  const [error, setError] = useState('');

  const toggleCity = (citySlug) => {
    setSelectedCities(prev =>
      prev.includes(citySlug)
        ? prev.filter(s => s !== citySlug)
        : [...prev, citySlug]
    );
    setError('');
  };

  const handleCreate = () => {
    if (!name.trim()) {
      setError('Please enter a workspace name');
      return;
    }
    if (selectedCities.length < 2) {
      setError('Please select at least 2 cities');
      return;
    }

    const workspace = createWorkspace(name.trim(), selectedCities);
    navigate(`/workspace/${workspace.id}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" style={{ zIndex: 9999 }}>
      <div className="w-full max-w-lg bg-[var(--color-card-bg)] border border-[var(--color-border)] rounded-2xl shadow-2xl overflow-hidden" style={{ zIndex: 10000 }}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
          <h2 className="text-lg font-semibold">Create Workspace</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[var(--color-card-elevated)] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Workspace name */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
              Workspace Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(''); }}
              placeholder="e.g., East Coast Trading"
              className="w-full px-4 py-2.5 bg-[var(--color-card-elevated)] border border-[var(--color-border)] rounded-xl text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500"
            />
          </div>

          {/* City selection */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
              Select Cities <span className="text-[var(--color-text-muted)]">(at least 2)</span>
            </label>
            <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto p-1">
              {MARKET_CITIES.map(city => {
                const isSelected = selectedCities.includes(city.slug);
                return (
                  <button
                    key={city.slug}
                    onClick={() => toggleCity(city.slug)}
                    className={`relative p-3 rounded-xl text-left transition-all ${
                      isSelected
                        ? 'bg-orange-500/20 border-2 border-orange-500'
                        : 'bg-[var(--color-card-elevated)] border-2 border-transparent hover:border-[var(--color-border)]'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-1.5 right-1.5 w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
                        <Check size={10} className="text-white" />
                      </div>
                    )}
                    <div className="font-medium text-sm">{city.name}</div>
                    <div className="text-xs text-[var(--color-text-muted)]">{city.stationId}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected cities summary */}
          {selectedCities.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {selectedCities.map(slug => {
                const city = MARKET_CITIES.find(c => c.slug === slug);
                return (
                  <span
                    key={slug}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-orange-500/20 text-orange-500 rounded-lg text-xs font-medium"
                  >
                    {city?.name}
                    <button
                      onClick={() => toggleCity(slug)}
                      className="hover:text-orange-300"
                    >
                      <X size={12} />
                    </button>
                  </span>
                );
              })}
            </div>
          )}

          {/* Error message */}
          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-[var(--color-border)] bg-[var(--color-card-elevated)]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!name.trim() || selectedCities.length < 2}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-500 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl transition-colors"
          >
            <Plus size={16} />
            Create Workspace
          </button>
        </div>
      </div>
    </div>
  );
}
