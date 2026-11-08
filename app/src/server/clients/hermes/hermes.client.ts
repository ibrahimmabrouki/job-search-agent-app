// This client represents the communication layer between this backend and between Hermes
// read Hermes config from env.ts,
// use the fixed header/endpoint definitions from hermes.constants.ts,
// send HTTP requests with fetch,
// attach the Hermes session token automatically,
// parse JSON responses,
// detect non-2xx responses,
// convert low-level request failures into clean Hermes-specific errors.

// The goal is that no service talks to Hermes directly with fetch(). Every Hermes HTTP request goes through this client.
// every feature after this—status, Codex, WhatsApp, scheduler, controls—needs to call Hermes. We want all of them to reuse one reliable client instead of duplicating fetch(...) logic everywhere.
// codex.service.ts ───────┐
// whatsapp.service.ts ────┼──> HermesClient ───> Hermes
// scheduler.service.ts ───┤
// agent.service.ts ───────┘

// The client will be responsible for six things:
// 1- knowing Hermes' URL
// 2- Automatically attaching the Hermes token
// 3- Sending HTTP requests
// 4- Converting request bodies to JSON
// 5- Parsing responses
// 6- Turning failures into HermesError.

// This tells Next.js that this module is backend-only. That matters because this file will eventually use: HERMES_DASHBOARD_SESSION_TOKEN which is a secret that should never be exposed to the browser. Next.js will throw an error if this file is accidentally imported into a frontend component.
// So this line helps prevent a client-side React component from accidentally importing this module and exposing server logic or secrets to the browser.
import "server-only";

// This method which is created earlier and its job is to load the Hermes base URL and Hermes session token
import { loadServerEnv } from "@/server/config/env";

// This gives us the fixed Hermes header name: X-Hermes-Session-Token instead of hardcoding it manually everywhere.
import { HERMES_HEADERS } from "@/server/constants/hermes.constants";

// This gives us the custom error class we created. So if Hermes fails, we can throw a structured HermesError rather than a generic Error.
import { HermesError } from "@/server/errors/hermes-error";

// The HTTP methods our Hermes client currently supports.
// We keep these explicit instead of accepting any arbitrary string.
// This gives us better TypeScript safety.
type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

// Configuration required by HermesClient object that will be defined down below.
// As we can see, that the timeoutMs is optional ==>
// new HermesClient({ baseUrl: "http://gateway:9119", sessionToken: "abc123", });
// and
// new HermesClient({ baseUrl: "http://gateway:9119", sessionToken: "abc123", timeoutMs: 5000,});
// are both valid

type HermesClientConfig = {
  baseUrl: string;
  sessionToken: string;
  timeoutMs?: number;
};

// Options that can be supplied to an individual HTTP request.
type HermesRequestOptions = {
  // This field is required because we need to know which HTTP method to use for the request.
  // This HTTP method should be one of the four supported methods: GET, POST, PUT, DELETE as we defined above in the HttpMethod type.
  method: HttpMethod;

  // `unknown` is intentional.
  // At this low-level HTTP layer we should not assume what shape
  // every Hermes request body will have.
  body?: unknown;

  // This is optional field that could be provided by main caller which will call the factory function
  // since we need to somehow control the timeouts for each service
  // for example: if the service is calling Hermes for a short-term operation such as getting the status, we can use the default timeout or even shorter
  // but in case of the cron job trigger it need more time..
  timeoutMs?: number;
};

// Note:
// any basically disables TypeScript checking.
// unknown means: We do not yet know the shape of this value, but TypeScript should still protect us.

// If Hermes does not respond within that time, the request will be aborted.
const DEFAULT_REQUEST_TIMEOUT_MS = 10_000;

// This creates a reusable object responsible for HTTP communication with Hermes.
export class HermesClient {
  // private means: Only this class can access them directly.
  // readonly means: Once assigned, they should not be changed.
  private readonly baseUrl: string;
  private readonly sessionToken: string;
  private readonly timeoutMs: number;

  // This is the constructor responsible for creating a new HermesClient object.
  // It takes a HermesClientConfig object as input, which contains the base URL, session token, and an optional timeout value.
  constructor(config: HermesClientConfig) {
    // here we are assigning the values from the config object to the private readonly fields of the HermesClient class.
    this.baseUrl = config.baseUrl;
    this.sessionToken = config.sessionToken;
    this.timeoutMs = config.timeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS;
  }

  // ---------------------------------------------------------------------------
  // Public HTTP methods
  // ---------------------------------------------------------------------------
  // Services should use these methods instead of calling fetch() directly.

  // Example:
  // hermesClient.get<HermesStatus>("/api/status");
  // This method will use the request() which will wrap the fetch() and handle the response and errors

