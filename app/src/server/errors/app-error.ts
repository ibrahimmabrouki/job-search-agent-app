// This will act as the error layer it will be simple and production ready
// The purpose is to avoid throwing plain generic errors everywhere like: throw new Error("Something failed");
// The generic error works but it gives very little structure

// Instead we want errors that can carry useful information like:
// HTTP status code,
// internal error code,
// human-readable message,
// whether the error came from Hermes.

// The flow will be eventually: Hermes API fails ==> HermesClient detects it ==> throws HermesError ==> controller/error handler catches it ==> returns clean API response to the UI

// Instead of throwing plain Error objects everywhere,
// we use AppError so we can attach structured information
// such as:
//
// - HTTP status code
// - internal error code
// - whether the error is expected/operational
//
// Other application-specific errors can extend this class.

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode = 500,
    code = "INTERNAL_SERVER_ERROR",
    isOperational = true,
  ) {
    super(message);

    this.name = new.target.name;
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;

    Object.setPrototypeOf(this, new.target.prototype);
  }
}

// later we can use something like this:
// throw new AppError(
//   "Invalid request",
//   400,
//   "BAD_REQUEST"
// );

// Instead of knowing that something failed ==> we know:
// message    → Invalid request
// statusCode → 400
// code       → BAD_REQUEST

// What is isOperational field?
// it is useful because later we can distinguish between expected errors, like Hermes returning 401, and unexpected programming bugs.

// Now the most important line is: this.name = new.target.name;
// This makes the error name match the actual class. So, if we throw a HermesError the name becomes HermesError or AppErorr ==> AppError instead of just a plain Error name

// Also we have the: Object.setPrototypeOf(this, new.target.prototype);
// helps preserve proper inheritance behavior for custom errors, especially when using instanceof.

// if (error instanceof HermesError) { ... }

