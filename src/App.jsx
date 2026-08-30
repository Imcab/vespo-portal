import { useState } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './hooks/useAuth';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import DroneGallery from './pages/DroneGallery';
import DroneDetail from './pages/DroneDetail';
import Members from './pages/Members';
import Areas from './pages/Areas';
import Tasks from './pages/Tasks';
import CalendarPage from './pages/CalendarPage';
import Tools from './pages/Tools';
import Inventory from './pages/Inventory';
import Profile from './pages/Profile';

function AdminToggle() {
  const { member, adminMode, setAdminMode } = useAuth();
  if (!member?.is_admin) return null;

  return (
    <div className="fixed right-4 top-3 z-40 sm:right-6">
      <button
        type="button"
        onClick={() => setAdminMode((v) => !v)}
        className={`rounded-full px-3.5 py-1.5 text-[12.5px] font-medium tracking-tight shadow-soft-xs transition-colors duration-350 ease-emil ${
          adminMode
            ? 'bg-brown-600 text-white hover:bg-brown-700'
            : 'bg-white text-ink-secondary ring-1 ring-inset ring-line hover:text-ink'
        }`}
      >
        {adminMode ? 'Exit admin mode' : 'Administrator'}
      </button>
    </div>
  );
}

function AppShell() {
  const { session, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-white">
        <div className="skeleton h-8 w-8 animate-shimmer rounded-full" />
      </div>
    );
  }

  if (!session) {
    return <Login />;
  }

  return (
    <div className="flex min-h-dvh bg-white text-ink">
      <AdminToggle />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-line-soft bg-white/80 px-5 backdrop-blur-xl backdrop-saturate-150 lg:hidden">
          <button type="button" onClick={() => setSidebarOpen(true)} aria-label="Open menu" className="text-ink">
            <Menu size={20} strokeWidth={1.75} />
          </button>
          <span className="text-[15px] font-semibold tracking-tight">VespoUAV</span>
        </header>

        <main className="flex-1">
          <Routes>
            <Route path="/" element={<DroneGallery />} />
            <Route path="/drone/:id" element={<DroneDetail />} />
            <Route path="/members" element={<Members />} />
            <Route path="/areas" element={<Areas />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/tools" element={<Tools />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <AppShell />
      </HashRouter>
    </AuthProvider>
  );
}
