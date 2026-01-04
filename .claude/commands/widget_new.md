---
description: Create a new widget with boilerplate code and register it in the widget registry.
---

Create a new widget with boilerplate code and register it in the widget registry.

This command scaffolds a new widget component following project patterns.

Steps:

1. Ask for the widget details:
   - Widget name (e.g., "weather-alerts", "market-history")
   - Display name (e.g., "Weather Alerts", "Market History")
   - Category: weather, market, research, or utility
   - Required props: which of citySlug, cityName, cityId, timezone are needed

2. Create the component file at `src/components/widgets/{PascalCaseName}.jsx`:
   ```jsx
   import GlassWidget from '../weather/GlassWidget';
   import { IconName } from 'lucide-react';

   export default function WidgetName({ citySlug, cityName }) {
     return (
       <GlassWidget title="WIDGET TITLE" icon={IconName} size="medium">
         <div className="text-white/70 text-sm">
           Widget content for {cityName}
         </div>
       </GlassWidget>
     );
   }
   ```

3. Add entry to `src/config/WidgetRegistry.js`:
   - Import the new component
   - Add to WIDGETS object with id, name, component, category, requiredProps, defaultSize

4. Report created files and next steps:
   - Component location
   - Registry entry added
   - How to test: Add widget via dashboard Add Widget panel

Example:
```
Created widget: Weather Alerts

Files:
  - src/components/widgets/WeatherAlerts.jsx (new)
  - src/config/WidgetRegistry.js (updated)

To test:
  1. Start dev server: npm run dev
  2. Navigate to a city dashboard
  3. Click "Add Widget" and select "Weather Alerts"
```
