import { useQuery } from '@tanstack/react-query';
import { fetchDatasets } from '../../../api/v1/companyData.api.js';
import { mapDatasets } from '../mappers/dataset.mapper.js';

export const DATASETS_QUERY_KEY = ['datasets'];

export function useDatasets() {
  return useQuery({
    queryKey: DATASETS_QUERY_KEY,
    queryFn: ({ signal }) => fetchDatasets({ signal }),
    select: mapDatasets,
  });
}
