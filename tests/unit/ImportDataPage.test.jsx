import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpError, setAuthToken, clearAuthToken } from '../../src/api/httpClient.js';
import * as companyDataApi from '../../src/api/v1/companyData.api.js';
import { buildErrorReportCsv, escapeCsvCell } from '../../src/features/company-admin/services/buildErrorReportCsv.js';
import { ImportDataPage } from '../../src/features/company-admin/pages/ImportDataPage.jsx';
import { RoleRoute } from '../../src/app/guards/RoleRoute.jsx';
import { ROLES } from '../../src/shared/constants/roles.js';

let currentUser = {
  id: 'demo-company-admin',
  name: 'Asha Nair',
  role: 'company_admin',
  company_name: 'Acme Traders',
};

vi.mock('../../src/features/auth/hooks/useAuth.js', () => ({
  useAuth: () => ({
    user: currentUser,
  }),
}));

const mockDatasetsList = [
  {
    key: 'orders',
    label: 'Orders',
    record_label: 'order',
    records: 12400,
    last_updated: '2026-05-01T10:00:00Z',
    status: 'ready',
    required_columns: ['order_id', 'customer_id', 'order_date', 'total_amount', 'status'],
  },
  {
    key: 'customers',
    label: 'Customers',
    record_label: 'customer',
    records: 3200,
    last_updated: '2026-05-01T10:00:00Z',
    status: 'ready',
    required_columns: ['customer_id', 'name', 'email', 'phone', 'city'],
  },
  {
    key: 'products',
    label: 'Products',
    record_label: 'product',
    records: 850,
    last_updated: '2026-05-01T10:00:00Z',
    status: 'ready',
    required_columns: ['product_id', 'name', 'category', 'price', 'stock'],
  },
];

const mockPreviewResponse = {
  total_rows: 9860,
  valid_rows: 9858,
  invalid_rows: 2,
  required_columns: ['order_id', 'customer_id', 'order_date', 'total_amount', 'status'],
  missing_columns: [],
  unknown_columns: [],
  sample_rows: [
    {
      order_id: 'ORD-1001',
      customer_id: 'CUST-001',
      order_date: '2026-05-01',
      total_amount: 12400,
      status: 'completed',
    },
  ],
  errors: [
    { row: 14, column: 'total_amount', reason: 'Must be positive' },
    { row: 89, column: 'order_date', reason: '=CMD("calc")' },
  ],
};

