import { Link } from 'react-router-dom';
import { Users, Layers, CalendarClock, CheckSquare, Calendar, Wrench, Drone, Boxes, User, LogOut, X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import SidebarGroup from './SidebarGroup';
import SidebarLink from './SidebarLink';
import logo from '../assets/logo.png';

export default function Sidebar({ open, onClose }) {
  const { user, signOut } = useAuth();

  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-ink/30 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-line-soft bg-white transition-transform duration-450 ease-emil lg:sticky lg:top-0 lg:h-dvh lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-line-soft px-4">
          <Link to="/" onClick={onClose} className="flex items-center gap-2 text-ink">
            <img src={logo} alt="VespoUAV" className="h-8 w-8 rounded-full object-cover" />
            <span className="text-[15px] font-semibold tracking-tight">VespoUAV</span>
          </Link>
          <button type="button" onClick={onClose} aria-label="Close menu" className="text-ink lg:hidden">
            <X size={20} strokeWidth={1.75} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-3">
          <SidebarGroup label="Community">
            <SidebarLink to="/members" icon={Users} label="Members" onNavigate={onClose} />
            <SidebarLink to="/areas" icon={Layers} label="Areas" onNavigate={onClose} />
            <SidebarLink to="/sessions" icon={CalendarClock} label="Sessions" onNavigate={onClose} />
          </SidebarGroup>

          <SidebarGroup label="Work">
            <SidebarLink to="/tasks" icon={CheckSquare} label="Tasks" onNavigate={onClose} />
            <SidebarLink to="/calendar" icon={Calendar} label="Calendar" onNavigate={onClose} />
            <SidebarLink to="/tools" icon={Wrench} label="Tools" onNavigate={onClose} />
          </SidebarGroup>

          <SidebarGroup label="Drones">
            <SidebarLink to="/" end icon={Drone} label="Drones" onNavigate={onClose} />
            <SidebarLink to="/inventory" icon={Boxes} label="Inventory" onNavigate={onClose} />
          </SidebarGroup>
        </nav>

        <div className="shrink-0 border-t border-line-soft px-3 py-3">
          <div className="flex flex-col gap-0.5">
            <Link
              to="/profile"
              onClick={onClose}
              className="flex items-center gap-2.5 rounded-control px-2.5 py-2 text-[13.5px] font-medium text-ink-secondary transition-colors duration-350 ease-emil hover:bg-surface-soft hover:text-ink"
            >
              <User size={16} strokeWidth={1.75} />
              <span className="truncate">{user?.email}</span>
            </Link>
            <button
              type="button"
              onClick={signOut}
              className="flex items-center gap-2.5 rounded-control px-2.5 py-2 text-[13.5px] font-medium text-ink-secondary transition-colors duration-350 ease-emil hover:bg-surface-soft hover:text-ink"
            >
              <LogOut size={16} strokeWidth={1.75} />
              Log out
            </button>
          </div>
          <p className="mt-2 px-2.5 text-[11px] text-ink-secondary">© {new Date().getFullYear()} VespoUAV</p>
        </div>
      </aside>
    </>
  );
}
