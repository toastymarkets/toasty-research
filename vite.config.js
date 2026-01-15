import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxy Kalshi API requests to bypass CORS in development
      // Converts /api/kalshi?path=trade-api/v2/markets&series_ticker=X
      // to https://api.elections.kalshi.com/trade-api/v2/markets?series_ticker=X
      '/api/kalshi': {
        target: 'https://api.elections.kalshi.com',
        changeOrigin: true,
        secure: true,
        rewrite: (fullPath) => {
          // Parse the URL to extract the path query param
          const url = new URL(fullPath, 'http://localhost');
          const apiPath = url.searchParams.get('path');
          url.searchParams.delete('path');

          // Build new path: /trade-api/v2/markets?series_ticker=X
          const remainingParams = url.searchParams.toString();
          return apiPath ? `/${apiPath}${remainingParams ? '?' + remainingParams : ''}` : fullPath;
        },
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-charts': ['recharts'],
          'vendor-maps': ['leaflet', 'react-leaflet'],
        },
      },
    },
    sourcemap: false,
    reportCompressedSize: true,
    chunkSizeWarningLimit: 500,
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'recharts',
      // leaflet and react-leaflet removed - lazy loaded via manual chunks
    ],
  },
})
