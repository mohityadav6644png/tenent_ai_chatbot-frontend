import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ConversationSidebar } from '../../src/features/chat/components/ConversationSidebar.jsx';

const mockUseAuth = vi.fn();

vi.mock('../../src/features/auth/index.js', () => ({
  useAuth: () => mockUseAuth(),
}));

function renderSidebar() {
  return render(
    <MemoryRouter>
      <ConversationSidebar
        conversations={[]}
        activeId={null}
        onSelect={vi.fn()}
        onNewChat={vi.fn()}
      />
    </MemoryRouter>,
  );
}

describe('ConversationSidebar branding', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders dynamic company name and its initial mark for the logged-in user', () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: 'user-1',
        name: 'Tony Stark',
        role: 'employee',
        company_name: 'Stark Industries',
      },
      logout: vi.fn(),
    });

    renderSidebar();

    expect(screen.getByText('Stark Industries')).toBeInTheDocument();
    expect(screen.getByText('S')).toBeInTheDocument();
  });

  it('falls back gracefully when user has no company name', () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: 'user-2',
        name: 'Jane Doe',
        role: 'employee',
      },
      logout: vi.fn(),
    });

    renderSidebar();

    expect(screen.getByText('Company')).toBeInTheDocument();
    expect(screen.getByText('C')).toBeInTheDocument();
  });
});
