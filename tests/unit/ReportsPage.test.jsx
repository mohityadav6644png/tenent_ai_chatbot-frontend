import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { listReports, pauseReport, resumeReport } from '../../src/api/v1/reports.api.js';
import { ReportsPage } from '../../src/features/reports/pages/ReportsPage.jsx';

vi.mock('../../src/api/v1/reports.api.js', () => ({
  listReports: vi.fn(),
  pauseReport: vi.fn(),
  resumeReport: vi.fn(),
}));

const initialReports = [
  {
    id: 'monthly',
    name: 'Monthly sales summary',
    schedule: { frequency: 'monthly', day_of_month: 1, time: '09:00' },
    recipients: [
      { id: '1', name: 'Asha Nair' },
      { id: '2', name: 'Ravi Singh' },
      { id: '3', name: 'Meera Shah' },
      { id: '4', name: 'Dev Patel' },
    ],
    status: 'active',
  },
  {
    id: 'stock',
    name: 'Low stock alert',
    schedule: { frequency: 'weekly', weekday: 1, time: '08:00' },
    recipients: [{ id: '5', name: 'Ravi Singh' }],
    status: 'paused',
  },
];
let serverReports;

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter><ReportsPage /></MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('ReportsPage', () => {
  beforeEach(() => {
    serverReports = structuredClone(initialReports);
    listReports.mockImplementation(async () => ({ reports: structuredClone(serverReports) }));
    pauseReport.mockImplementation(async (id) => {
      serverReports = serverReports.map((report) => report.id === id
        ? { ...report, status: 'paused' }
        : report);
      return { id, status: 'paused' };
    });
    resumeReport.mockImplementation(async (id) => {
      serverReports = serverReports.map((report) => report.id === id
        ? { ...report, status: 'active' }
        : report);
      return { id, status: 'active' };
    });
  });

  it('renders report rows, status-specific actions, and shortened recipient names', async () => {
    renderPage();
    await screen.findByText('Monthly sales summary');
    const table = await screen.findByRole('table');
    const rows = within(table).getAllByRole('row').slice(1);

    expect(rows).toHaveLength(2);
    expect(within(rows[0]).getByText('1st of every month, 9:00')).toBeInTheDocument();
    expect(within(rows[0]).getByText('Asha, Ravi, Meera +1 more')).toHaveAttribute(
      'title',
      'Asha Nair, Ravi Singh, Meera Shah, Dev Patel',
    );
    expect(within(rows[0]).getByText('Active')).toBeInTheDocument();
    expect(within(rows[0]).getByRole('button', { name: 'Pause Monthly sales summary' })).toBeInTheDocument();
    expect(within(rows[1]).getByText('Paused')).toBeInTheDocument();
    expect(within(rows[1]).getByRole('button', { name: 'Resume Low stock alert' })).toBeInTheDocument();
  });

  it('pauses and resumes immediately, updating statuses and announcing success', async () => {
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'Pause Monthly sales summary' }));

    expect(await screen.findByText('Report paused')).toHaveAttribute('role', 'status');
    expect(pauseReport.mock.calls[0][0]).toBe('monthly');
    fireEvent.click(screen.getByRole('button', { name: 'Resume Monthly sales summary' }));

    expect(await screen.findByText('Report resumed')).toHaveAttribute('role', 'status');
    expect(resumeReport.mock.calls[0][0]).toBe('monthly');
    await waitFor(() => expect(
      screen.getByRole('button', { name: 'Pause Monthly sales summary' }),
    ).toBeInTheDocument());
  });

  it('rolls back a failed pause and displays a mapped error toast', async () => {
    pauseReport.mockRejectedValueOnce(Object.assign(new Error('private server detail'), {
      code: 'INTERNAL_ERROR',
    }));
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'Pause Monthly sales summary' }));

    expect(await screen.findByText('The request could not be completed. Please try again.'))
      .toHaveAttribute('role', 'status');
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.queryByText('private server detail')).not.toBeInTheDocument();
  });

  it('shows empty and error states', async () => {
    listReports.mockResolvedValueOnce({ reports: [] });
    const { unmount } = renderPage();
    expect(await screen.findByText('No reports yet.')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'New report' })).toHaveLength(2);
    unmount();

    listReports.mockRejectedValueOnce(new Error('private report details'));
    renderPage();
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Something went wrong. Please try again.',
    );
    expect(screen.queryByText('private report details')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });
});
