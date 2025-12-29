import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './hooks/useTheme';
import { SidebarProvider } from './context/SidebarContext';
import { NotesSidebarProvider } from './context/NotesSidebarContext';
import { KalshiMarketsProvider } from './hooks/useAllKalshiMarkets';
import DynamicBackground from './components/layout/DynamicBackground';
import GlassSidebar from './components/layout/GlassSidebar';
import HomePageNew from './components/home/HomePageNew';
import CityDashboardNew from './components/dashboard/CityDashboardNew';
import ResearchLogPageNew from './components/research/ResearchLogPageNew';
import ResearchNotePage from './components/research/ResearchNotePage';

function App() {
  return (
    <ThemeProvider>
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
                    <Routes>
                      <Route path="/" element={<HomePageNew />} />
                      <Route path="/research" element={<ResearchLogPageNew />} />
                      <Route path="/research/:noteType/:slug" element={<ResearchNotePage />} />
                      <Route path="/city/:citySlug" element={<CityDashboardNew />} />
                    </Routes>
                  </main>
                </div>
              </div>
            </Router>
          </NotesSidebarProvider>
        </SidebarProvider>
      </KalshiMarketsProvider>
    </ThemeProvider>
  );
}

export default App;
