import { http, HttpResponse } from 'msw';

const reports = [
  {
    id: 'report-monthly',
    name: 'Monthly sales summary',
    schedule: { frequency: 'monthly', day_of_month: 1, time: '09:00' },
    recipients: [
      { id: 'recipient-1', name: 'Asha Nair' },
      { id: 'recipient-2', name: 'Ravi Singh' },
      { id: 'recipient-3', name: 'Meera Shah' },
      { id: 'recipient-4', name: 'Dev Patel' },
    ],
    status: 'active',
  },
  {
    id: 'report-stock',
    name: 'Low stock alert',
    schedule: { frequency: 'weekly', weekday: 1, time: '08:00' },
    recipients: [{ id: 'recipient-5', name: 'Asha Nair' }],
    status: 'paused',
  },
];

export const reportsHandlers = [
  http.get('*/v1/reports', () => HttpResponse.json({ reports })),
  http.post('*/v1/reports/:id/pause', ({ params }) => setReportStatus(params.id, 'paused')),
  http.post('*/v1/reports/:id/resume', ({ params }) => setReportStatus(params.id, 'active')),
];

function setReportStatus(id, status) {
  const report = reports.find((item) => item.id === id);
  if (!report) return HttpResponse.json({ code: 'REPORT_NOT_FOUND' }, { status: 404 });
  report.status = status;
  return HttpResponse.json({ id: report.id, status: report.status });
}
