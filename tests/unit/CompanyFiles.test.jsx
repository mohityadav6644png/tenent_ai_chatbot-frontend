import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpError } from '../../src/api/httpClient.js';
import * as companyFilesApi from '../../src/api/v1/companyFiles.api.js';
import { AddFilePage } from '../../src/features/company-admin/pages/AddFilePage.jsx';
import { CompanyFilesPage } from '../../src/features/company-admin/pages/CompanyFilesPage.jsx';
import { EditFilePage } from '../../src/features/company-admin/pages/EditFilePage.jsx';
import { RoleRoute } from '../../src/app/guards/RoleRoute.jsx';
import { ROLES } from '../../src/shared/constants/roles.js';

let currentUser = {
  id: 'user-admin-1',
  name: 'Asha Verma',
  role: 'company_admin',
  company_name: 'Acme Corp',
};

vi.mock('../../src/features/auth/hooks/useAuth.js', () => ({
  useAuth: () => ({ user: currentUser }),
}));

vi.mock('../../src/shared/hooks/useLayoutUser.js', () => ({
  useLayoutUser: () => ({ user: currentUser, logout: vi.fn() }),
}));

const mockFiles = [
  {
    id: 'file-1',
    name: 'Sales Directory',
    description: 'Quarterly regional sales figures and rep assignments.',
    rows: 1500,
    columns_count: 5,
    hidden_columns_count: 1,
    updated_at: new Date().toISOString(),
    status: 'ready',
    upload_mode: 'replace',
  },
  {
    id: 'file-2',
    name: 'Old Archive',
    description: 'Historical archive data.',
    rows: 400,
    columns_count: 3,
    hidden_columns_count: 0,
    updated_at: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(), // 35 days ago
    status: 'ready',
    upload_mode: 'replace',
  },
  {
    id: 'file-3',
    name: 'Failed File',
    description: 'File that failed processing.',
    rows: 0,
    columns_count: 2,
    hidden_columns_count: 0,
    updated_at: new Date().toISOString(),
    status: 'failed',
    upload_mode: 'append',
  },
];

const mockSummary = {
  files: 3,
  total_rows: 1900,
  last_upload: new Date().toISOString(),
  limit: 10,
};

