Run production build and verify it succeeds before pushing changes.

This command catches build errors and reports bundle sizes to ensure code is production-ready.

Steps:

1. Run `npm run build` and capture the output
2. If the build fails, report the error and stop
3. Parse the build output to extract chunk sizes
4. List all chunks with their sizes (raw and gzipped)
5. Flag any chunks over 500 KB with a warning
6. Report total bundle size
7. Optionally run `npm run preview` to test the production build locally

Example output format:
```
Build successful!

Chunks:
  index.js         920.50 KB (283.53 KB gzipped)
  vendor-react.js   47.20 KB (15.30 KB gzipped)
  vendor-charts.js 368.00 KB (112.40 KB gzipped)
  vendor-maps.js   152.00 KB (48.20 KB gzipped)

⚠️ Warning: index.js exceeds 500 KB threshold

Total: 1.66 MB (490 KB gzipped)
```
