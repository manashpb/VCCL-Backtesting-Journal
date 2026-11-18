import { Outlet, NavLink } from 'react-router-dom';
import { LayoutDashboard, BookOpen, Settings, Target, Layers, CalendarDays, BarChart3 } from 'lucide-react';

const navItems = [
  { to: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { to: '/strategies', label: 'Strategies', icon: Target },
  { to: '/batches', label: 'Test Batches', icon: Layers },
  { to: '/sessions', label: 'Test Workspace', icon: CalendarDays },
  { to: '/results', label: 'Results', icon: BarChart3 },
  { to: '/trades', label: 'Trade Log', icon: BookOpen },
  { to: '/configuration', label: 'Configuration', icon: Settings },
];

export default function Layout() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="logo">BJ</div>
          <h1>Backtesting Journal</h1>
        </div>
        <nav className="nav">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink aria-label={label} title={label} key={to} to={to} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">Historical tests · Separate results</div>
      </aside>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
