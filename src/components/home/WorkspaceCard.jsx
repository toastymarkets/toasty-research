import { Link } from 'react-router-dom';
import { Layout, MapPin } from 'lucide-react';
import { CITY_BY_SLUG } from '../../config/cities';

export default function WorkspaceCard({ workspace }) {
  // Get city names from slugs
  const cityNames = (workspace.cities || [])
    .map(slug => CITY_BY_SLUG[slug]?.name)
    .filter(Boolean);

  const widgetCount = workspace.widgets?.length || 0;

  return (
    <Link
      to={`/workspace/${workspace.id}`}
      className="group block p-5 rounded-2xl bg-[var(--color-card-bg)] border border-[var(--color-border)] hover:border-orange-500/50 hover:shadow-lg transition-all hover:scale-[1.02]"
    >
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
          <Layout className="w-5 h-5 text-orange-500" />
        </div>
        <div>
          <h3 className="font-heading font-semibold">{workspace.name}</h3>
          <p className="text-sm text-[var(--color-text-muted)]">
            {widgetCount} widget{widgetCount !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* City tags */}
      {cityNames.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {cityNames.slice(0, 3).map(name => (
            <span
              key={name}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-[var(--color-card-elevated)] text-xs text-[var(--color-text-secondary)]"
            >
              <MapPin className="w-3 h-3" />
              {name}
            </span>
          ))}
          {cityNames.length > 3 && (
            <span className="px-2 py-1 rounded-full bg-[var(--color-card-elevated)] text-xs text-[var(--color-text-muted)]">
              +{cityNames.length - 3} more
            </span>
          )}
        </div>
      )}

      {/* Description */}
      {workspace.description && (
        <p className="text-sm text-[var(--color-text-secondary)] line-clamp-2">
          {workspace.description}
        </p>
      )}

      {/* View hint */}
      <div className="mt-4 pt-3 border-t border-[var(--color-border)] opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="text-xs text-orange-500 font-medium">
          Open Workspace →
        </span>
      </div>
    </Link>
  );
}
