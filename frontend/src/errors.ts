export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}


const FRIENDLY_MESSAGES: Record<string, string> = {
  EVENT_FULL: "This event is sold out",
  ALREADY_REGISTERED: "You already have a ticket for this event",
  UNAUTHORIZED: "Please log in to continue",
  FORBIDDEN: "Only admins can do that",
  INVALID_CREDENTIALS: "Wrong email or password",
  EMAIL_TAKEN: "An account with this email already exists",
  NOT_FOUND: "We couldn't find that",
};

export function friendlyMessage(code: string, fallback: string): string {
  return FRIENDLY_MESSAGES[code] ?? fallback;
}

/** Fired when the server says the login has expired, so the UI can log the user out. */
export const AUTH_EXPIRED_EVENT = "auth:expired";

export function errorMessage(err: unknown): string {
  return err instanceof ApiError ? err.message : "Something went wrong";
}
