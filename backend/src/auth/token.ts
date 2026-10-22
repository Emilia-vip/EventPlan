import { jwtVerify, SignJWT } from "jose";

// Läses vid anrop, inte vid import, så att tester kan sätta JWT_SECRET
function secret(): Uint8Array {
  const value = process.env.JWT_SECRET;
  if (!value || value.length < 32) {
    throw new Error("JWT_SECRET måste vara satt och vara minst 32 tecken");
  }
  return new TextEncoder().encode(value);
}

export function signToken(userId: string): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret());
}

/** Returnerar användarens id, eller null om token är ogiltig eller har gått ut. */
export async function verifyToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: ["HS256"] });
    return payload.sub ?? null;
  } catch {
    return null;
  }
}