function renderImportDataPage({ initialEntry = '/admin/company-data/add' } = {}) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/admin/company-data/add" element={<ImportDataPage />} />
          <Route path="/admin/company-data" element={<div data-testid="company-data-home">Company Data Home</div>} />
          <Route path="/chat" element={<div data-testid="chat-home">Chat Home</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('ImportDataPage', () => {
  let fetchDatasetsSpy;
  let fetchImportPreviewSpy;
  let importDatasetSpy;
  let downloadDatasetTemplateSpy;

  beforeEach(() => {
    vi.clearAllMocks();
    currentUser = {
      id: 'demo-company-admin',
      name: 'Asha Nair',
      role: 'company_admin',
      company_name: 'Acme Traders',
    };

    fetchDatasetsSpy = vi.spyOn(companyDataApi, 'fetchDatasets').mockResolvedValue(mockDatasetsList);
    fetchImportPreviewSpy = vi.spyOn(companyDataApi, 'fetchImportPreview').mockResolvedValue(mockPreviewResponse);
    importDatasetSpy = vi.spyOn(companyDataApi, 'importDataset').mockResolvedValue({
      import_id: 'imp-1',
      inserted: 9800,
      updated: 58,
      skipped: 2,
      status: 'completed',
    });
    downloadDatasetTemplateSpy = vi.spyOn(companyDataApi, 'downloadDatasetTemplate').mockResolvedValue(new Blob(['']));
  });

  it('preselects the dataset from the URL query parameter', async () => {
    renderImportDataPage({ initialEntry: '/admin/company-data/add?dataset=customers' });

    expect(await screen.findByRole('heading', { level: 1, name: 'Add data' })).toBeInTheDocument();
    await screen.findByText('Customers need these columns in the first row of your file.');

    const select = screen.getByLabelText('Dataset');
    expect(select).toHaveValue('customers');
    expect(screen.getByText('customer_id')).toBeInTheDocument();
  });

  it('side card changes when dataset selection changes', async () => {
    renderImportDataPage();

    await screen.findByText('Orders need these columns in the first row of your file.');

    const select = screen.getByLabelText('Dataset');
    fireEvent.change(select, { target: { value: 'products' } });

    expect(await screen.findByText('Products need these columns in the first row of your file.')).toBeInTheDocument();
    expect(screen.getByText('Use dates like 2026-05-01. Use one row per product. Save the file as CSV (UTF-8).')).toBeInTheDocument();
    expect(screen.getByText('product_id')).toBeInTheDocument();
  });

  it('file selection triggers exactly one preview and shows the file box with rows and size', async () => {
    renderImportDataPage();

    await screen.findByText('Orders need these columns in the first row of your file.');

    const file = new File(['a,b,c'], 'orders_2026.csv', { type: 'text/csv' });
    Object.defineProperty(file, 'size', { value: 1.2 * 1024 * 1024 });

    const input = screen.getByTestId('import-file-input');
    fireEvent.change(input, { target: { files: [file] } });

    expect(fetchImportPreviewSpy).toHaveBeenCalledTimes(1);
    expect(fetchImportPreviewSpy).toHaveBeenCalledWith(
      expect.objectContaining({ dataset: 'orders', file }),
      expect.anything(),
    );

    expect(await screen.findByText('orders_2026.csv')).toBeInTheDocument();
    expect(screen.getByText(/9,860 rows · 1.2 MB/)).toBeInTheDocument();
  });

  it('green summary and error-report link appear only when invalid_rows > 0 and report CSV escapes formula cells', async () => {
    renderImportDataPage();

    await screen.findByText('Orders need these columns in the first row of your file.');
    const file = new File(['csv content'], 'orders.csv', { type: 'text/csv' });
    fireEvent.change(screen.getByTestId('import-file-input'), { target: { files: [file] } });

    const summaryText = await screen.findByText(/9858 rows are ready\. 2 rows have problems/i);
    expect(summaryText).toBeInTheDocument();

    const errorReportBtn = screen.getByRole('button', { name: /Download error report/i });
    expect(errorReportBtn).toBeInTheDocument();

    // Verify CSV formula escaping
    const escapedFormula = escapeCsvCell('=CMD("calc")');
    expect(escapedFormula).toBe(`"'=CMD(""calc"")"`);

    const plusFormula = escapeCsvCell('+123');
    expect(plusFormula).toBe(`"'+123"`);

    const atFormula = escapeCsvCell('@dangerous');
    expect(atFormula).toBe(`"'@dangerous"`);

    const minusFormula = escapeCsvCell('-minus');
    expect(minusFormula).toBe(`"'-minus"`);

    const builtCsv = buildErrorReportCsv(mockPreviewResponse.errors);
    expect(builtCsv).toContain(`"'=CMD(""calc"")"`);
  });

  it('green summary when invalid_rows is 0 does not show download error report link', async () => {
    fetchImportPreviewSpy.mockResolvedValueOnce({
      ...mockPreviewResponse,
      invalid_rows: 0,
      errors: [],
    });

    renderImportDataPage();

    await screen.findByText('Orders need these columns in the first row of your file.');
    const file = new File(['clean content'], 'clean.csv', { type: 'text/csv' });
    fireEvent.change(screen.getByTestId('import-file-input'), { target: { files: [file] } });

    const summaryText = await screen.findByText(/9858 rows are ready\. 0 rows have problems/i);
    expect(summaryText).toBeInTheDocument();

    expect(screen.queryByRole('button', { name: /Download error report/i })).not.toBeInTheDocument();
  });

  it('missing columns show red alert box and disable Import button', async () => {
    fetchImportPreviewSpy.mockResolvedValueOnce({
      ...mockPreviewResponse,
      missing_columns: ['customer_id', 'total_amount'],
      valid_rows: 0,
    });

    renderImportDataPage();

    await screen.findByText('Orders need these columns in the first row of your file.');
    const file = new File(['content'], 'missing.csv', { type: 'text/csv' });
    fireEvent.change(screen.getByTestId('import-file-input'), { target: { files: [file] } });

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Your file is missing these columns: customer_id, total_amount.');

    const importBtn = screen.getByRole('button', { name: 'Import data' });
    expect(importBtn).toBeDisabled();
  });

  it('non-.csv and oversized files are rejected before upload', async () => {
    renderImportDataPage();

    await screen.findByRole('heading', { level: 1, name: 'Add data' });

    // 1. Non-CSV
    const pdfFile = new File(['doc'], 'statement.pdf', { type: 'application/pdf' });
    fireEvent.change(screen.getByTestId('import-file-input'), { target: { files: [pdfFile] } });
    expect(await screen.findByRole('alert')).toHaveTextContent('Please choose a CSV file (.csv).');
    expect(fetchImportPreviewSpy).not.toHaveBeenCalled();

    // 2. Oversized > 5 MB
    const largeFile = new File(['large'], 'large.csv', { type: 'text/csv' });
    Object.defineProperty(largeFile, 'size', { value: 6 * 1024 * 1024 });
    fireEvent.change(screen.getByTestId('import-file-input'), { target: { files: [largeFile] } });
    expect(await screen.findByRole('alert')).toHaveTextContent('File exceeds the 5 MB limit. Please choose a smaller file.');
    expect(fetchImportPreviewSpy).not.toHaveBeenCalled();

    // 3. Empty file
    const emptyFile = new File([], 'empty.csv', { type: 'text/csv' });
    fireEvent.change(screen.getByTestId('import-file-input'), { target: { files: [emptyFile] } });
    expect(await screen.findByRole('alert')).toHaveTextContent('The chosen file is empty. Please choose a non-empty CSV file.');
    expect(fetchImportPreviewSpy).not.toHaveBeenCalled();
  });

  it('upsert mode imports immediately without confirmation', async () => {
    renderImportDataPage();

    await screen.findByText('Orders need these columns in the first row of your file.');
    const file = new File(['content'], 'orders.csv', { type: 'text/csv' });
    fireEvent.change(screen.getByTestId('import-file-input'), { target: { files: [file] } });

    await screen.findByText(/9,860 rows/);

    const importBtn = screen.getByRole('button', { name: 'Import data' });
    await waitFor(() => expect(importBtn).not.toBeDisabled());
    fireEvent.click(importBtn);

    await waitFor(() => {
      expect(importDatasetSpy).toHaveBeenCalled();
      expect(importDatasetSpy.mock.calls[0][0]).toEqual(
        expect.objectContaining({ dataset: 'orders', file, mode: 'upsert' }),
      );
    });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('replace mode asks for confirmation before importing', async () => {
    renderImportDataPage();

    await screen.findByText('Orders need these columns in the first row of your file.');
    const file = new File(['content'], 'orders.csv', { type: 'text/csv' });
    fireEvent.change(screen.getByTestId('import-file-input'), { target: { files: [file] } });

    await screen.findByText(/9,860 rows/);

    const modeSelect = screen.getByLabelText('Import mode');
    fireEvent.change(modeSelect, { target: { value: 'replace' } });

    const importBtn = screen.getByRole('button', { name: 'Import data' });
    await waitFor(() => expect(importBtn).not.toBeDisabled());
    fireEvent.click(importBtn);

    const dialog = await screen.findByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(
      screen.getByText("Your current Orders records will be removed after the new ones are added. This can't be undone."),
    ).toBeInTheDocument();

    // Cancel modal with "Keep existing"
    const cancelModalBtn = screen.getByRole('button', { name: 'Keep existing' });
    fireEvent.click(cancelModalBtn);
    expect(importDatasetSpy).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    // Reopen and confirm with "Replace"
    fireEvent.click(importBtn);
    const replaceModalBtn = screen.getByRole('button', { name: 'Replace' });
    fireEvent.click(replaceModalBtn);

    await waitFor(() => {
      expect(importDatasetSpy).toHaveBeenCalled();
      expect(importDatasetSpy.mock.calls[0][0]).toEqual(
        expect.objectContaining({ dataset: 'orders', file, mode: 'replace' }),
      );
    });
  });

  it('successful import navigates to /admin/company-data with toast state', async () => {
    renderImportDataPage();

    await screen.findByText('Orders need these columns in the first row of your file.');
    const file = new File(['content'], 'orders.csv', { type: 'text/csv' });
    fireEvent.change(screen.getByTestId('import-file-input'), { target: { files: [file] } });

    await screen.findByText(/9,860 rows/);
    fireEvent.click(screen.getByRole('button', { name: 'Import data' }));

    expect(await screen.findByTestId('company-data-home')).toBeInTheDocument();
  });

  it('friendly error mapping for 403, 409, 413, and 429', async () => {
    renderImportDataPage();

    await screen.findByText('Orders need these columns in the first row of your file.');
    const file = new File(['content'], 'orders.csv', { type: 'text/csv' });
    fireEvent.change(screen.getByTestId('import-file-input'), { target: { files: [file] } });

    await screen.findByText(/9,860 rows/);

    // 403
    importDatasetSpy.mockRejectedValueOnce(new HttpError('Forbidden', { status: 403 }));
    fireEvent.click(screen.getByRole('button', { name: 'Import data' }));
    expect(await screen.findByRole('alert')).toHaveTextContent("You don't have access to this page.");

    // 409
    importDatasetSpy.mockRejectedValueOnce(new HttpError('Conflict', { status: 409, code: 'IMPORT_IN_PROGRESS' }));
    fireEvent.click(screen.getByRole('button', { name: 'Import data' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'An import is already in progress for this dataset. Please wait until it completes.',
    );

    // 413
    importDatasetSpy.mockRejectedValueOnce(new HttpError('Payload Too Large', { status: 413 }));
    fireEvent.click(screen.getByRole('button', { name: 'Import data' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'File exceeds the allowed size limit. Please upload a smaller file.',
    );

    // 429
    importDatasetSpy.mockRejectedValueOnce(
      new HttpError('Rate limited', { status: 429, retryAfterSeconds: 45 }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Import data' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Too many requests. Please try again in 45 seconds.',
    );
  });

  it('template download sends Authorization header', async () => {
    setAuthToken('test-jwt-token-xyz');

    const globalFetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('order_id,customer_id\n', { status: 200, headers: { 'Content-Type': 'text/csv' } }),
    );

    renderImportDataPage();

    await screen.findByText('Orders need these columns in the first row of your file.');

    // Restore the spy to test actual companyDataApi.downloadDatasetTemplate
    downloadDatasetTemplateSpy.mockRestore();

    const downloadBtn = screen.getByRole('button', { name: 'Download template' });
    fireEvent.click(downloadBtn);

    await waitFor(() => {
      expect(globalFetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/v1/company/datasets/orders/template'),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-jwt-token-xyz',
          }),
        }),
      );
    });

    globalFetchSpy.mockRestore();
    clearAuthToken();
  });

  it('employees cannot access the company admin route', () => {
    currentUser = { id: 'emp-1', name: 'Employee User', role: 'employee' };

    render(
      <MemoryRouter initialEntries={['/admin/company-data/add']}>
        <Routes>
          <Route element={<RoleRoute allowedRoles={[ROLES.COMPANY_ADMIN]} />}>
            <Route path="/admin/company-data/add" element={<ImportDataPage />} />
          </Route>
          <Route path="/chat" element={<div data-testid="chat-screen">Chat Screen</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByTestId('chat-screen')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Add data' })).not.toBeInTheDocument();
  });

  it('nothing is written to localStorage or sessionStorage during operations', async () => {
    const localSpy = vi.spyOn(Storage.prototype, 'setItem');
    const sessionSpy = vi.spyOn(sessionStorage, 'setItem');

    renderImportDataPage();

    await screen.findByText('Orders need these columns in the first row of your file.');
    const file = new File(['content'], 'orders.csv', { type: 'text/csv' });
    fireEvent.change(screen.getByTestId('import-file-input'), { target: { files: [file] } });

    await screen.findByText(/9,860 rows/);

    expect(localSpy).not.toHaveBeenCalled();
    expect(sessionSpy).not.toHaveBeenCalled();

    localSpy.mockRestore();
    sessionSpy.mockRestore();
  });
});