  // The generic <T> represents the expected response type.
  // The caller of this method can specify what type of data they expect to receive from Hermes.
  // For example: hermesClient.get<HermesStatus>("/api/status"); here T = HermesStatus
  // So, the type script understands that the reponse from this GET request should be of type HermesStatus

  // This is the get helper method which is used to send a GET request to the specified path on the Hermes server
  public async get<T>(path: string): Promise<T> {
    // This get method does not contain the actual fetch() logic. Instead for code reusability it sends everything to the internal request() method
    // The request() method will recieve the path and the options object which contains the HTTP method and any other options like body
    return this.request<T>(path, {
      method: "GET",
    });
    0;
  }

  public async post<T>(
    path: string,
    body?: unknown,
    options?: { timeoutMs?: number },
  ): Promise<T> {
    return this.request<T>(path, {
      method: "POST",
      body,
      timeoutMs: options?.timeoutMs,
    });
  }

  public async put<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, {
      method: "PUT",
      body,
    });
  }

  public async delete<T>(path: string): Promise<T> {
    return this.request<T>(path, {
      method: "DELETE",
    });
  }

  // ---------------------------------------------------------------------------
  // Internal request method
  // ---------------------------------------------------------------------------
  // All public methods eventually come through this function.
  //
  // This is where we centralize:
  // - URL construction
  // - authentication
  // - JSON serialization
  // - timeouts
  // - response parsing
  // - error handling
  //
  // This prevents the same logic from being repeated in every service.

  private async request<T>(
    path: string,
    options: HermesRequestOptions,
  ): Promise<T> {
    // This creates the full URL.
    // For example:
    // baseUrl: http://gateway:9119
    // path: /api/status
    // => full URL: http://gateway:9119/api/status
    const url = this.buildUrl(path);

    // This creates an object that can cancel the HTTP request.
    const controller = new AbortController();

    const requestTimeoutMs = options.timeoutMs ?? this.timeoutMs;
    // This starts a timer that will abort the request if it takes too long.
    const timeout = setTimeout(() => {
      controller.abort();
    }, requestTimeoutMs);

    //The actual request is wrapped in try/catch/finally.
    try {
      const response = await fetch(url, {
        method: options.method,

        headers: {
          // This tells Hermes: We expect JSON back if possible.
          Accept: "application/json",
          // This tells Hermes: If we send a body, it is JSON.
          "Content-Type": "application/json",

          // Hermes expects this token on protected endpoints.
          [HERMES_HEADERS.SESSION_TOKEN]: this.sessionToken,
        },

        // GET requests should not contain a request body.
        body:
          options.body !== undefined ? JSON.stringify(options.body) : undefined,

        signal: controller.signal,

        // Hermes status and authentication information should be fresh.
        // We do not want Next.js to cache backend control requests.
        cache: "no-store",
      });

      // Successful responses still need to be parsed before returning
      // them to the calling service.
      if (response.ok) {
        return await this.parseResponse<T>(response);
      }

      // A response was received from Hermes, but Hermes rejected
      // the request or encountered an error.
      // If not successful: This converts the Hermes HTTP error into a structured HermesError.
      throw await this.createResponseError(response);
    } catch (error) {
      // If we deliberately created a HermesError above,
      // preserve it instead of wrapping it again.
      if (error instanceof HermesError) {
        throw error;
      }

      // This checks whether the request was aborted because of our timeout.
      // AbortController throws an AbortError when the timeout fires.
      if (error instanceof Error && error.name === "AbortError") {
        throw new HermesError(
          `Hermes request timed out after ${this.timeoutMs}ms`,
          // We return 504 Gateway Timeout because our backend is healthy, but the upstream Hermes service did not respond in time.
          504,
          "HERMES_TIMEOUT",
        );
      }

      // fetch() reaches this branch for network-level failures such as:
      //
      // - Hermes is not running
      // - hostname cannot be resolved
      // - connection is refused
      //
      // In this situation our control panel is functioning,
      // but its upstream Hermes service cannot be reached.
      throw new HermesError(
        "Unable to communicate with Hermes",
        502,
        "HERMES_UNAVAILABLE",
      );
    } finally {
      // Always clear the timeout, regardless of success or failure.
      //
      // This prevents unnecessary timers from remaining active
      // after the HTTP request has already completed.
      clearTimeout(timeout);
    }
  }

  // ---------------------------------------------------------------------------
  // URL construction
  // ---------------------------------------------------------------------------

  private buildUrl(path: string): string {
    // Services should normally provide paths such as:
    // /api/status

    // However, this also protects us if somebody accidentally passes:
    // api/status (without the leading slash).
    // by adding the leading slash automatically.

    const normalizedPath = path.startsWith("/") ? path : `/${path}`;

    return `${this.baseUrl}${normalizedPath}`;
  }

  // ---------------------------------------------------------------------------
  // Successful response parsing
  // ---------------------------------------------------------------------------

  private async parseResponse<T>(response: Response): Promise<T> {
    // HTTP 204 means:
    //
    // "The request succeeded, but there is no response body."
    //
    // Some future Hermes DELETE or control endpoints may behave this way.
    if (response.status === 204) {
      return undefined as T;
    }

    // This reads the response type.
    // for example: application/json or text/plain
    const contentType = response.headers.get("content-type") ?? "";

    // Most Hermes endpoints return JSON.
    if (contentType.includes("application/json")) {
      return (await response.json()) as T;
    }

    // We return text instead.
    // This makes the client more tolerant of endpoints that might not return JSON.
    return (await response.text()) as T;
  }

  // ---------------------------------------------------------------------------
  // Hermes HTTP error conversion
  // ---------------------------------------------------------------------------

  // This is called when Hermes responds with something like: 400, 401, 404, 500, etc.
  // { "detail": "Unauthorized" }
  private async createResponseError(response: Response): Promise<HermesError> {
    // We try to extract a useful message from Hermes.
    const responseBody = await this.readErrorResponse(response);

    const message =
      responseBody ?? `Hermes request failed with status ${response.status}`;

    // If Hermes gave us a message, use it.
    // Otherwise create a fallback message.
    // Then:
    // 502 means our application considers this an upstream Hermes failure.
    return new HermesError(
      message,

      // Our control panel is acting as a gateway to Hermes.
      // Therefore an upstream Hermes failure becomes a 502
      // from our application by default.
      502,

      "HERMES_REQUEST_FAILED",

      // Preserve the original status returned by Hermes.
      response.status,
    );
  }

  // ---------------------------------------------------------------------------
  // Safe error-body extraction
  // ---------------------------------------------------------------------------

  // This is the method used to read the error response body from Hermes.
  private async readErrorResponse(
    response: Response,
  ): Promise<string | undefined> {
    // We protect this logic because even error parsing can fail.
    try {
      const contentType = response.headers.get("content-type") ?? "";

      if (contentType.includes("application/json")) {
        const body = (await response.json()) as unknown;

        // Hermes may return:
        //
        // { "detail": "Unauthorized" }
        //
        // or:
        //
        // { "message": "Something failed" }
        //
        // We safely inspect those common shapes.

        if (typeof body === "object" && body !== null) {
          if ("detail" in body && typeof body.detail === "string") {
            return body.detail;
          }

          if ("message" in body && typeof body.message === "string") {
            return body.message;
          }
        }

        return JSON.stringify(body);
      }

      const text = await response.text();

      return text || undefined;
    } catch {
      // Error parsing should never hide the original HTTP failure.
      return undefined;
    }
  }

  /**
   * Uploads the candidate's CV PDF to Hermes.
   *
   * Endpoint: POST /api/files/upload-stream
   *
   * Unlike request(), this method sends multipart/form-data
   * instead of JSON.
   *
   * Important:
   * - Does not modify the existing request() method.
   * - Reuses Hermes authentication and error handling.
   * - FormData contains the PDF, destination path, and overwrite flag.
   * - Content-Type is NOT set manually; fetch generates it.
   *
   * Returns Hermes' upload response.
   */
  public async uploadCv<T>(formData: FormData): Promise<T> {
    const url = this.buildUrl("/api/files/upload-stream");

    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
    }, this.timeoutMs);

    try {
      const response = await fetch(url, {
        method: "POST",

        headers: {
          Accept: "application/json",
          [HERMES_HEADERS.SESSION_TOKEN]: this.sessionToken,
        },

        body: formData,
        signal: controller.signal,
        cache: "no-store",
      });

      if (response.ok) {
        return await this.parseResponse<T>(response);
      }

      throw await this.createResponseError(response);
    } catch (error) {
      if (error instanceof HermesError) {
        throw error;
      }

      if (error instanceof Error && error.name === "AbortError") {
        throw new HermesError(
          `Hermes upload timed out after ${this.timeoutMs}ms`,
          504,
          "HERMES_TIMEOUT",
        );
      }

      throw new HermesError(
        "Unable to upload CV to Hermes",
        502,
        "HERMES_UNAVAILABLE",
      );
    } finally {
      clearTimeout(timeout);
    }
  }
}

// -----------------------------------------------------------------------------
// HermesClient factory
// -----------------------------------------------------------------------------
//
// Environment variables are loaded here instead of directly inside the class.
// So later, a service does not need to know anything about environment variables.
// It can simply do: const hermesClient = createHermesClient();
export const createHermesClient = (): HermesClient => {
  const env = loadServerEnv();

  return new HermesClient({
    baseUrl: env.hermes.baseUrl,
    sessionToken: env.hermes.sessionToken,
  });
};
