export class AppError extends Error {
    constructor(
      public readonly status: number,
      public readonly code: string,
      message: string,
    ) {
      super(message);
    }
  }
  
  export const notFound = (what: string) => new AppError(404, "NOT_FOUND", `${what} hittades inte`);