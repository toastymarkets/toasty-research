import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  getWorkspace,
  updateWorkspace,
  updateWorkspaceLayout,
  addWidgetToWorkspace,
  removeWidgetFromWorkspace,
  replaceWidgetInWorkspace,
} from '../stores/workspaceStore';
import { WIDGET_REGISTRY, getAllWidgets } from '../config/WidgetRegistry';

const WorkspaceContext = createContext(null);

export function WorkspaceProvider({ workspaceId, children }) {
  const [workspace, setWorkspace] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load workspace on mount
  useEffect(() => {
    const ws = getWorkspace(workspaceId);
    setWorkspace(ws);
    setIsLoading(false);
  }, [workspaceId]);

  // Reload workspace data
  const reload = useCallback(() => {
    const ws = getWorkspace(workspaceId);
    setWorkspace(ws);
  }, [workspaceId]);

  // Handle layout changes from react-grid-layout
  const onLayoutChange = useCallback((newGridLayout) => {
    const updated = updateWorkspaceLayout(workspaceId, newGridLayout);
    if (updated) {
      setWorkspace(updated);
    }
  }, [workspaceId]);

  const addWidget = useCallback((widgetId, citySlug) => {
    const newWidget = addWidgetToWorkspace(workspaceId, widgetId, citySlug);
    if (newWidget) {
      reload();
    }
    return newWidget;
  }, [workspaceId, reload]);

  const removeWidget = useCallback((widgetInstanceId) => {
    const success = removeWidgetFromWorkspace(workspaceId, widgetInstanceId);
    if (success) {
      reload();
    }
    return success;
  }, [workspaceId, reload]);

  const replaceWidget = useCallback((widgetInstanceId, newWidgetId) => {
    const newWidget = replaceWidgetInWorkspace(workspaceId, widgetInstanceId, newWidgetId);
    if (newWidget) {
      reload();
    }
    return newWidget;
  }, [workspaceId, reload]);

  const updateName = useCallback((name) => {
    const updated = updateWorkspace(workspaceId, { name });
    if (updated) {
      reload();
    }
    return updated;
  }, [workspaceId, reload]);

  // Get all visible widgets
  const getWidgets = useCallback(() => {
    if (!workspace) return [];
    return workspace.widgets.filter(w => w.visible);
  }, [workspace]);

  // Get grid layout array for react-grid-layout
  const getGridLayout = useCallback(() => {
    if (!workspace) return [];
    return workspace.widgets
      .filter(w => w.visible)
      .map(w => {
        return {
          i: w.id,
          x: w.x,
          y: w.y,
          w: w.w,
          h: w.h,
          minW: 1,  // Allow widgets to shrink on small screens
          minH: 2,
          static: true,  // Make widgets non-draggable and non-resizable
        };
      });
  }, [workspace]);

  const getAvailableWidgets = useCallback(() => {
    return getAllWidgets();
  }, []);

  const value = {
    workspace,
    isLoading,
    addWidget,
    removeWidget,
    replaceWidget,
    updateName,
    getWidgets,
    getGridLayout,
    getAvailableWidgets,
    onLayoutChange,
    reload,
  };

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
}

export default WorkspaceContext;
