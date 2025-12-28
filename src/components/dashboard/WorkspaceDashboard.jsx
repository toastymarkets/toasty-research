import { useState, useRef, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import GridLayout from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { WorkspaceProvider, useWorkspace } from '../../context/WorkspaceContext';
import { CITY_BY_SLUG } from '../../config/cities';
import { deleteWorkspace } from '../../stores/workspaceStore';
import WidgetRenderer from './WidgetRenderer';
import AddWorkspaceWidgetPanel from './AddWorkspaceWidgetPanel';
import DashboardLayout, { usePanelResize } from './DashboardLayout';
import ResearchNotepad from '../notepad/ResearchNotepad';
import ConfirmModal from '../ui/ConfirmModal';

// Hook to measure container width with dynamic updates
function useContainerWidth(ref, resizeSignal) {
  const [width, setWidth] = useState(null);

  // Re-measure when resize signal changes
  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const measureWidth = () => {
      const newWidth = element.offsetWidth;
      if (newWidth > 0) {
        setWidth(newWidth);
      }
    };

    const timeoutId = setTimeout(measureWidth, 16);
    return () => clearTimeout(timeoutId);
  }, [resizeSignal]);

  // Initial measurement with delay and ResizeObserver
  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const measureWidth = () => {
      const newWidth = element.offsetWidth;
      if (newWidth > 0) {
        setWidth(newWidth);
      }
    };

    const initialTimeout = setTimeout(measureWidth, 100);

    const resizeObserver = new ResizeObserver(() => {
      measureWidth();
    });
    resizeObserver.observe(element);

    return () => {
      clearTimeout(initialTimeout);
      resizeObserver.disconnect();
    };
  }, []);

  return width || ref.current?.offsetWidth || 800;
}

function WorkspaceDashboardContent() {
  const navigate = useNavigate();
  const [showAddWidget, setShowAddWidget] = useState(false);
  const [replaceWidgetId, setReplaceWidgetId] = useState(null);
  const [replaceWidgetCity, setReplaceWidgetCity] = useState(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const containerRef = useRef(null);
  const resizeSignal = usePanelResize();
  const width = useContainerWidth(containerRef, resizeSignal);

  const {
    workspace,
    isLoading,
    addWidget,
    removeWidget,
    replaceWidget,
    updateName,
    getWidgets,
    getGridLayout,
    onLayoutChange,
  } = useWorkspace();

  const handleAddWidget = (widgetId, citySlug) => {
    if (replaceWidgetId) {
      replaceWidget(replaceWidgetId, widgetId);
      setReplaceWidgetId(null);
      setReplaceWidgetCity(null);
    } else {
      addWidget(widgetId, citySlug);
    }
    setShowAddWidget(false);
  };

  const handleReplaceWidget = (instanceId, citySlug) => {
    setReplaceWidgetId(instanceId);
    setReplaceWidgetCity(citySlug);
    setShowAddWidget(true);
  };

  const openAddWidget = () => {
    setReplaceWidgetId(null);
    setReplaceWidgetCity(null);
    setShowAddWidget(true);
  };

  const startEditingName = () => {
    setEditedName(workspace.name);
    setIsEditingName(true);
  };

  const saveName = () => {
    if (editedName.trim()) {
      updateName(editedName.trim());
    }
    setIsEditingName(false);
  };

  const handleDelete = () => {
    deleteWorkspace(workspace.id);
    navigate('/');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-8 w-8 border-2 border-orange-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Workspace not found</h1>
          <Link to="/" className="text-orange-500 hover:underline">
            ← Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const widgets = getWidgets();
  const gridLayout = getGridLayout();

  // Get city names for display
  const cityNames = workspace.cities.map(slug => CITY_BY_SLUG[slug]?.name).filter(Boolean);

  const notepadStorageKey = `toasty_research_notes_v1_workspace_${workspace.id}`;

  return (
    <DashboardLayout
      storageKey={`toasty_workspace_layout_${workspace.id}`}
      notepadSlot={<ResearchNotepad storageKey={notepadStorageKey} />}
    >
      <div className="w-full px-4 sm:px-6 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="p-2 rounded-lg hover:bg-[var(--color-card-elevated)] transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              {isEditingName ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    className="text-2xl font-heading font-bold bg-transparent border-b-2 border-orange-500 outline-none"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveName();
                      if (e.key === 'Escape') setIsEditingName(false);
                    }}
                  />
                  <button
                    onClick={saveName}
                    className="p-1.5 rounded-lg hover:bg-green-500/20 text-green-500"
                  >
                    <Check size={16} />
                  </button>
                  <button
                    onClick={() => setIsEditingName(false)}
                    className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-500"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-heading font-bold">{workspace.name}</h1>
                  <button
                    onClick={startEditingName}
                    className="p-1.5 rounded-lg hover:bg-[var(--color-card-elevated)] text-[var(--color-text-muted)]"
                  >
                    <Edit2 size={14} />
                  </button>
                </div>
              )}
              <p className="text-sm text-[var(--color-text-muted)]">
                {cityNames.join(' • ')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={openAddWidget}
              className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-orange-500 hover:bg-orange-600 text-white transition-colors"
            >
              <Plus size={16} />
              <span className="hidden sm:inline">Add Widget</span>
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-red-500/10 text-red-500 transition-colors"
            >
              <Trash2 size={16} />
              <span className="hidden sm:inline">Delete</span>
            </button>
          </div>
        </div>

        {/* Dashboard grid */}
        <div ref={containerRef} className="dashboard-grid">
          <GridLayout
            className="layout"
            layout={gridLayout}
            cols={12}
            rowHeight={80}
            width={width || 1200}
            isDraggable={false}
            isResizable={false}
            margin={[12, 12]}
            containerPadding={[0, 0]}
            useCSSTransforms={true}
            compactType="vertical"
          >
            {widgets.map(widget => (
              <div key={widget.id} className="widget-grid-item relative">
                {/* City badge */}
                <div className="absolute top-10 left-3 z-10 px-2 py-0.5 bg-blue-500/20 text-blue-500 text-xs font-medium rounded-full">
                  {CITY_BY_SLUG[widget.citySlug]?.name || widget.citySlug}
                </div>
                <WidgetRenderer
                  widgetInstance={widget}
                  citySlug={widget.citySlug}
                  onRemove={removeWidget}
                  onReplace={(id) => handleReplaceWidget(id, widget.citySlug)}
                />
              </div>
            ))}
          </GridLayout>
        </div>
      </div>

      {/* Add/Replace widget modal */}
      {showAddWidget && (
        <AddWorkspaceWidgetPanel
          cities={replaceWidgetCity ? [replaceWidgetCity] : workspace.cities}
          onAddWidget={handleAddWidget}
          onClose={() => {
            setShowAddWidget(false);
            setReplaceWidgetId(null);
            setReplaceWidgetCity(null);
          }}
          isReplacing={!!replaceWidgetId}
        />
      )}

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <ConfirmModal
          title="Delete Workspace?"
          message={`Are you sure you want to delete "${workspace.name}"? This action cannot be undone.`}
          confirmLabel="Delete"
          variant="delete"
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </DashboardLayout>
  );
}

export default function WorkspaceDashboard() {
  const { workspaceId } = useParams();

  return (
    <WorkspaceProvider workspaceId={workspaceId}>
      <WorkspaceDashboardContent />
    </WorkspaceProvider>
  );
}
