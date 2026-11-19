import { http, HttpResponse } from 'msw';

export const mockDatasets = [
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
  {
    key: 'invoices',
    label: 'Invoices',
    record_label: 'invoice',
    records: 4120,
    last_updated: '2026-05-01T10:00:00Z',
    status: 'ready',
    required_columns: ['invoice_id', 'order_id', 'invoice_date', 'amount', 'due_date'],
  },
  {
    key: 'stock_levels',
    label: 'Stock levels',
    record_label: 'stock item',
    records: 640,
    last_updated: '2026-05-01T10:00:00Z',
    status: 'ready',
    required_columns: ['product_id', 'warehouse_location', 'quantity_on_hand', 'reorder_threshold'],
  },
];

export const companyDataHandlers = [
  http.get('*/v1/company/datasets', () => {
    return HttpResponse.json(mockDatasets);
  }),

  http.get('*/v1/company/datasets/:dataset/template', ({ params, request }) => {
    const dataset = mockDatasets.find((d) => d.key === params.dataset) || mockDatasets[0];
    const csvContent = `${dataset.required_columns.join(',')}\r\n`;
    return new HttpResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${params.dataset}_template.csv"`,
      },
    });
  }),

  http.post('*/v1/company/datasets/:dataset/imports/preview', async ({ params, request }) => {
    const formData = await request.formData().catch(() => null);
    const file = formData?.get('file');
    if (!file) {
      return HttpResponse.json({ code: 'INVALID_INPUT', message: 'No file provided' }, { status: 400 });
    }

    const dataset = mockDatasets.find((d) => d.key === params.dataset) || mockDatasets[0];
    return HttpResponse.json({
      total_rows: 9860,
      valid_rows: 9858,
      invalid_rows: 2,
      required_columns: dataset.required_columns,
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
        { row: 14, column: 'total_amount', reason: 'Must be a positive number' },
        { row: 89, column: 'order_date', reason: 'Invalid date format' },
      ],
    });
  }),

  http.post('*/v1/company/datasets/:dataset/imports', async ({ request }) => {
    const formData = await request.formData().catch(() => null);
    const file = formData?.get('file');
    const mode = formData?.get('mode') || 'upsert';

    if (!file) {
      return HttpResponse.json({ code: 'INVALID_INPUT', message: 'No file provided' }, { status: 400 });
    }

    return HttpResponse.json({
      import_id: 'imp-mock-12345',
      inserted: mode === 'replace' ? 9858 : 9800,
      updated: mode === 'replace' ? 0 : 58,
      skipped: 2,
      status: 'completed',
    });
  }),
];
