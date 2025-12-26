import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './hooks/useTheme';
import HomePage from './components/home/HomePage';
import CityDashboard from './components/dashboard/CityDashboard';
import WorkspaceDashboard from './components/dashboard/WorkspaceDashboard';
import ResearchLogPage from './components/research/ResearchLogPage';
import ResearchNotePage from './components/research/ResearchNotePage';
import NavBar from './components/layout/NavBar';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text-primary)]">
          <NavBar />
          <main>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/research" element={<ResearchLogPage />} />
              <Route path="/research/:noteType/:slug" element={<ResearchNotePage />} />
              <Route path="/city/:citySlug" element={<CityDashboard />} />
              <Route path="/workspace/:workspaceId" element={<WorkspaceDashboard />} />
            </Routes>
          </main>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
