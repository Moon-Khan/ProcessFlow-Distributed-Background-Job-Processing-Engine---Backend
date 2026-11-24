import { AppDataSource } from '../db/data-source.js';
import { User } from '../db/entities/User.js';
import { NotFoundError } from '../errors/http-error.js';

export async function getUserOrFail(id: number): Promise<User> {
  const user = await AppDataSource.getRepository(User).findOneBy({ id });
  if (!user) throw new NotFoundError(`user ${id} not found`);
  return user;
}
