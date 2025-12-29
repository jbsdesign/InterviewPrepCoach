import jwt from "jsonwebtoken";

const AUTH_COOKIE_NAME = "ipc_session";

const JWT_SECRET = process.env.AUTH_SECRET ?? "dev-secret-change-me";

type SessionPayload = {
  userId: string;
};

export function createSessionToken(userId: string): string {
  const payload: SessionPayload = { userId };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: "7d",
  });
}

export function verifySessionToken(token: string): SessionPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as SessionPayload;
  } catch {
    return null;
  }
}

export { AUTH_COOKIE_NAME };
