# Widget Expansion Pattern Learnings

This document captures the patterns, techniques, and learnings from implementing inline widget expansion for the NWS Discussion widget. Use this as a reference when implementing expansion for other widgets.

## Overview

**Problem:** Modal/overlay patterns create visual disconnection from the dashboard context.

**Solution:** Inline expansion where widgets expand within the grid, displacing other widgets rather than overlaying them.

## Implementation Pattern

### 1. State Management (Parent Dashboard)

```jsx
// In CityDashboardNew.jsx
const [expandedWidget, setExpandedWidget] = useState(null);
const isDiscussionExpanded = expandedWidget === 'discussion';
const handleToggleDiscussion = () => {
  setExpandedWidget(prev => prev === 'discussion' ? null : 'discussion');
};
```

**Key Point:** Use a single `expandedWidget` state that stores the widget name (or `null`). This allows only one widget to be expanded at a time.

### 2. Grid Layout Switching (CSS)

```css
/* Default layout (4 columns) */
.widget-grid-v2 {
  grid-template-areas:
    "models       brackets     map         map"
    "discussion   brackets     map         map"
    "nearby       nearby       alerts      smallstack"
    "pressure     visibility   forecast    rounding";
}

/* Expanded layout - discussion takes 3 columns */
.widget-grid-v2.discussion-expanded {
  grid-template-areas:
    "discussion   discussion   discussion   map"
    "discussion   discussion   discussion   map"
    "nearby       nearby       alerts       smallstack"
    "pressure     visibility   forecast     rounding";
}
```

**Key Points:**
- CSS Grid's `grid-template-areas` provides explicit control over widget placement
- The expanded widget spans multiple areas, displacing others
- Note: `grid-template-areas` doesn't animate smoothly, but content transitions help

### 3. Conditional Widget Rendering

```jsx
{/* Hidden when discussion expanded */}
{!isDiscussionExpanded && (
  <WidgetGridV2.Area area="models">
    <ModelsWidget ... />
  </WidgetGridV2.Area>
)}
```

**Key Point:** Completely remove displaced widgets from the DOM when another widget expands. This is cleaner than CSS hiding and prevents layout issues.

### 4. Dual Render Mode (Widget Component)

```jsx
function NWSDiscussionWidget({ isExpanded, onToggleExpand, ...props }) {
  if (isExpanded) {
    return <ExpandedDiscussionInline onCollapse={onToggleExpand} {...props} />;
  }
  return <CompactDiscussionView onExpand={onToggleExpand} {...props} />;
}
```

**Key Points:**
- Separate compact and expanded views as distinct components or render paths
- Pass `isExpanded` boolean and `onToggleExpand` callback
- Expanded view should include a collapse button

## Files Modified

| File | Changes |
|------|---------|
| `src/components/weather/WidgetGridV2.jsx` | Added `expandedWidget` prop, applies CSS class modifier |
| `src/styles/liquid-glass.css` | Added `.discussion-expanded` grid template with responsive breakpoints |
| `src/components/weather/NWSDiscussionWidget.jsx` | Dual render mode with `ExpandedDiscussionInline` component |
| `src/components/dashboard/CityDashboardNew.jsx` | State management, conditional widget rendering |

## Responsive Considerations

The expanded grid needs different layouts for different screen sizes:

```css
/* Desktop: 4 columns, expansion takes 3 */
@media (min-width: 1024px) {
  .widget-grid-v2.discussion-expanded { ... }
}

/* Tablet: 2 columns, expansion takes full width */
@media (min-width: 640px) and (max-width: 1023px) {
  .widget-grid-v2.discussion-expanded {
    grid-template-areas:
      "discussion   discussion"
      "discussion   discussion"
      ...;
  }
}

/* Mobile: Single column, expansion is just taller */
@media (max-width: 639px) {
  /* Consider full-screen modal on mobile instead */
}
```

## What Worked Well

1. **CSS Grid Areas** - Explicit control over widget placement without complex calculations
2. **Single expansion state** - Simple to manage, prevents multiple widgets expanding
3. **Conditional rendering** - Cleaner than CSS hiding, no layout conflicts
4. **Separate expanded component** - Keeps code organized, expanded view can be complex

## Gotchas & Things to Watch

1. **Grid transitions don't animate** - `grid-template-areas` changes are instant. Use opacity/transform transitions on content to smooth the experience.

2. **Height management** - Expanded widgets may need `min-height` to prevent collapse during data loading:
   ```css
   .widget-grid-v2.discussion-expanded [style*="grid-area: discussion"] {
     min-height: 400px;
   }
   ```

3. **Scroll position** - Large expansions can push content off-screen. Consider scrolling the expanded widget into view.

4. **Mobile experience** - Inline expansion may not work well on small screens. Consider falling back to full-screen modal on mobile.

5. **Data persistence** - The expanded component receives the same data as compact. If data is fetched inside the widget, it persists through expansion/collapse.

## Future Improvements

1. **Reusable hook** - Create `useWidgetExpansion(widgetName)` that returns `{ isExpanded, toggle, expandedWidget }`

2. **Animation sequencing** - Fade out displaced widgets before grid changes, fade in expanded content after

3. **Expansion registry** - Define which widgets can expand and what they displace in a central config

4. **Keyboard support** - ESC to collapse, focus management

## Applying to Other Widgets

To add expansion to another widget (e.g., Weather Map):

1. Define the expanded grid layout in CSS:
   ```css
   .widget-grid-v2.map-expanded { ... }
   ```

2. Update WidgetGridV2 to apply the class:
   ```jsx
   expandedWidget === 'map' && 'map-expanded'
   ```

3. Create expanded view in the widget component

4. Add conditional rendering for displaced widgets in the dashboard

5. Pass `isExpanded` and `onToggleExpand` props to the widget
