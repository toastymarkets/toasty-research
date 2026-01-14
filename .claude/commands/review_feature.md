---
description: Test and review the functionality and visual layout of a widget or feature.
---

Review and test a widget or feature, providing a structured assessment of functionality and visual design.

## Arguments
- `$ARGUMENTS` - The widget or feature name to review (e.g., "ForecastDiscussion", "LiveStationData")

## Steps

### 1. Locate and Read the Code
1. Search for the component file in `src/components/widgets/` or `src/components/`
2. Read the main component file and any related hooks
3. Check the WidgetRegistry entry if it's a widget

### 2. Code Review
Analyze the code for:
- **Functionality**: What does it do? What features are implemented?
- **Data fetching**: How does it get data? Error handling?
- **User interactions**: Click handlers, hover states, selection behavior
- **Accessibility**: Keyboard navigation, ARIA labels, focus states
- **Edge cases**: Loading states, error states, empty states

### 3. Visual Testing (uses Claude in Chrome)
Use the Claude in Chrome MCP tools for browser automation:
1. First call `mcp__claude-in-chrome__tabs_context_mcp` to get browser context
2. Create a new tab with `mcp__claude-in-chrome__tabs_create_mcp`
3. Navigate to `http://localhost:5173` (or current dev server port) using `mcp__claude-in-chrome__navigate`
4. Navigate to a city dashboard that includes the widget
5. Take a screenshot using `mcp__claude-in-chrome__computer` with action "screenshot"
6. Test interactive elements using `mcp__claude-in-chrome__computer` (click, scroll) or `mcp__claude-in-chrome__find` to locate elements
7. Take additional screenshots of different states (expanded, loading, error)

If Claude in Chrome is not available:
- Fall back to Playwright MCP tools if available
- Or ask the user to share a screenshot
- Or provide instructions to manually test

### 4. Generate Review Report

Provide a structured report with:

```
## Feature Review: [Name]

### Functionality Assessment
- [ ] Core feature works as expected
- [ ] Loading state displays correctly
- [ ] Error state handles failures gracefully
- [ ] Data updates/refreshes properly
- [ ] User interactions work (clicks, hovers, etc.)

### Visual Assessment
- [ ] Matches design system (glassmorphism, colors)
- [ ] Typography is readable and consistent
- [ ] Spacing and layout are balanced
- [ ] Responsive behavior (if applicable)
- [ ] Animations/transitions are smooth

### Code Quality
- [ ] Clean, readable code structure
- [ ] Proper error handling
- [ ] No obvious performance issues
- [ ] Follows project conventions

### Issues Found
1. [Issue description and severity]

### Recommendations
1. [Improvement suggestion]

### Rating: X/10
```

## Notes
- For visual testing, ensure the dev server is running (`npm run dev`)
- The widget should be added to a city dashboard to test in context
- Test with real data when possible (requires network access to NWS/Kalshi APIs)
- Claude in Chrome provides better interaction with the actual browser the user is using
- Use `mcp__claude-in-chrome__read_page` to get accessibility tree for finding elements
- Use `mcp__claude-in-chrome__find` for natural language element queries
