Analyze app performance and bundle composition to identify optimization opportunities.

This command helps find large dependencies, missing lazy loading, and common performance issues.

Steps:

1. Run `npm run build` and capture chunk sizes from the output
2. Identify the largest chunks and report them
3. Search for performance issues in the codebase:

   a. **Large static imports** - Search for imports of known heavy libraries:
      - `grep -r "import.*from 'html2canvas'" src/`
      - `grep -r "import.*from '@tiptap" src/`
      - `grep -r "import.*from 'recharts'" src/`

   b. **Missing lazy loading** - Check App.jsx for static page imports:
      - Look for direct imports of page components
      - Suggest converting to `React.lazy()`

   c. **Missing memoization** - Search for potential issues:
      - Context providers without useMemo on value prop
      - List components without React.memo
      - `grep -r "const value = {" src/context/`

4. Report findings with file locations and suggested fixes

5. Calculate potential savings from lazy loading heavy dependencies

Example findings:
```
Performance Audit Results:

Bundle Analysis:
  - Main chunk: 941 KB (⚠️ over 500 KB threshold)
  - Largest dependencies: TipTap (6.7 MB), html2canvas (4.4 MB)

Issues Found:
  1. html2canvas imported statically in ChartScreenshotButton.jsx:3
     → Suggest: Dynamic import on capture

  2. Page components not lazy loaded in App.jsx
     → Suggest: Use React.lazy() for HomePageMarkets, CityDashboardNew

  3. Context value not memoized in DashboardContext.jsx:45
     → Suggest: Wrap value object in useMemo

Estimated Savings: ~300-400 KB from lazy loading
```
