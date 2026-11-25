import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { CompanyFilesPage } from '../../src/features/company-admin/pages/CompanyFilesPage.jsx';
import * as connectionsApi from '../../src/api/v1/connections.api.js';
import * as companyFilesApi from '../../src/api/v1/companyFiles.api.js';

vi.mock('../../src/shared/hooks/useLayoutUser.js', () => ({
  useLayoutUser: () => ({ user: { company_name: 'BrightPath High', role: 'company_admin' } }),
}));

describe('CompanyFilesPage - Connections Section & Dialog', () => {
  const mockFiles = [
    {
      id: 'file-1',
      name: 'Exam Marks',
      slug: 'exam_marks',
      rows: 100,
      columns: [
        { key: 'student_id', label: 'Student ID', hidden: false },
        { key: 'marks', label: 'Marks', hidden: false },
        { key: 'secret_col', label: 'Secret Col', hidden: true },
      ],
    },
    {
      id: 'file-2',
      name: 'Students',
      slug: 'students',
      rows: 50,
      columns: [
        { key: 'student_id', label: 'Student ID', hidden: false },
        { key: 'name', label: 'Name', hidden: false },
        { key: 'fee_status', label: 'Fee Status', hidden: false },
      ],
    },
  ];

  const mockConnections = [
    {
      id: 'conn-1',
      name: 'Exam Marks → Students',
      left: { file_id: 'file-1', file_name: 'Exam Marks', key: 'student_id' },
      right: { file_id: 'file-2', file_name: 'Students', key: 'student_id' },
      alias: 'students',
      match_rate: 0.98,
      status: 'active',
      updated_at: new Date().toISOString(),
    },
    {
      id: 'conn-2',
      name: 'Suggested Connection',
      left: { file_id: 'file-1', file_name: 'Exam Marks', key: 'student_id' },
      right: { file_id: 'file-2', file_name: 'Students', key: 'student_id' },
      alias: 'students',
      match_rate: 0.85,
      status: 'suggested',
      updated_at: new Date().toISOString(),
    },
  ];

  function renderPage() {
    vi.spyOn(companyFilesApi, 'listCompanyFiles').mockResolvedValue({
      summary: { files: 2, total_rows: 150, limit: 10 },
      files: mockFiles,
    });
    vi.spyOn(connectionsApi, 'listConnections').mockResolvedValue({
      connections: mockConnections,
    });

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <CompanyFilesPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );
  }

  it('renders connections section with table, match percentage, and status badges', async () => {
    renderPage();

    expect(await screen.findByRole('heading', { name: 'Connections' })).toBeInTheDocument();
    expect(
      screen.getAllByText('Connect files that share a column so the chatbot can answer questions that use both.').length
    ).toBeGreaterThanOrEqual(1);

    // Verify Active badge and row
    expect(await screen.findByText('Exam Marks → Students')).toBeInTheDocument();
    expect(screen.getAllByText('student_id = student_id').length).toBe(2);
    expect(screen.getByText('98%')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();

    // Verify Suggested row
    expect(screen.getByText('Suggested Connection')).toBeInTheDocument();
    expect(screen.getByText('85%')).toBeInTheDocument();
    expect(screen.getByText('Suggested')).toBeInTheDocument();
  });

  it('renders Accept and Dismiss for suggested connection, and Refresh/Delete for active connection', async () => {
    renderPage();

    await screen.findByText('Exam Marks → Students');

    expect(screen.getByRole('button', { name: 'Accept' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Dismiss' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Refresh' })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Delete' }).length).toBeGreaterThanOrEqual(1);
  });

  it('opens delete confirmation dialog with exact prompt text when Delete is clicked', async () => {
    renderPage();

    await screen.findByText('Exam Marks → Students');
    const deleteBtns = screen.getAllByRole('button', { name: 'Delete' });
    // The last delete button is for the connection row
    fireEvent.click(deleteBtns[deleteBtns.length - 1]);

    expect(
      screen.getByText(
        'Delete this connection? The chatbot will stop answering questions that use both files.'
      )
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Keep connection' })).toBeInTheDocument();
  });

  it('opens Add Connection dialog, excludes hidden columns, checks connection, and handles duplicate error', async () => {
    vi.spyOn(connectionsApi, 'previewConnection').mockResolvedValue({
      ok: false,
      right_unique: false,
      match_rate: 0.5,
      matched: 25,
      left_rows: 50,
      right_rows: 50,
      duplicate_samples: ['dup1', 'dup2'],
      unmatched_samples: ['unmatched1'],
    });

    renderPage();

    await screen.findByText('Exam Marks → Students');
    const addBtn = screen.getByRole('button', { name: 'Add connection' });
    expect(addBtn).not.toBeDisabled();
    fireEvent.click(addBtn);

    expect(screen.getByRole('heading', { name: 'Add connection' })).toBeInTheDocument();
    expect(screen.getByText('The file with many rows, for example Orders')).toBeInTheDocument();
    expect(screen.getByText('The file with one row per value, for example Customers')).toBeInTheDocument();

    // Verify hidden column 'secret_col' is NOT in select options
    expect(screen.queryByRole('option', { name: 'Secret Col' })).not.toBeInTheDocument();

    // Click Check connection
    const checkBtn = screen.getByRole('button', { name: 'Check connection' });
    fireEvent.click(checkBtn);

    // Expect red duplicate error box
    await waitFor(() => {
      expect(
        screen.getByText(/has duplicate values, so it cannot be used as the 'one' side/)
      ).toBeInTheDocument();
    });

    // Save connection should remain disabled
    const saveBtn = screen.getByRole('button', { name: 'Save connection' });
    expect(saveBtn).toBeDisabled();
  });
});
