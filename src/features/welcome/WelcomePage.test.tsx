import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { WelcomePage } from './WelcomePage';

describe('welcome', () => {
  it('states the promise and offers one start action', () => {
    render(
      <MemoryRouter>
        <WelcomePage />
      </MemoryRouter>,
    );
    expect(screen.getByText('每天 10 分钟')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /开始/ })).toHaveAttribute('href', '/assessment');
    expect(screen.getByRole('link', { name: /先看看怎么练/ })).toHaveAttribute('href', '/home');
  });
});
