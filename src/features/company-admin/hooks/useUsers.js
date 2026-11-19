import { useQuery } from '@tanstack/react-query';
import { listUsers } from '../../../api/v1/users.api.js';

export const USERS_QUERY_KEY = ['users'];

export function useUsers() {
  return useQuery({
    queryKey: USERS_QUERY_KEY,
    queryFn: ({ signal }) => listUsers({ signal }),
    retry: false,
  });
}