function renderWithProviders(ui, { route = '/' } = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('Company Files Feature', () => {
  let listSpy;
  let previewSpy;
  let createSpy;
  let getDetailSpy;
  let patchSpy;
  let uploadSpy;
  let deleteSpy;

  beforeEach(() => {
    vi.clearAllMocks();
    currentUser = { id: 'admin-1', name: 'Asha Verma', role: 'company_admin', company_name: 'Acme Corp' };

    listSpy = vi.spyOn(companyFilesApi, 'listCompanyFiles').mockResolvedValue({
      summary: mockSummary,
      files: mockFiles,
    });
    previewSpy = vi.spyOn(companyFilesApi, 'previewCompanyFile').mockResolvedValue({
      filename: 'sample.csv',
      total_rows: 100,
      valid_rows: 98,
      invalid_rows: 2,
      columns: [
        { key: 'region', label: 'Region', type: 'text', example: 'North', suggested_hidden: false },
        { key: 'sales', label: 'Sales', type: 'number', example: 12000, suggested_hidden: false },
        { key: 'phone', label: 'Phone', type: 'text', example: '+919876543210', suggested_hidden: true },
      ],
      sample_rows: [{ region: 'North', sales: 12000, phone: '+919876543210' }],
      errors: [
        { row: 15, column: 'sales', reason: 'Invalid number' },
        { row: 42, column: 'sales', reason: 'Invalid number' },
      ],
      limits: { max_files: 10, max_mb: 5, max_rows: 50000, max_columns: 30 },
    });
    createSpy = vi.spyOn(companyFilesApi, 'createCompanyFile').mockResolvedValue({
      id: 'new-file-id',
      status: 'ready',
      inserted: 98,
      skipped: 2,
    });
    getDetailSpy = vi.spyOn(companyFilesApi, 'getCompanyFile').mockResolvedValue({
      id: 'file-1',
      name: 'Sales Directory',
      slug: 'sales_directory',
      description: 'Quarterly regional sales figures and rep assignments.',
      status: 'ready',
      upload_mode: 'replace',
      row_count: 1500,
      columns: [
        { key: 'region', label: 'Region', type: 'text', example: 'North', meaning: 'Geographic market', hidden: false },
        { key: 'sales', label: 'Sales', type: 'number', example: 12000, meaning: 'Gross revenue', hidden: false },
        { key: 'phone', label: 'Phone', type: 'text', example: '+919876543210', meaning: 'Rep contact', hidden: true },
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    patchSpy = vi.spyOn(companyFilesApi, 'patchCompanyFile').mockResolvedValue({
      id: 'file-1',
      name: 'Updated Sales Directory',
      description: 'Updated description.',
      status: 'ready',
      upload_mode: 'replace',
      row_count: 1500,
      columns: [],
      updated_at: new Date().toISOString(),
    });
    uploadSpy = vi.spyOn(companyFilesApi, 'uploadCompanyFile').mockResolvedValue({
      inserted: 1500,
      skipped: 0,
      errors: [],
      status: 'ready',
    });
    deleteSpy = vi.spyOn(companyFilesApi, 'deleteCompanyFile').mockResolvedValue(undefined);
  });

  // 1. List rows, badges, and actions
  it('renders summary stat cards, table rows, status badges, and actions', async () => {
    renderWithProviders(<CompanyFilesPage />);

    expect(await screen.findByText('Sales Directory')).toBeInTheDocument();
    expect(screen.getByRole('note')).toHaveTextContent('Only Acme Corp can see these files.');
    expect(screen.getByText('3 of 10')).toBeInTheDocument(); // Files stat
    expect(screen.getByText('1,900')).toBeInTheDocument(); // Total rows

    // File rows
    expect(screen.getByText('1 column hidden')).toBeInTheDocument();
    expect(screen.getByText('Ready')).toBeInTheDocument();

    // 30 days old status
    expect(screen.getByText('Needs update after 30 days')).toBeInTheDocument();

    // Actions
    expect(screen.getAllByRole('button', { name: 'Replace file' })).toHaveLength(3);
    expect(screen.getAllByRole('link', { name: 'Edit' })).toHaveLength(3);
    expect(screen.getAllByRole('button', { name: 'Delete' })).toHaveLength(3);
  });

  // 2. Add file disabled at limit
  it('disables Add file button when file limit is reached', async () => {
    listSpy.mockResolvedValueOnce({
      summary: { ...mockSummary, files: 10, limit: 10 },
      files: mockFiles,
    });
    renderWithProviders(<CompanyFilesPage />);

    expect(await screen.findByText('Sales Directory')).toBeInTheDocument();
    const addBtn = screen.getByRole('link', { name: 'Add file' });
    expect(addBtn).toHaveClass('is-disabled');
    expect(addBtn).toHaveAttribute('aria-disabled', 'true');
    expect(addBtn).toHaveAttribute('title', 'File limit reached (10 files maximum)');
  });

  // 3. Delete confirms with dialog
  it('confirms deletion in dialog before calling delete API', async () => {
    renderWithProviders(<CompanyFilesPage />);

    expect(await screen.findByText('Sales Directory')).toBeInTheDocument();
    const deleteBtns = screen.getAllByRole('button', { name: 'Delete' });
    fireEvent.click(deleteBtns[0]); // Click first delete button

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByRole('heading', { name: 'Delete Sales Directory?' })).toBeInTheDocument();
    expect(within(dialog).getByText(/Its 1500 rows will be removed/)).toBeInTheDocument();
    expect(deleteSpy).not.toHaveBeenCalled();

    // Confirm deletion
    fireEvent.click(within(dialog).getByRole('button', { name: 'Delete' }));
    await waitFor(() => {
      expect(deleteSpy).toHaveBeenCalledWith('file-1');
    });
  });

  // 4. Choosing a file calls preview and fills form
  it('choosing a file triggers preview endpoint and prefills file name and columns', async () => {
    renderWithProviders(<AddFilePage />);

    expect(screen.getByRole('heading', { name: 'Add file' })).toBeInTheDocument();

    const file = new File(['col1,col2\nval1,val2'], 'regional_sales.csv', { type: 'text/csv' });
    const fileInput = screen.getByTestId('file-dropzone-input');
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(previewSpy).toHaveBeenCalledWith(file);
    });

    // Prefilled name (without .csv)
    expect(screen.getByLabelText('File name')).toHaveValue('regional_sales');

    // Columns table rendered with preview columns
    expect(await screen.findByText('region')).toBeInTheDocument();
    expect(screen.getByText('sales')).toBeInTheDocument();
    expect(screen.getByText('phone')).toBeInTheDocument();
  });

  // 5. suggested_hidden columns start checked with "Looks personal" tag
  it('suggested_hidden columns start checked with Looks personal tag', async () => {
    renderWithProviders(<AddFilePage />);

    const file = new File(['a,b\n1,2'], 'test.csv', { type: 'text/csv' });
    fireEvent.change(screen.getByTestId('file-dropzone-input'), { target: { files: [file] } });

    await screen.findByText('phone');
    expect(screen.getByText('Looks personal')).toBeInTheDocument();

    const phoneCheckbox = screen.getByLabelText('Hide Phone from the chatbot');
    expect(phoneCheckbox).toBeChecked();

    const salesCheckbox = screen.getByLabelText('Hide Sales from the chatbot');
    expect(salesCheckbox).not.toBeChecked();
  });

  // 6. Import stays disabled until valid
  it('Import file button stays disabled until preview succeeded, valid rows > 0, and fields valid', async () => {
    renderWithProviders(<AddFilePage />);

    const importBtn = screen.getByRole('button', { name: 'Import file' });
    expect(importBtn).toBeDisabled();

    const file = new File(['a,b\n1,2'], 'test.csv', { type: 'text/csv' });
    fireEvent.change(screen.getByTestId('file-dropzone-input'), { target: { files: [file] } });

    await screen.findByText('region');
    // Still disabled because description is empty
    expect(importBtn).toBeDisabled();

    // Enter valid description
    fireEvent.change(screen.getByLabelText('What is in this file?'), {
      target: { value: 'Valid description for testing purposes.' },
    });

    expect(importBtn).not.toBeDisabled();
  });

  // 7. Submitting sends FormData with file and meta carrying meaning and hidden
  it('submitting sends FormData with file and meta carrying meaning and hidden', async () => {
    renderWithProviders(<AddFilePage />);

    const file = new File(['a,b\n1,2'], 'test.csv', { type: 'text/csv' });
    fireEvent.change(screen.getByTestId('file-dropzone-input'), { target: { files: [file] } });

    await screen.findByText('region');

    // Add meaning for region
    fireEvent.change(screen.getByLabelText('Meaning of Region'), {
      target: { value: 'Geographic territory' },
    });

    // Enter description
    fireEvent.change(screen.getByLabelText('What is in this file?'), {
      target: { value: 'Regional sales transactions dataset.' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Import file' }));

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalledTimes(1);
    });

    const callArg = createSpy.mock.calls[0][0];
    expect(callArg.file).toBe(file);
    expect(callArg.meta).toEqual(
      expect.objectContaining({
        name: 'test',
        description: 'Regional sales transactions dataset.',
        upload_mode: 'replace',
        columns: expect.arrayContaining([
          expect.objectContaining({ key: 'region', meaning: 'Geographic territory', hidden: false }),
          expect.objectContaining({ key: 'phone', hidden: true }),
        ]),
      }),
    );
  });

  // 8. 409 FILE_EXISTS displayed under name field
  it('displays 409 FILE_EXISTS error specifically under the file name field', async () => {
    createSpy.mockRejectedValueOnce(new HttpError('Duplicate name', { status: 409, code: 'FILE_EXISTS' }));
    renderWithProviders(<AddFilePage />);

    const file = new File(['a,b\n1,2'], 'test.csv', { type: 'text/csv' });
    fireEvent.change(screen.getByTestId('file-dropzone-input'), { target: { files: [file] } });
    await screen.findByText('region');

    fireEvent.change(screen.getByLabelText('What is in this file?'), {
      target: { value: 'Regional sales transactions dataset.' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Import file' }));

    expect(await screen.findByText('A file with this name already exists.')).toBeInTheDocument();
    // Form and selected file are preserved
    expect(screen.getByLabelText('File name')).toHaveValue('test');
  });

  // 9. Error report download
  it('provides Download error report link when invalid_rows > 0 and creates CSV download', async () => {
    const createUrlSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test');
    const revokeUrlSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

    renderWithProviders(<AddFilePage />);

    const file = new File(['a,b\n1,2'], 'test.csv', { type: 'text/csv' });
    fireEvent.change(screen.getByTestId('file-dropzone-input'), { target: { files: [file] } });

    const downloadBtn = await screen.findByRole('button', { name: 'Download error report' });
    expect(downloadBtn).toBeInTheDocument();

    fireEvent.click(downloadBtn);
    expect(createUrlSpy).toHaveBeenCalled();
    expect(revokeUrlSpy).toHaveBeenCalled();

    createUrlSpy.mockRestore();
    revokeUrlSpy.mockRestore();
  });

  // 10. Edit sends only metadata
  it('EditFilePage prefills detail and submits only metadata without file re-upload', async () => {
    renderWithProviders(
      <Routes>
        <Route path="/admin/company-data/:fileId/edit" element={<EditFilePage />} />
      </Routes>,
      { route: '/admin/company-data/file-1/edit' },
    );

    expect(await screen.findByDisplayValue('Sales Directory')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Quarterly regional sales figures and rep assignments.')).toBeInTheDocument();

    // Modify description
    fireEvent.change(screen.getByLabelText('What is in this file?'), {
      target: { value: 'Updated description for operations.' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => {
      expect(patchSpy).toHaveBeenCalledWith(
        'file-1',
        expect.objectContaining({
          name: 'Sales Directory',
          description: 'Updated description for operations.',
          upload_mode: 'replace',
        }),
      );
    });

    // Confirms NO file upload was made
    expect(uploadSpy).not.toHaveBeenCalled();
    expect(createSpy).not.toHaveBeenCalled();
  });

  // 11. Employees cannot open routes
  it('redirects employees trying to access company files routes', () => {
    currentUser = { id: 'emp-1', name: 'John Doe', role: 'employee' };

    renderWithProviders(
      <Routes>
        <Route element={<RoleRoute allowedRoles={[ROLES.COMPANY_ADMIN]} />}>
          <Route path="/admin/company-data" element={<CompanyFilesPage />} />
        </Route>
        <Route path="/chat" element={<div>Chat Screen</div>} />
      </Routes>,
      { route: '/admin/company-data' },
    );

    expect(screen.getByText('Chat Screen')).toBeInTheDocument();
    expect(screen.queryByText('Company data')).not.toBeInTheDocument();
  });

  // 12. CSRF header and FormData handling in API layer
  it('API functions pass FormData without manual Content-Type header and attach CSRF token', async () => {
    createSpy.mockRestore();

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ id: 'test', status: 'ready', inserted: 5, skipped: 0 }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    // Mock document.cookie with csrf_token
    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: 'csrf_token=test_csrf_token_123; session=xyz',
    });

    const file = new File(['a,b'], 'test.csv', { type: 'text/csv' });
    await companyFilesApi.createCompanyFile({ file, meta: { name: 'test' } });

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/v1/company/files'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'X-CSRF-Token': 'test_csrf_token_123',
        }),
      }),
    );

    // Ensure 'Content-Type' is NOT set manually so browser boundary is preserved
    const headers = fetchSpy.mock.calls[0][1].headers;
    expect(headers['Content-Type']).toBeUndefined();
    // Ensure company_id is never passed in headers
    expect(headers['company_id']).toBeUndefined();
    expect(headers['X-Company-ID']).toBeUndefined();

    fetchSpy.mockRestore();
  });
});
