import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './hooks/useTheme';
import HomePage from './components/home/HomePage';
import CityDashboard from './components/dashboard/CityDashboard';
import WorkspaceDashboard from './components/dashboard/WorkspaceDashboard';
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
