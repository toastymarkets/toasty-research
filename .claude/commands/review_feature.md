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

### 3. Visual Testing (requires Playwright MCP)
If Playwright MCP is available:
1. Navigate to `http://localhost:5173` using `browser_navigate`
2. Navigate to a city dashboard that includes the widget
3. Take a screenshot using `browser_screenshot`
4. Test interactive elements (hover, click, scroll)
5. Take additional screenshots of different states

If Playwright MCP is not available:
- Ask the user to share a screenshot
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
