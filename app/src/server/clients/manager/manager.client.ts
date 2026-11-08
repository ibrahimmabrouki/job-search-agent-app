/**
This is the manager client that is responsible for sending HTTP requests from this Next.js backend to the continainerized Hermes Manager service which is built on FastAPI.

WhatsAppService (Next.js) ==> ManagerClient (Sends the HTTP request, FastAPI Manager — localhost:9200) 
 */

// Prevents this file from accidentally being imported into browser-side code
import "server-only";

// loadServerEnv: Reads our configuration, including MANAGER_BASE_URL
import { loadServerEnv } from "@/server/config/env";

// AppError: Our existing custom error class for reporting failures consistently
import { AppError } from "@/server/errors/app-error";

// These are the allowed HTTP methods for the ManagerClient. We only support GET and POST for now.
type HttpMethod = "GET" | "POST";

// export class ManagerClient defines a reusable object for communicating with Manager
export class ManagerClient {
  // The base URL of the Hermes Manager service, e.g., http://localhost:9200
  // private: Only the class can access this property directly.
  // readonly: Its value cannot be reassigned after initialization.
  // string: It must contain text, such as http://127.0.0.1:9200.
  private readonly baseUrl: string;

  // constructor(...) runs when we create a new ManagerClient.
  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  // private async request<T>(...) is a generic method for sending HTTP requests to Manager.
  // It is private because we only want the ManagerClient to be able to call it.
  // It is async because it performs asynchronous operations (HTTP requests).
  // <T> is a generic type parameter that allows the caller to specify the expected response type.

  // Here the request method below is just a helper method that wraps the fetch() call and handles errors consistently
  // Thats why it is Generic method that takes a type parameter <T> which represents the expected response type and the caller can specify the type when calling the method.
  private async request<T>(method: HttpMethod, path: string): Promise<T> {
    // Declares a variable where we'll store the HTTP response received from Manager.
    let response: Response;

    // Attempts the request, allowing us to handle errors if something goes wrong.
    try {
      // await fetch(...) Actually sends the HTTP request.
      // For example: this.baseUrl = "http://127.0.0.1:9200"; and path = "/whatsapp/connect";
      // These combine into: http://127.0.0.1:9200/whatsapp/connect
      response = await fetch(`${this.baseUrl}${path}`, {
        // method specifies whether the request is GET or POST.
        method,
        headers: {
          // Accept: "application/json" tells Manager we expect a JSON response.
          Accept: "application/json",
        },
        // cache: "no-store" prevents Next.js from caching the response. This matters because WhatsApp pairing status changes.
        cache: "no-store",
        // AbortSignal.timeout(90_000) sets a timeout of 90 seconds. If the request takes longer, it is aborted.
        signal: AbortSignal.timeout(90_000),
      });
    } catch (error) {
      // error.name === "TimeoutError" checks whether the failure occurred because our request timed out.
      if (error instanceof Error && error.name === "TimeoutError") {
        throw new AppError("Manager request timed out", 504, "MANAGER_TIMEOUT");
      }

      // The other error uses 502 to indicate that our Next.js backend couldn't reach its upstream Manager service.
      throw new AppError(
        "Unable to communicate with Manager",
        502,
        "MANAGER_UNAVAILABLE",
      );
    }

    // response.ok is true when the HTTP status is between 200 and 299.
    // So !response.ok means the Manager returned an unsuccessful HTTP response, such as 400, 404, or 500.
    if (!response.ok) {
      throw new AppError(
        `Manager request failed with status ${response.status}`,
        502,
        "MANAGER_REQUEST_FAILED",
      );
    }

    return (await response.json()) as T;
  }

  //These are convenient methods that reuse our internal request() logic.
  // For example: managerClient.get<WhatsAppPollResponse>( "/whatsapp/poll/abc123" );
  // This automatically calls: this.request<WhatsAppPollResponse>( "GET", "/whatsapp/poll/abc123" );

  public get<T>(path: string): Promise<T> {
    return this.request<T>("GET", path);
  }

  public post<T>(path: string): Promise<T> {
    return this.request<T>("POST", path);
  }
}

// The ManagerClient factory function creates a new ManagerClient instance using the base URL from our server environment configuration.
export const createManagerClient = (): ManagerClient => {
  // const env = loadServerEnv(); loads the configuration we added to env.ts.
  const env = loadServerEnv();

  // new ManagerClient(env.manager.baseUrl) creates the client using the configured Manager URL.
  return new ManagerClient(env.manager.baseUrl);
};
