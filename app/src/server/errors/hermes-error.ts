import { AppError } from "./app-error";

// Error specifically used for failures related to Hermes.
//
// Examples:
//
// - Hermes returns 401 Unauthorized
// - Hermes returns 500
// - Hermes is unreachable
// - Hermes returns an unexpected response
//
// Keeping Hermes failures separate from generic application errors
// makes error handling more precise.

export class HermesError extends AppError {
  public readonly hermesStatusCode?: number;

  constructor(
    message: string,
    statusCode = 502,
    code = "HERMES_ERROR",
    hermesStatusCode?: number,
  ) {
    super(message, statusCode, code, true);

    this.hermesStatusCode = hermesStatusCode;
  }
}


// Why default to: 502 instead of 500?
// Because our backend is acting like a gateway between the UI and Hermes.
// If Hermes fails, our backend itself may be healthy, but the upstream dependency failed.
// That is exactly what HTTP 502 Bad Gateway represents.

// The extra field: hermesStatusCode?: number;
// This lets us keep the original Hermes HTTP response code when useful
// For Example, Herems might return: 401
// While our public API may decide to return its own mapped status
// we still keep the orginal status for logging/debugging

// AppError
//   ↑
//   │
// HermesError

// AppError is the general backend error.
// HermesError is a specialized version specifically for Hermes failures.