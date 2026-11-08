// These are few important things to be taken into consideration before building the error handler for API
// We have developed two customs errors:
// 1- AppError: This is a general application error and when we say application error it is something that is happening here in this Next Application
// So, it is built for this Backend Application. It extends Error class but with extra information:
//  public readonly statusCode: number;
//  public readonly code: string;
//  public readonly isOperational: boolean;

// A normal error mostly gives: message, name, stack. For example, throw new Error("Invalid request"); then we will get message = "Invalid request"
// Now with the AppError we can have more information about the error. For example which HTTP status to return, which internal error code to expose, whether this is an expected application error.
// name          → AppError
// message       → Invalid request
// statusCode    → 400
// code          → BAD_REQUEST
// isOperational → true
// new AppError("Not found", 404, "NOT_FOUND")

// what is operational error?
// Hermes unavailable
// invalid request
// authentication failed
// resource not found
// These can happen even when our code is correct.

// What is this.name = new.target.name;?
// Since HermesError extends AppError, new.target.name becomes: HermesError
// So the error's name reflects the actual subclass.

// What is Object.setPrototypeOf(this, new.target.prototype);?
// It makes checks like this reliable: error instanceof HermesError

// 2- HermesError: This is a specialized AppError since it extends AppError.
// What important about this error is that it preserves the original error propagated from Hermes.
// hermesStatusCode: This stores the original HTTP status returned by Hermes.
// since in the services layer we are calling Hermes exposed APIs, then we are going to get a response and sometime this response is an error response that has a status code 401 Unauthorized
// then our client might throw new HermesError( "Unauthorized", 502, "HERMES_REQUEST_FAILED", 401 )
// message          → Unauthorized
// statusCode       → 502
// code             → HERMES_REQUEST_FAILED
// isOperational    → true
// hermesStatusCode → 401

// The distinction is:
// statusCode
// → what OUR API plans to return

// hermesStatusCode
// → what HERMES originally returned

// Where are we using HermesError?
// In src/server/clients/hermes/hermes.client.ts
// The Hermes client is the part that actually talks to Hermes.
// So it is the natural place to detect Hermes-specific failures.

// throw new HermesError( "Unable to communicate with Hermes", 502, "HERMES_UNAVAILABLE" );
// This happens when:
// - Hermes is not running,
// - connection is refused,
// - hostname cannot be resolved.

// Another example when Hermes did respond, but returned an error HTTP status. So the client translates raw low-level failures into meaningful Hermes-specific errors.
// return new HermesError( message, 502, "HERMES_REQUEST_FAILED", response.status );

// Where are we using AppError?
// We may later use it directly for non-Hermes problems, such as:
// invalid request
// bad input
// missing resource
// invalid scheduler configuration
// For Example: throw new AppError( "Schedule interval must be greater than zero", 400, "INVALID_SCHEDULE" );
// AppError → general backend problems
// HermesError → Hermes-specific problems

// Now this file which is the error handler for API
// Its job is to receive an error that already happened and convert it into a proper API response.

// where will error-handler be used? 
// It will be used in the API route handlers. For example, in src/app/api/v1/status/route.ts
// export async function GET() {
//   try {
//     const data = await getStatus();

//     return NextResponse.json(data);
//   } catch (error) {
//     return handleApiError(error);
//   }
// }

// so the flow: 
// GET /api/v1/status ==> route.ts ==> controller ==> service ==> HermesClient ==> Hermes

// if everything succeeds: Hermes ==> data ==> HermesClient ==> service ==> controller ==> route ==> 200 response
// if something fails: Hermes failure ==> HermesClient ==> throws HermesError ==> service does not catch it ==> controller does not catch it ==> route catches it ==> handleApiError(error) ==> clean 502 JSON response

// This below is a Concrete Example: for example Hermes is not running: 
// The client will call await fetch() and fetch() will get a connection error, then the client catches it in the request method and throws: new HermesError( "Unable to communicate with Hermes", 502, "HERMES_UNAVAILABLE" );
// The object will be like this:
// name          HermesError
// message       Unable to communicate with Hermes
// statusCode    502
// code          HERMES_UNAVAILABLE
// isOperational true

// The error will move: HermesClient ==> StatusService ==> statusController ==> status route ==> handleApiError(error) ==> The handler sees: error instanceof AppError ==> clean 502 JSON response

// This is below a Concrete Example: for example Hermes timeout:
// The client creates:new HermesError( "Hermes request timed out after 10000ms", 504, "HERMES_TIMEOUT" );
// The error handler returns: HTTP 504 and 
// {
//   "success": false,
//   "error": {
//     "code": "HERMES_TIMEOUT",
//     "message": "Hermes request timed out after 10000ms"
//   }
// }

// Concrete example: bug in our own code
// Imagine something throws: throw new TypeError("Cannot read properties of undefined");

// That is not our AppError.
// So the error handler does not expose that internal message.
// Instead it logs the real error server-side and returns:
// HTTP 500

// with:
// {
//   "success": false,
//   "error": {
//     "code": "INTERNAL_SERVER_ERROR",
//     "message": "An unexpected error occurred"
//   }
// }

// AppError
// → general structured application error

// HermesError
// → specific structured error for Hermes problems

// HermesClient
// → detects Hermes/network failures and throws HermesError

// error-handler.ts
// → converts structured errors into HTTP responses

// route.ts
// → catches errors and sends them to error-handler.ts


import { NextResponse } from "next/server";

import { AppError } from "@/server/errors/app-error";

// Give me any error, and I will decide what HTTP response should go back to the frontend.
export const handleApiError = (error: unknown) => {
  // The first check: Because HermesError extends AppError, this catches both: AppError and HermesError

  if (error instanceof AppError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
      },
      {
        status: error.statusCode,
      },
    );
  }

  console.error("Unhandled API error:", error);

  return NextResponse.json(
    {
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred",
      },
    },
    {
      status: 500,
    },
  );
};
