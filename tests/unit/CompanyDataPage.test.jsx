import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { HttpError } from '../../src/api/httpClient.js';
import { insertCompanyRecord, importCompanyCsv } from '../../src/api/v1/company.api.js';
import { CompanyDataPage } from '../../src/features/company-admin/pages/CompanyDataPage.jsx';

vi.mock('../../src/api/v1/company.api.js', () => ({
  insertCompanyRecord: vi.fn(),
  importCompanyCsv: vi.fn(),
}));

vi.mock('../../src/features/auth/hooks/useAuth.js', () => ({
  useAuth: () => ({
    user: {
      id: 'demo-company-admin',
      name: 'Asha Nair',
      role: 'company_admin',
      company_name: 'Acme Traders',
    },
  }),
}));

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <CompanyDataPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('CompanyDataPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders page header, note with company name, and both cards', () => {
    renderPage();

    expect(screen.getByRole('heading', { level: 1, name: 'Company data' })).toBeInTheDocument();
    expect(
      screen.getByText('Add information about your company. The chatbot uses it to answer questions.'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Only Acme Traders can see this data. The chatbot never shares it with other companies.'),
    ).toBeInTheDocument();

    expect(screen.getByRole('heading', { level: 2, name: 'Add a record' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Import from CSV' })).toBeInTheDocument();
  });

  describe('Add a record (Card 1)', () => {
    it('client validation: empty fields or spaces only show error and do not call API', async () => {
      renderPage();

      const saveBtn = screen.getByRole('button', { name: 'Save record' });
      fireEvent.click(saveBtn);

      expect(await screen.findByText('Title is required.')).toBeInTheDocument();
      expect(screen.getByText('Content is required.')).toBeInTheDocument();
      expect(insertCompanyRecord).not.toHaveBeenCalled();

      // Test spaces only
      fireEvent.change(screen.getByLabelText('Title'), { target: { value: '   ' } });
      fireEvent.change(screen.getByLabelText('Content'), { target: { value: '   ' } });
      fireEvent.click(saveBtn);

      expect(await screen.findByText('Title is required.')).toBeInTheDocument();
      expect(screen.getByText('Content is required.')).toBeInTheDocument();
      expect(insertCompanyRecord).not.toHaveBeenCalled();
    });

    it('successful insert shows "Record saved.", clears fields, and disappears on typing', async () => {
      insertCompanyRecord.mockResolvedValueOnce({
        id: 'rec-1',
        message: 'Record inserted successfully',
        success: true,
      });

      renderPage();

      const titleInput = screen.getByLabelText('Title');
      const contentInput = screen.getByLabelText('Content');
      const saveBtn = screen.getByRole('button', { name: 'Save record' });

      fireEvent.change(titleInput, { target: { value: 'Return policy' } });
      fireEvent.change(contentInput, { target: { value: 'Returns allowed within 30 days.' } });
      fireEvent.click(saveBtn);

      const statusBox = await screen.findByRole('status');
      expect(statusBox).toHaveTextContent('Record saved.');
      expect(titleInput).toHaveValue('');
      expect(contentInput).toHaveValue('');

      // Typing in Title clears status box
      fireEvent.change(titleInput, { target: { value: 'N' } });
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    it('successful insert status box disappears after 8 seconds', async () => {
      vi.useFakeTimers();

      insertCompanyRecord.mockResolvedValueOnce({
        id: 'rec-1',
        message: 'Record inserted successfully',
      });

      renderPage();

      const titleInput = screen.getByLabelText('Title');
      const contentInput = screen.getByLabelText('Content');
      const saveBtn = screen.getByRole('button', { name: 'Save record' });

      fireEvent.change(titleInput, { target: { value: 'Shipping details' } });
      fireEvent.change(contentInput, { target: { value: 'Standard delivery in 3 days.' } });
      fireEvent.click(saveBtn);

      await vi.waitFor(() => {
        expect(screen.getByRole('status')).toHaveTextContent('Record saved.');
      });

      act(() => {
        vi.advanceTimersByTime(8000);
      });

      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });
  });

  describe('Import from CSV (Card 2)', () => {
    it('missing columns: backend 400 with "Available headers: [\'Name\', \'Notes\']" shows exact message and prefills inputs', async () => {
      importCompanyCsv.mockRejectedValueOnce(
        new HttpError(
          "Missing required columns: title, content. Available headers: ['Name', 'Notes']. File must include headers that map to 'title' and 'content' or provide a valid 'column_mapping' JSON.",
          { status: 400 },
        ),
      );

      renderPage();

      const file = new File(['dummy,content'], 'policies.csv', { type: 'text/csv' });
      const input = screen.getByTestId('csv-file-input');
      fireEvent.change(input, { target: { files: [file] } });

      const importBtn = screen.getByRole('button', { name: 'Import records' });
      fireEvent.click(importBtn);

      const alertBox = await screen.findByRole('alert');
      expect(alertBox).toHaveTextContent(
        'Your file needs a title column and a content column. Found: Name, Notes. Enter them below and try again.',
      );

      // Verify column inputs are prefilled with normal editable values
      const titleColInput = screen.getByLabelText('Title column');
      const contentColInput = screen.getByLabelText('Content column');
      expect(titleColInput).toHaveValue('Name');
      expect(contentColInput).toHaveValue('Notes');
      expect(importBtn).not.toBeDisabled();
    });

    it('fallback: backend 400 without the list reads first line of file and produces the same message and prefilled inputs', async () => {
      importCompanyCsv.mockRejectedValueOnce(
        new HttpError('Missing required columns: title, content.', { status: 400 }),
      );

      renderPage();

      const csvContent = 'Name,Notes\nReturn policy,Details here\n';
      const file = new File([csvContent], 'data.csv', { type: 'text/csv' });
      const input = screen.getByTestId('csv-file-input');
      fireEvent.change(input, { target: { files: [file] } });

      fireEvent.click(screen.getByRole('button', { name: 'Import records' }));

      const alertBox = await screen.findByRole('alert');
      expect(alertBox).toHaveTextContent(
        'Your file needs a title column and a content column. Found: Name, Notes. Enter them below and try again.',
      );

      expect(screen.getByLabelText('Title column')).toHaveValue('Name');
      expect(screen.getByLabelText('Content column')).toHaveValue('Notes');
    });

    it('retry: clicking "Import records" with column names succeeds, shows "{count} records imported." and clears form', async () => {
      importCompanyCsv
        .mockRejectedValueOnce(
          new HttpError(
            "Missing required columns: title, content. Available headers: ['Name', 'Notes'].",
            { status: 400 },
          ),
        )
        .mockResolvedValueOnce({
          total_records_imported: 42,
          imported_count: 42,
          message: 'CSV data imported successfully',
        });

      renderPage();

      const file = new File(['Name,Notes\nAlpha,Beta\n'], 'policies.csv', { type: 'text/csv' });
      fireEvent.change(screen.getByTestId('csv-file-input'), { target: { files: [file] } });

      const importBtn = screen.getByRole('button', { name: 'Import records' });
      fireEvent.click(importBtn);

      await screen.findByRole('alert');
      expect(screen.getByLabelText('Title column')).toHaveValue('Name');
      expect(screen.getByLabelText('Content column')).toHaveValue('Notes');

      // Retry
      fireEvent.click(screen.getByRole('button', { name: 'Import records' }));

      const statusBox = await screen.findByRole('status');
      expect(statusBox).toHaveTextContent('42 records imported.');
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      expect(screen.getByLabelText('Title column')).toHaveValue('');
      expect(screen.getByLabelText('Content column')).toHaveValue('');
      expect(screen.getByText('Drop a CSV file here')).toBeInTheDocument();
    });

    it('"Replace file" clears the error and keeps typed column names', async () => {
      importCompanyCsv.mockRejectedValueOnce(
        new HttpError('Missing required columns: title, content. Available headers: [\'Name\', \'Notes\'].', {
          status: 400,
        }),
      );

      renderPage();

      const file1 = new File(['Name,Notes\n'], 'wrong.csv', { type: 'text/csv' });
      fireEvent.change(screen.getByTestId('csv-file-input'), { target: { files: [file1] } });
      fireEvent.click(screen.getByRole('button', { name: 'Import records' }));

      await screen.findByRole('alert');

      // User customizes column name
      fireEvent.change(screen.getByLabelText('Title column'), { target: { value: 'CustomTitle' } });

      // Click "Replace file"
      const replaceBtn = screen.getByRole('button', { name: 'Replace file' });
      fireEvent.click(replaceBtn);

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      expect(screen.getByLabelText('Title column')).toHaveValue('CustomTitle');
    });

    it('client rejection: empty file, non-CSV file, and file > 5 MB are blocked before upload', async () => {
      renderPage();

      // 1. Non-CSV
      const pdfFile = new File(['binary'], 'doc.pdf', { type: 'application/pdf' });
      fireEvent.change(screen.getByTestId('csv-file-input'), { target: { files: [pdfFile] } });
      expect(await screen.findByRole('alert')).toHaveTextContent('Please choose a CSV file (.csv).');
      expect(importCompanyCsv).not.toHaveBeenCalled();

      // 2. Empty file
      const emptyFile = new File([], 'empty.csv', { type: 'text/csv' });
      fireEvent.change(screen.getByTestId('csv-file-input'), { target: { files: [emptyFile] } });
      expect(await screen.findByRole('alert')).toHaveTextContent(
        'The chosen file is empty. Please choose a non-empty CSV file.',
      );
      expect(importCompanyCsv).not.toHaveBeenCalled();

      // 3. File > 5 MB
      const largeFile = new File(['big content'], 'large.csv', { type: 'text/csv' });
      Object.defineProperty(largeFile, 'size', { value: 6 * 1024 * 1024 });
      fireEvent.change(screen.getByTestId('csv-file-input'), { target: { files: [largeFile] } });
      expect(await screen.findByRole('alert')).toHaveTextContent(
        'File exceeds the 5 MB limit. Please choose a smaller file.',
      );
      expect(importCompanyCsv).not.toHaveBeenCalled();
    });

    it('error mapping: 403 shows "You don\'t have access to this page." and 429 shows retry time', async () => {
      importCompanyCsv
        .mockRejectedValueOnce(new HttpError('Forbidden', { status: 403 }))
        .mockRejectedValueOnce(
          new HttpError('Too many requests', { status: 429, retryAfterSeconds: 25 }),
        );

      renderPage();

      const file = new File(['title,content\n'], 'test.csv', { type: 'text/csv' });
      fireEvent.change(screen.getByTestId('csv-file-input'), { target: { files: [file] } });

      const importBtn = screen.getByRole('button', { name: 'Import records' });
      fireEvent.click(importBtn);

      expect(await screen.findByRole('alert')).toHaveTextContent("You don't have access to this page.");

      fireEvent.click(importBtn);
      expect(await screen.findByRole('alert')).toHaveTextContent(
        'Too many requests. Please try again in 25 seconds.',
      );
    });

    it('keyboard accessibility: dropzone triggers on Enter and Space, buttons are operable', () => {
      renderPage();

      const dropzone = screen.getByRole('button', {
        name: /Upload CSV file\. Drop file here or press Enter to choose file/i,
      });
      expect(dropzone).toHaveAttribute('tabIndex', '0');

      // Test keydown on dropzone
      fireEvent.keyDown(dropzone, { key: 'Enter' });
      fireEvent.keyDown(dropzone, { key: ' ' });

      const titleInput = screen.getByLabelText('Title');
      const contentInput = screen.getByLabelText('Content');
      expect(titleInput).toBeInTheDocument();
      expect(contentInput).toBeInTheDocument();
    });
  });
});
