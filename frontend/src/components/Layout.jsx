import { NavLink, Outlet } from 'react-router-dom';
import { ROLES } from '../constants.js';
import { useAuth } from '../context/AuthContext.jsx';
import ThemeToggle from './ThemeToggle.jsx';

const linkClass = ({ isActive }) =>
  `rounded-md px-3 py-2 text-sm font-medium transition-colors ${
    isActive
      ? 'bg-brand text-white'
      : 'text-ink-soft hover:bg-surface-alt hover:text-ink'
  }`;

export default function Layout() {
  const { user, isAuthenticated, logout } = useAuth();

  const handleLogout = () => {
    logout();
    // Full reload guarantees a protected page cannot re-redirect to /login mid-transition.
    window.location.assign('/');
  };

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <header className="sticky top-0 z-10 border-b border-line bg-surface/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <NavLink to="/" className="text-lg font-bold tracking-tight text-ink">
            JobPortal<span className="text-brand">.AI</span>
          </NavLink>

          <nav className="flex flex-wrap items-center gap-1">
            <NavLink to="/" end className={linkClass}>
              Home
            </NavLink>

            {isAuthenticated && (
              <NavLink to="/jobs" className={linkClass}>
                Browse jobs
              </NavLink>
            )}

            {user?.role === ROLES.CANDIDATE && (
              <>
                <NavLink to="/applications/mine" className={linkClass}>
                  My Applications
                </NavLink>
                <NavLink to="/resume" className={linkClass}>
                  My Resume
                </NavLink>
              </>
            )}

            {user?.role === ROLES.RECRUITER && (
              <>
                <NavLink to="/jobs/mine" className={linkClass}>
                  My Jobs
                </NavLink>
                <NavLink to="/jobs/new" className={linkClass}>
                  Post a Job
                </NavLink>
              </>
            )}

            {isAuthenticated && (
              <NavLink to="/profile" className={linkClass}>
                Profile
              </NavLink>
            )}

            {isAuthenticated ? (
              <>
                <span className="ml-2 rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold capitalize text-brand-ink">
                  {user.role}
                </span>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="ml-1 rounded-md border border-line px-3 py-2 text-sm font-medium text-ink-soft transition hover:bg-surface-alt hover:text-ink"
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login" className={linkClass}>
                  Log in
                </NavLink>
                <NavLink to="/register" className={linkClass}>
                  Sign up
                </NavLink>
              </>
            )}

            <span className="ml-1 border-l border-line pl-2">
              <ThemeToggle />
            </span>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
        <Outlet />
      </main>

      <footer className="border-t border-line bg-surface py-5 text-center text-xs text-muted">
        JobPortal · MERN stack portfolio project
      </footer>
    </div>
  );
}
