import { http, HttpResponse } from 'msw';

export const mockCompanyFiles = [
  {
    id: 'file-mock-1',
    name: 'Sales Q1 Data',
    description: 'Quarterly sales transactions by region and product line.',
    rows: 1240,
    columns_count: 5,
    hidden_columns_count: 1,
    updated_at: new Date().toISOString(),
    status: 'ready',
    upload_mode: 'replace',
  },
];

export const mockFileDetail = {
  id: 'file-mock-1',
  name: 'Sales Q1 Data',
  slug: 'sales_q1_data',
  description: 'Quarterly sales transactions by region and product line.',
  status: 'ready',
  upload_mode: 'replace',
  row_count: 1240,
  columns: [
    { key: 'region', label: 'Region', type: 'text', example: 'North', meaning: 'Sales geographic region', hidden: false },
    { key: 'sales', label: 'Sales', type: 'number', example: 15400, meaning: 'Revenue in USD', hidden: false },
    { key: 'phone', label: 'Phone', type: 'text', example: '+919876543210', meaning: 'Customer contact phone', hidden: true },
  ],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const companyFilesHandlers = [
  http.get('*/v1/company/files', () => {
    return HttpResponse.json({
      summary: {
        files: mockCompanyFiles.length,
        total_rows: mockCompanyFiles.reduce((acc, f) => acc + f.rows, 0),
        last_upload: mockCompanyFiles[0]?.updated_at || null,
        limit: 10,
      },
      files: mockCompanyFiles,
    });
  }),

  http.post('*/v1/company/files/preview', async () => {
    return HttpResponse.json({
      filename: 'sales_sample.csv',
      total_rows: 10,
      valid_rows: 9,
      invalid_rows: 1,
      columns: [
        { key: 'region', label: 'Region', type: 'text', example: 'North', suggested_hidden: false },
        { key: 'sales', label: 'Sales', type: 'number', example: 5000, suggested_hidden: false },
        { key: 'phone', label: 'Phone', type: 'text', example: '+919876543210', suggested_hidden: true },
      ],
      sample_rows: [
        { region: 'North', sales: 5000, phone: '+919876543210' },
      ],
      errors: [
        { row: 11, column: 'sales', reason: 'Invalid number format' },
      ],
      limits: {
        max_files: 10,
        max_mb: 5,
        max_rows: 50000,
        max_columns: 30,
      },
    });
  }),

  http.post('*/v1/company/files', async ({ request }) => {
    const formData = await request.formData().catch(() => null);
    const metaStr = formData?.get('meta');
    let meta = {};
    if (metaStr) {
      try {
        meta = JSON.parse(metaStr);
      } catch {
        return HttpResponse.json({ code: 'VALIDATION_ERROR', message: 'Invalid meta JSON' }, { status: 400 });
      }
    }
    if (meta.name === 'Duplicate File') {
      return HttpResponse.json({ code: 'FILE_EXISTS', message: 'A file with this name already exists' }, { status: 409 });
    }
    return HttpResponse.json({
      id: 'file-mock-created',
      status: 'ready',
      inserted: 9,
      skipped: 1,
    }, { status: 201 });
  }),

  http.get('*/v1/company/files/:id', ({ params }) => {
    if (params.id === 'not-found') {
      return HttpResponse.json({ code: 'FILE_NOT_FOUND', message: 'File not found' }, { status: 404 });
    }
    return HttpResponse.json(mockFileDetail);
  }),

  http.patch('*/v1/company/files/:id', async ({ request, params }) => {
    const body = await request.json().catch(() => ({}));
    if (body.name === 'Duplicate File') {
      return HttpResponse.json({ code: 'FILE_EXISTS', message: 'A file with this name already exists' }, { status: 409 });
    }
    return HttpResponse.json({
      ...mockFileDetail,
      ...body,
      updated_at: new Date().toISOString(),
    });
  }),

  http.post('*/v1/company/files/:id/upload', async () => {
    return HttpResponse.json({
      inserted: 15,
      skipped: 0,
      errors: [],
      status: 'ready',
    });
  }),

  http.delete('*/v1/company/files/:id', () => {
    return new HttpResponse(null, { status: 204 });
  }),
];
