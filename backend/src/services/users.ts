import { pool } from "../db.js";
import { AppError } from "../errors.js";
import type { SignupInput } from "../validation.js";

export type Role = "customer" | "admin";

export interface UserRow {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: Role;
}

export interface UserDto {
  id: string;
  name: string;
  email: string;
  role: Role;
}

const PG_UNIQUE_VIOLATION = "23505";

export function toUserDto(row: UserRow): UserDto {
  return { id: row.id, name: row.name, email: row.email, role: row.role };
}

export async function createUser(input: SignupInput & { passwordHash: string }) {
  try {
    const { rows } = await pool.query<UserRow>(
      `INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING *`,
      [input.name, input.email, input.passwordHash],
    );
    return toUserDto(rows[0]!);
  } catch (err) {
    if ((err as { code?: string }).code === PG_UNIQUE_VIOLATION) {
      throw new AppError(409, "EMAIL_TAKEN", "Det finns redan ett konto med den e-postadressen");
    }
    throw err;
  }
}

export async function findUserByEmail(email: string): Promise<UserRow | null> {
  const { rows } = await pool.query<UserRow>("SELECT * FROM users WHERE email = $1", [email]);
  return rows[0] ?? null;
}

export async function findUserById(id: string): Promise<UserDto | null> {
  const { rows } = await pool.query<UserRow>("SELECT * FROM users WHERE id = $1", [id]);
  return rows[0] ? toUserDto(rows[0]) : null;
}
