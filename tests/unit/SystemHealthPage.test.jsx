import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { listAuditEvents } from '../../src/api/v1/audit.api.js';
import { getPlatformHealth } from '../../src/api/v1/health.api.js';
import { SystemHealthPage } from '../../src/features/platform-admin/pages/SystemHealthPage.jsx';

vi.mock('../../src/api/v1/audit.api.js', () => ({ listAuditEvents: vi.fn() }));
vi.mock('../../src/api/v1/health.api.js', () => ({ getPlatformHealth: vi.fn() }));

const components = [
  { key: 'api', label: 'API', status: 'operational', checked_at: '2026-11-04T10:42:00.000Z' },
  { key: 'database', label: 'Database', status: 'operational', checked_at: '2026-11-04T10:42:00.000Z' },
  { key: 'openai', label: 'Azure OpenAI', status: 'degraded', checked_at: '2026-11-04T10:42:00.000Z' },
  { key: 'cache', label: 'Cache', status: 'operational', checked_at: '2026-11-04T10:42:00.000Z' },
];
const events = [
  { id: 'old', occurred_at: '2026-11-04T09:00:00.000Z', actor: 'System', action: 'Cleanup', target: 'Platform', result: 'logged' },
  { id: 'new', occurred_at: '2026-11-04T10:00:00.000Z', actor: 'Admin', action: 'Suspend', target: 'Northwind', result: 'success' },
  { id: 'retry', occurred_at: '2026-11-04T09:30:00.000Z', actor: 'System', action: 'Check', target: 'Cache', result: 'retry' },
];

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter><SystemHealthPage /></MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('SystemHealthPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getPlatformHealth.mockResolvedValue({ components });
    listAuditEvents.mockResolvedValue({ events });
  });

  it('renders four health cards with operational and degraded badges', async () => {
    renderPage();

    expect(await screen.findByText('Azure OpenAI')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(4);
    expect(screen.getAllByText('Operational')).toHaveLength(3);
    expect(screen.getByText('Degraded')).toBeInTheDocument();
  });

  it('renders audit rows newest first with result badges', async () => {
    renderPage();

    expect(await screen.findByText('Admin')).toBeInTheDocument();
    const table = await screen.findByRole('table');
    const rows = within(table).getAllByRole('row').slice(1);
    expect(rows.map((row) => row.cells[1].textContent)).toEqual(['Admin', 'System', 'System']);
    expect(within(table).getByText('Success')).toBeInTheDocument();
    expect(within(table).getByText('Retry')).toBeInTheDocument();
    expect(within(table).getByText('Logged')).toBeInTheDocument();
    expect(within(table).getAllByTitle(/2026/)).toHaveLength(3);
  });

  it('shows the raw unknown status in a neutral badge', async () => {
    getPlatformHealth.mockResolvedValueOnce({
      components: [{ ...components[0], status: 'maintenance' }],
    });
    renderPage();

    const badge = await screen.findByText('maintenance');
    expect(badge).toHaveClass('status-badge--neutral');
  });

  it('keeps section errors independent and shows an empty audit state', async () => {
    getPlatformHealth.mockRejectedValueOnce(new Error('private health details'));
    listAuditEvents.mockResolvedValueOnce({ events: [] });
    renderPage();

    expect(await screen.findByText('No audit events yet.')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong. Please try again.');
    expect(screen.queryByText('private health details')).not.toBeInTheDocument();
  });

  it('shows an audit error while health cards remain available', async () => {
    listAuditEvents.mockRejectedValueOnce(new Error('private audit details'));
    renderPage();

    expect(await screen.findByText('API')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong. Please try again.');
    expect(screen.queryByText('private audit details')).not.toBeInTheDocument();
  });
});
