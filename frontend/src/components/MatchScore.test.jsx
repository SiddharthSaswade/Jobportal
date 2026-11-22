import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import MatchScore, { matchLabel } from './MatchScore.jsx';

describe('MatchScore', () => {
  it('shows the score and plain-English label in full mode', () => {
    render(<MatchScore match={{ score: 88, explanation: 'Great fit' }} />);

    expect(screen.getByText(/88%/)).toBeInTheDocument();
    expect(screen.getByText(/Strong match/)).toBeInTheDocument();
  });

  it('hides the label in compact mode', () => {
    render(<MatchScore match={{ score: 88 }} compact />);

    expect(screen.getByText(/88%/)).toBeInTheDocument();
    expect(screen.queryByText(/Strong match/)).not.toBeInTheDocument();
  });

  it('renders nothing when there is no numeric score', () => {
    const { container } = render(<MatchScore match={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('labels each score band and clamps out-of-range values', () => {
    expect(matchLabel(80)).toBe('Strong match');
    expect(matchLabel(60)).toBe('Good match');
    expect(matchLabel(40)).toBe('Partial match');
    expect(matchLabel(39)).toBe('Low match');

    render(<MatchScore match={{ score: 250 }} />);
    expect(screen.getByText(/100%/)).toBeInTheDocument();
  });
});
