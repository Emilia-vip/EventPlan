import type { FastifyRequest } from "fastify";
import { AppError } from "../errors.js";
import { findUserById, type UserDto } from "../services/users.js";
import { verifyToken } from "./token.js";

declare module "fastify" {
  interface FastifyRequest {
    user?: UserDto;
  }
}

const unauthorized = () => new AppError(401, "UNAUTHORIZED", "Logga in för att fortsätta");

/** Kräver giltig Bearer-token. Lägger användaren på request.user. */
export async function requireUser(request: FastifyRequest) {
  const header = request.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : null;
  if (!token) throw unauthorized();

  const userId = await verifyToken(token);
  if (!userId) throw unauthorized();

  // Kontrollera mot databasen, så att borttagna konton inte längre kan användas
  const user = await findUserById(userId);
  if (!user) throw unauthorized();

  request.user = user;
}

/** Kräver inloggning och admin-roll. */
export async function requireAdmin(request: FastifyRequest) {
  await requireUser(request);
  if (request.user?.role !== "admin") {
    throw new AppError(403, "FORBIDDEN", "Bara admin kan göra det");
  }
}
