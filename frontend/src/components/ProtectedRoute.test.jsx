import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import ProtectedRoute from './ProtectedRoute.jsx';

vi.mock('../context/AuthContext.jsx', () => ({ useAuth: vi.fn() }));

function renderGuard(user, loading = false) {
  useAuth.mockReturnValue({ user, loading });

  return render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <Routes>
        <Route element={<ProtectedRoute roles={['recruiter']} />}>
          <Route path="/dashboard" element={<div>Secret dashboard</div>} />
        </Route>
        <Route path="/login" element={<div>Login page</div>} />
        <Route path="/" element={<div>Home page</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('ProtectedRoute', () => {
  it('renders the protected page for an allowed role', () => {
    renderGuard({ role: 'recruiter' });
    expect(screen.getByText('Secret dashboard')).toBeInTheDocument();
  });

  it('redirects a wrong role to home', () => {
    renderGuard({ role: 'candidate' });
    expect(screen.getByText('Home page')).toBeInTheDocument();
    expect(screen.queryByText('Secret dashboard')).not.toBeInTheDocument();
  });

  it('redirects an unauthenticated visitor to login', () => {
    renderGuard(null);
    expect(screen.getByText('Login page')).toBeInTheDocument();
  });

  it('shows a loading state until the session is restored', () => {
    renderGuard({ role: 'recruiter' }, true);
    expect(screen.getByText('Checking your session…')).toBeInTheDocument();
    expect(screen.queryByText('Secret dashboard')).not.toBeInTheDocument();
  });
});
