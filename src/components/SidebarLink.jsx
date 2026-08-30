import { NavLink } from 'react-router-dom';

export default function SidebarLink({ to, end = false, icon: Icon, label, onNavigate }) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onNavigate}
      className={({ isActive }) =>
        `flex items-center gap-2.5 rounded-control px-2.5 py-2 text-[13.5px] font-medium transition-colors duration-350 ease-emil ${
          isActive ? 'bg-brand-100 text-brown-600' : 'text-ink-secondary hover:bg-surface-soft hover:text-ink'
        }`
      }
    >
      <Icon size={16} strokeWidth={1.75} />
      {label}
    </NavLink>
  );
}
