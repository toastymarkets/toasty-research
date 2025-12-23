import { useState } from 'react';
import { Plus, X, Radio, MapPin, TrendingUp, FileText, Thermometer, ChevronLeft } from 'lucide-react';
import { getAllWidgets, getCategories } from '../../config/WidgetRegistry';
import { CITY_BY_SLUG } from '../../config/cities';

const ICON_MAP = {
  Radio,
  MapPin,
  TrendingUp,
  FileText,
  Thermometer,
};

export default function AddWorkspaceWidgetPanel({ cities, onAddWidget, onClose, isReplacing = false }) {
  const [step, setStep] = useState('widget'); // 'widget' or 'city'
  const [selectedWidget, setSelectedWidget] = useState(null);
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

  const handleWidgetSelect = (widget) => {
    setSelectedWidget(widget);
    setStep('city');
  };

  const handleCitySelect = (citySlug) => {
    onAddWidget(selectedWidget.id, citySlug);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-[var(--color-card-bg)] border border-[var(--color-border)] rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-2">
            {step === 'city' && !isReplacing && (
              <button
                onClick={() => setStep('widget')}
                className="p-1.5 rounded-lg hover:bg-[var(--color-card-elevated)] transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
            )}
            <h2 className="text-lg font-semibold">
              {step === 'widget'
                ? (isReplacing ? 'Replace Widget' : 'Add Widget')
                : 'Select City'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[var(--color-card-elevated)] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {step === 'widget' ? (
          <>
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
                    onClick={() => handleWidgetSelect(widget)}
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
          </>
        ) : (
          <>
            {/* Selected widget info */}
            <div className="p-3 border-b border-[var(--color-border)] bg-[var(--color-card-elevated)]">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-orange-500/20 text-orange-500">
                  {getIcon(selectedWidget?.icon)}
                </div>
                <span className="font-medium text-sm">{selectedWidget?.name}</span>
              </div>
            </div>

            {/* City selection */}
            <div className="p-3 max-h-80 overflow-y-auto">
              <p className="text-sm text-[var(--color-text-muted)] mb-3">
                Select which city's data to display:
              </p>
              <div className="grid gap-2">
                {cities.map(citySlug => {
                  const city = CITY_BY_SLUG[citySlug];
                  if (!city) return null;
                  return (
                    <button
                      key={citySlug}
                      onClick={() => handleCitySelect(citySlug)}
                      className="flex items-center gap-3 p-3 rounded-xl text-left hover:bg-[var(--color-card-elevated)] transition-colors group"
                    >
                      <MapPin size={18} className="text-blue-500" />
                      <div className="flex-1">
                        <div className="font-medium">{city.name}</div>
                        <div className="text-sm text-[var(--color-text-muted)]">{city.stationId}</div>
                      </div>
                      <div className="p-1.5 rounded-lg bg-[var(--color-card-elevated)] text-[var(--color-text-muted)] opacity-0 group-hover:opacity-100 transition-opacity">
                        <Plus size={16} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* Footer */}
        <div className="p-3 border-t border-[var(--color-border)] bg-[var(--color-card-elevated)]">
          <p className="text-xs text-[var(--color-text-muted)] text-center">
            {step === 'widget'
              ? (isReplacing ? 'Click a widget to replace the current one' : 'Click a widget to select it')
              : (isReplacing ? 'Click to confirm replacement' : 'Click a city to add the widget')
            }
          </p>
        </div>
      </div>
    </div>
  );
}
