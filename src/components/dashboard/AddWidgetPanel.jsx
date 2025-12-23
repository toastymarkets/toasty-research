import { useState } from 'react';
import { Plus, X, Radio, MapPin, TrendingUp, FileText, Thermometer } from 'lucide-react';
import { getAllWidgets, getCategories } from '../../config/WidgetRegistry';

const ICON_MAP = {
  Radio,
  MapPin,
  TrendingUp,
  FileText,
  Thermometer,
};

export default function AddWidgetPanel({ onAddWidget, onClose, isReplacing = false }) {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const allWidgets = getAllWidgets();
  const categories = ['all', ...getCategories()];

  const filteredWidgets = selectedCategory === 'all'
    ? allWidgets
    : allWidgets.filter(w => w.category === selectedCategory);

  const getIcon = (iconName) => {
    const IconComponent = ICON_MAP[iconName];
    return IconComponent ? <IconComponent size={18} /> : null;
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" style={{ zIndex: 9999 }}>
      <div className="w-full max-w-lg bg-[var(--color-card-bg)] border border-[var(--color-border)] rounded-2xl shadow-2xl overflow-hidden" style={{ zIndex: 10000 }}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
          <h2 className="text-lg font-semibold">{isReplacing ? 'Replace Widget' : 'Add Widget'}</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[var(--color-card-elevated)] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Category tabs */}
        <div className="flex gap-1 p-3 border-b border-[var(--color-border)] overflow-x-auto">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-orange-500/20 text-orange-500'
                  : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-card-elevated)]'
              }`}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>

        {/* Widget list */}
        <div className="p-3 max-h-80 overflow-y-auto">
          <div className="grid gap-2">
            {filteredWidgets.map(widget => (
              <button
                key={widget.id}
                onClick={() => {
                  onAddWidget(widget.id);
                  onClose();
                }}
                className="flex items-start gap-3 p-3 rounded-xl text-left hover:bg-[var(--color-card-elevated)] transition-colors group"
              >
                <div className="p-2 rounded-lg bg-[var(--color-card-elevated)] text-orange-500 group-hover:bg-orange-500/20">
                  {getIcon(widget.icon)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-[var(--color-text-primary)]">{widget.name}</div>
                  <div className="text-sm text-[var(--color-text-muted)] line-clamp-2">
                    {widget.description}
                  </div>
                </div>
                <div className="p-1.5 rounded-lg bg-[var(--color-card-elevated)] text-[var(--color-text-muted)] opacity-0 group-hover:opacity-100 transition-opacity">
                  <Plus size={16} />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[var(--color-border)] bg-[var(--color-card-elevated)]">
          <p className="text-xs text-[var(--color-text-muted)] text-center">
            {isReplacing
              ? 'Click a widget to replace the current one'
              : 'Click a widget to add it to your dashboard'
            }
          </p>
        </div>
      </div>
    </div>
  );
}
