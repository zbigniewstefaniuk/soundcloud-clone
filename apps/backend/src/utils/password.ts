import bcrypt from 'bcrypt'
import { BCRYPT_SALT_ROUNDS } from '../config/constants'

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_SALT_ROUNDS)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function generateSalt(): string {
  return bcrypt.genSaltSync(BCRYPT_SALT_ROUNDS)
}
