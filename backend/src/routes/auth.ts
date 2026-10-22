import type { FastifyInstance } from "fastify";
import { requireUser } from "../auth/middleware.js";
import { hashPassword, verifyPassword } from "../auth/password.js";
import { signToken } from "../auth/token.js";
import { AppError } from "../errors.js";
import { createUser, findUserByEmail, toUserDto } from "../services/users.js";
import { loginSchema, signupSchema } from "../validation.js";

export async function authRoutes(app: FastifyInstance) {
  app.post("/auth/signup", async (request, reply) => {
    const input = signupSchema.parse(request.body);
    const user = await createUser({ ...input, passwordHash: await hashPassword(input.password) });
    const token = await signToken(user.id);
    reply.code(201);
    return { token, user };
  });

  app.post("/auth/login", async (request) => {
    const input = loginSchema.parse(request.body);
    const row = await findUserByEmail(input.email);
    // Samma fel oavsett om e-posten finns eller om lösenordet är fel
    const valid = row !== null && (await verifyPassword(input.password, row.password_hash));
    if (!row || !valid) {
      throw new AppError(401, "INVALID_CREDENTIALS", "Fel e-post eller lösenord");
    }
    return { token: await signToken(row.id), user: toUserDto(row) };
  });

  app.get("/auth/me", { preHandler: requireUser }, async (request) => request.user);
}
