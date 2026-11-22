import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { ThemeProvider, useTheme } from '../context/ThemeContext.jsx';
import ThemeToggle from './ThemeToggle.jsx';

function Probe() {
  const { theme, isDark } = useTheme();
  return <span data-testid="theme">{`${theme}/${String(isDark)}`}</span>;
}

afterEach(() => {
  document.documentElement.classList.remove('dark');
  document.documentElement.style.colorScheme = '';
});

describe('ThemeToggle', () => {
  it('starts light, toggles to dark, applies the class and saves the choice', async () => {
    render(
      <ThemeProvider>
        <Probe />
        <ThemeToggle />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme')).toHaveTextContent('light/false');

    fireEvent.click(screen.getByRole('button', { name: /switch to dark mode/i }));

    expect(await screen.findByTestId('theme')).toHaveTextContent('dark/true');
    expect(localStorage.getItem('jobportal_theme')).toBe('dark');
    await waitFor(() => expect(document.documentElement).toHaveClass('dark'));
    expect(screen.getByRole('button', { name: /switch to light mode/i })).toBeInTheDocument();
  });

  it('restores a saved dark theme on mount', async () => {
    localStorage.setItem('jobportal_theme', 'dark');

    render(
      <ThemeProvider>
        <Probe />
        <ThemeToggle />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme')).toHaveTextContent('dark/true');
    await waitFor(() => expect(document.documentElement).toHaveClass('dark'));
    expect(document.documentElement.style.colorScheme).toBe('dark');
  });
});
