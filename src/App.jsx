import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './hooks/useTheme';
import { SidebarProvider } from './context/SidebarContext';
import { NotesSidebarProvider } from './context/NotesSidebarContext';
import { KalshiMarketsProvider } from './hooks/useAllKalshiMarkets';
import { ToastProvider } from './context/ToastContext';
import DynamicBackground from './components/layout/DynamicBackground';
import GlassSidebar from './components/layout/GlassSidebar';

// Lazy load page components for better initial bundle size
const HomePageMarkets = lazy(() => import('./components/home/HomePageMarkets'));
const CityDashboardNew = lazy(() => import('./components/dashboard/CityDashboardNew'));
const ResearchLogPageNew = lazy(() => import('./components/research/ResearchLogPageNew'));
const ResearchNotePage = lazy(() => import('./components/research/ResearchNotePage'));

// Loading fallback for page transitions
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="w-8 h-8 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
      <KalshiMarketsProvider>
        <SidebarProvider>
          <NotesSidebarProvider>
            <Router>
              {/* Dynamic weather background - changes with time of day */}
              <DynamicBackground animate={true} showCelestial={true} showClouds={true} />

              <div className="min-h-screen text-white relative z-10 overflow-x-hidden w-full max-w-[100vw]">
                <div className="flex w-full">
                  {/* New glass-styled sidebar */}
                  <GlassSidebar />

                  {/* Main content area - offset for sidebar on desktop */}
                  <main className="flex-1 ml-0 md:ml-[19rem] transition-all duration-300 w-full max-w-full overflow-x-hidden">
                    <Suspense fallback={<PageLoader />}>
                      <Routes>
                        <Route path="/" element={<HomePageMarkets />} />
                        <Route path="/research" element={<ResearchLogPageNew />} />
                        <Route path="/research/:noteType/:slug" element={<ResearchNotePage />} />
                        <Route path="/city/:citySlug" element={<CityDashboardNew />} />
                      </Routes>
                    </Suspense>
                  </main>
                </div>
              </div>
            </Router>
          </NotesSidebarProvider>
        </SidebarProvider>
      </KalshiMarketsProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
