export type User = {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
};

// Very simple in-memory store keyed by normalized email.
// This is only for development and resets on server restart.
const usersByEmail = new Map<string, User>();

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function hashPassword(password: string): string {
  // Placeholder for real hashing. Do not use in production.
  return password;
}

export function findUserByEmail(email: string): User | null {
  const key = normalizeEmail(email);
  return usersByEmail.get(key) ?? null;
}

export function createUser(email: string, password: string): User {
  const key = normalizeEmail(email);

  if (usersByEmail.has(key)) {
    throw new Error("User already exists");
  }

  const user: User = {
    id: typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    email: key,
    passwordHash: hashPassword(password),
    createdAt: new Date(),
  };

  usersByEmail.set(key, user);
  return user;
}

export function verifyUser(email: string, password: string): User | null {
  const user = findUserByEmail(email);
  if (!user) return null;

  const attemptedHash = hashPassword(password);
  if (attemptedHash !== user.passwordHash) {
    return null;
  }

  return user;
}
