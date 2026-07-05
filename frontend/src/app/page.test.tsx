import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import Page from './page';

vi.mock('@/components/auth/ProtectedRoute', () => ({
  ProtectedRoute: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('Dashboard Page', () => {
  it('renders the DCBrain heading and dashboard title', () => {
    render(<Page />);

    expect(screen.getByText('DCBrain')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Dashboard', level: 2 })).toBeInTheDocument();
  });
});
