/**
 * Workspace Store
 * localStorage-based persistence for multi-city workspaces
 * v2: Grid-based layout with x/y/w/h positions
 */

import { WIDGET_REGISTRY } from '../config/WidgetRegistry';

const STORAGE_KEY = 'toasty_research_workspaces_v2';
const OLD_STORAGE_KEY = 'toasty_research_workspaces_v1';

// Generate unique IDs
const generateId = () => `ws-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

// Default workspace layout with grid positions (6 columns with w=2)
const createDefaultWidgets = (cities) => {
  const widgets = [];
  cities.forEach((citySlug, index) => {
    const config = WIDGET_REGISTRY['live-station-data'] || {};
    const x = (index % 6) * 2; // 0, 2, 4, 6, 8, 10 (six columns)
    const y = Math.floor(index / 6) * (config.defaultH || 5);

    widgets.push({
      id: `live-${citySlug}-${Date.now()}-${index}`,
      widgetId: 'live-station-data',
      citySlug,
      x,
      y,
      w: config.defaultW || 2,
      h: config.defaultH || 5,
      visible: true,
    });
  });
  return widgets;
};

// Migrate old format (column/order/size) to new format (x/y/w/h)
const migrateWorkspace = (oldWorkspace) => {
  if (!oldWorkspace?.widgets) return oldWorkspace;

  // Check if already in new format
  if (oldWorkspace.widgets.length > 0 && oldWorkspace.widgets[0]?.x !== undefined) {
    return oldWorkspace;
  }

  // Group widgets by column
  const col0 = oldWorkspace.widgets.filter(w => w.column === 0).sort((a, b) => a.order - b.order);
  const col1 = oldWorkspace.widgets.filter(w => w.column === 1).sort((a, b) => a.order - b.order);

  const migratedWidgets = [];
  let y0 = 0;
  let y1 = 0;

  col0.forEach(w => {
    const config = WIDGET_REGISTRY[w.widgetId] || {};
    const h = config.defaultH || 5;
    migratedWidgets.push({
      id: w.id,
      widgetId: w.widgetId,
      citySlug: w.citySlug,
      x: 0,
      y: y0,
      w: config.defaultW || 2,
      h,
      visible: w.visible !== false,
    });
    y0 += h;
  });

  col1.forEach(w => {
    const config = WIDGET_REGISTRY[w.widgetId] || {};
    const h = config.defaultH || 5;
    migratedWidgets.push({
      id: w.id,
      widgetId: w.widgetId,
      citySlug: w.citySlug,
      x: 2,
      y: y1,
      w: config.defaultW || 2,
      h,
      visible: w.visible !== false,
    });
    y1 += h;
  });

  return {
    ...oldWorkspace,
    widgets: migratedWidgets,
  };
};

// Find an open position in the grid
const findOpenPosition = (widgets, newW, newH) => {
  const COLS = 12;
  const occupiedCells = new Set();

  widgets.forEach(w => {
    for (let x = w.x; x < w.x + w.w; x++) {
      for (let y = w.y; y < w.y + w.h; y++) {
        occupiedCells.add(`${x},${y}`);
      }
    }
  });

  for (let y = 0; y < 100; y++) {
    for (let x = 0; x <= COLS - newW; x++) {
      let fits = true;
      for (let dx = 0; dx < newW && fits; dx++) {
        for (let dy = 0; dy < newH && fits; dy++) {
          if (occupiedCells.has(`${x + dx},${y + dy}`)) {
            fits = false;
          }
        }
      }
      if (fits) {
        return { x, y };
      }
    }
  }

  const maxY = widgets.reduce((max, w) => Math.max(max, w.y + w.h), 0);
  return { x: 0, y: maxY };
};

// Get all workspaces
export function getWorkspaces() {
  try {
    // Try new format first
    let data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data).workspaces || {};
    }

    // Try to migrate from old format
    const oldData = localStorage.getItem(OLD_STORAGE_KEY);
    if (oldData) {
      const oldWorkspaces = JSON.parse(oldData).workspaces || {};
      const migratedWorkspaces = {};

      Object.entries(oldWorkspaces).forEach(([id, workspace]) => {
        migratedWorkspaces[id] = migrateWorkspace(workspace);
      });

      // Save migrated data
      saveWorkspaces(migratedWorkspaces);
      return migratedWorkspaces;
    }

    return {};
  } catch {
    return {};
  }
}

// Get a single workspace by ID
export function getWorkspace(workspaceId) {
  const workspaces = getWorkspaces();
  return workspaces[workspaceId] || null;
}

// Save all workspaces
function saveWorkspaces(workspaces) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ workspaces }));
  } catch (e) {
    console.error('Failed to save workspaces:', e);
  }
}

// Create a new workspace
export function createWorkspace(name, cities) {
  const id = generateId();
  const workspace = {
    id,
    name,
    cities,
    widgets: createDefaultWidgets(cities),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  const workspaces = getWorkspaces();
  workspaces[id] = workspace;
  saveWorkspaces(workspaces);

  return workspace;
}

// Update a workspace
export function updateWorkspace(workspaceId, updates) {
  const workspaces = getWorkspaces();
  if (!workspaces[workspaceId]) return null;

  workspaces[workspaceId] = {
    ...workspaces[workspaceId],
    ...updates,
    updatedAt: Date.now(),
  };
  saveWorkspaces(workspaces);

  return workspaces[workspaceId];
}

// Update widget layout positions
export function updateWorkspaceLayout(workspaceId, newGridLayout) {
  const workspaces = getWorkspaces();
  const workspace = workspaces[workspaceId];
  if (!workspace) return null;

  const updatedWidgets = workspace.widgets.map(widget => {
    const gridItem = newGridLayout.find(item => item.i === widget.id);
    if (gridItem) {
      return {
        ...widget,
        x: gridItem.x,
        y: gridItem.y,
        w: gridItem.w,
        h: gridItem.h,
      };
    }
    return widget;
  });

  workspace.widgets = updatedWidgets;
  workspace.updatedAt = Date.now();
  saveWorkspaces(workspaces);

  return workspace;
}

// Delete a workspace
export function deleteWorkspace(workspaceId) {
  const workspaces = getWorkspaces();
  if (!workspaces[workspaceId]) return false;

  delete workspaces[workspaceId];
  saveWorkspaces(workspaces);

  return true;
}

// Add a widget to a workspace
export function addWidgetToWorkspace(workspaceId, widgetId, citySlug) {
  const workspaces = getWorkspaces();
  const workspace = workspaces[workspaceId];
  if (!workspace) return null;

  const config = WIDGET_REGISTRY[widgetId] || {};
  const newW = config.defaultW || 2;
  const newH = config.defaultH || 5;
  const position = findOpenPosition(workspace.widgets, newW, newH);

  const newWidget = {
    id: `${widgetId}-${citySlug}-${Date.now()}`,
    widgetId,
    citySlug,
    x: position.x,
    y: position.y,
    w: newW,
    h: newH,
    visible: true,
  };

  workspace.widgets.push(newWidget);
  workspace.updatedAt = Date.now();
  saveWorkspaces(workspaces);

  return newWidget;
}

// Replace a widget in a workspace
export function replaceWidgetInWorkspace(workspaceId, widgetInstanceId, newWidgetId) {
  const workspaces = getWorkspaces();
  const workspace = workspaces[workspaceId];
  if (!workspace) return null;

  const widgetIndex = workspace.widgets.findIndex(w => w.id === widgetInstanceId);
  if (widgetIndex === -1) return null;

  const oldWidget = workspace.widgets[widgetIndex];
  workspace.widgets[widgetIndex] = {
    ...oldWidget,
    id: `${newWidgetId}-${oldWidget.citySlug}-${Date.now()}`,
    widgetId: newWidgetId,
  };

  workspace.updatedAt = Date.now();
  saveWorkspaces(workspaces);

  return workspace.widgets[widgetIndex];
}

// Remove a widget from a workspace
export function removeWidgetFromWorkspace(workspaceId, widgetInstanceId) {
  const workspaces = getWorkspaces();
  const workspace = workspaces[workspaceId];
  if (!workspace) return false;

  workspace.widgets = workspace.widgets.filter(w => w.id !== widgetInstanceId);
  workspace.updatedAt = Date.now();
  saveWorkspaces(workspaces);

  return true;
}

// Get workspace list as array for display
export function getWorkspaceList() {
  const workspaces = getWorkspaces();
  return Object.values(workspaces).sort((a, b) => b.updatedAt - a.updatedAt);
}
