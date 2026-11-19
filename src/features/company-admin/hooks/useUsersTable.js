import { mapCompanyUser } from '../mappers/user.mapper.js';

export function useUsersTable(users) {
  return users.map(mapCompanyUser);
}
