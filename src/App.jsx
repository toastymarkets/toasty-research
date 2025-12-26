import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './hooks/useTheme';
import { SidebarProvider } from './context/SidebarContext';
import HomePage from './components/home/HomePage';
import CityDashboard from './components/dashboard/CityDashboard';
import WorkspaceDashboard from './components/dashboard/WorkspaceDashboard';
import ResearchLogPage from './components/research/ResearchLogPage';
import ResearchNotePage from './components/research/ResearchNotePage';
import NavBar from './components/layout/NavBar';
import Sidebar from './components/layout/Sidebar';

function App() {
  return (
    <ThemeProvider>
      <SidebarProvider>
        <Router>
          <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text-primary)]">
            <NavBar />
            <div className="flex">
              <Sidebar />
              <main className="flex-1 ml-0 md:ml-60 transition-all duration-300">
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/research" element={<ResearchLogPage />} />
                  <Route path="/research/:noteType/:slug" element={<ResearchNotePage />} />
                  <Route path="/city/:citySlug" element={<CityDashboard />} />
                  <Route path="/workspace/:workspaceId" element={<WorkspaceDashboard />} />
                </Routes>
              </main>
            </div>
          </div>
        </Router>
      </SidebarProvider>
    </ThemeProvider>
  );
}

export default App;
