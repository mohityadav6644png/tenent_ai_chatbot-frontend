import { mapReport } from '../mappers/report.mapper.js';

export function useReportsTable(reports) {
  return reports.map(mapReport);
}
