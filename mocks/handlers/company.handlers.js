import { http, HttpResponse } from 'msw';

export const companyHandlers = [
  http.post('*/v1/company/data/insert', async ({ request }) => {
    const body = await request.json().catch(() => null);
    if (!body?.title?.trim() || !body?.content?.trim()) {
      return HttpResponse.json(
        { code: 'VALIDATION_ERROR', message: 'Title and content are required' },
        { status: 400 },
      );
    }
    return HttpResponse.json({
      id: 'mock-record-1',
      record_id: 'mock-record-1',
      message: 'Record inserted successfully',
      success: true,
    });
  }),

  http.post('*/v1/company/import-csv-data', async ({ request }) => {
    const formData = await request.formData().catch(() => null);
    const file = formData?.get('file');
    const columnMappingStr = formData?.get('column_mapping');

    if (!file) {
      return HttpResponse.json(
        { error: { code: 'INVALID_INPUT', message: 'No file provided' } },
        { status: 400 },
      );
    }

    let columnMapping = null;
    if (columnMappingStr) {
      try {
        columnMapping = JSON.parse(columnMappingStr);
      } catch {
        columnMapping = null;
      }
    }

    const mappingValues = columnMapping ? Object.values(columnMapping) : [];
    const hasMapping = mappingValues.includes('title') && mappingValues.includes('content');

    if (hasMapping) {
      return HttpResponse.json({
        message: 'Successfully imported 42 records.',
        count: 42,
        skipped: 0,
        import_id: 'mock-import-1',
        total_records_imported: 42,
        imported_count: 42,
        records_count: 42,
        success: true,
      });
    }

    return HttpResponse.json(
      {
        request_id: 'mock-req-missing',
        status: 'error',
        error: {
          code: 'MISSING_COLUMNS',
          message:
            "Missing required columns: title, content. Your file needs a title column and a content column. Available headers: ['Name', 'Notes'].",
          retryable: false,
          details: {
            found_columns: ['Name', 'Notes'],
          },
        },
        detail: 'Missing required columns',
      },
      { status: 400 },
    );
  }),
];
