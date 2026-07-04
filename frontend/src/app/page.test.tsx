import React from 'react';
import { render, screen } from '@testing-library/react';
import Page from './page';

describe('Dashboard Page', () => {
  it('renders the DCBrain heading and dashboard title', () => {
    render(<Page />);

    expect(screen.getByText('DCBrain')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Dashboard', level: 2 })).toBeInTheDocument();
  });
});
