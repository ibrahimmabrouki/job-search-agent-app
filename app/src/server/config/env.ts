// This file is responsible for defining a single trusted place
// where the backend reads and validates application configuration.
//
// For now, the control panel backend needs to know things like:
// - Where the Hermes server is running
// - Which secret token should be used when calling protected Hermes APIs
// - Or
// - Where the Hermes Manager is running
//
// These values may change depending on the environment.
//
// Example:
//
// Local development:
// HERMES_BASE_URL=http://127.0.0.1:9119
//
// Docker:
// HERMES_BASE_URL=http://gateway:9119
//
// Sensitive values such as HERMES_DASHBOARD_SESSION_TOKEN
// should NOT be hardcoded in source code.

// Why define ServerEnv? It tells TypeScript which configuration values must exist and what types they should have.
// Important: ServerEnv doesn't actually load the values. The loadServerEnv() function does that.
// This keeps our configuration organized, type-safe, and easy to maintain.
type ServerEnv = {
  hermes: {
    baseUrl: string;
    sessionToken: string;
  };
  manager: {
    baseUrl: string;
  };
};

// This helper reads a required environment variable.
//
// If the variable does not exist, is empty, or only contains spaces,
// the application throws a clear error immediately.
//
// This is better than allowing the application to continue running
// and later fail with a confusing error such as:
//
// 401 Unauthorized
//
// Example:
//
// getRequiredEnv("HERMES_DASHBOARD_SESSION_TOKEN")
//
const getRequiredEnv = (name: string): string => {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
};

// This helper reads an optional environment variable.
//
// If the environment variable exists, we use its value.
// If it does not exist, we use the fallback value.
//
// Example:
//
// HERMES_BASE_URL exists:
// → use HERMES_BASE_URL
//
// HERMES_BASE_URL does not exist:
// → use http://127.0.0.1:9119
//
const getOptionalEnv = (name: string, fallback: string): string => {
  const value = process.env[name]?.trim();

  return value || fallback;
};

// This function loads and validates the server configuration.
//
// We use a function instead of reading all environment variables
// immediately when this file is imported.
//
// This gives us explicit control over when configuration validation happens.
//
// Later, the Hermes client will do something like:
//
// const env = loadServerEnv();
//
// env.hermes.baseUrl
// env.hermes.sessionToken
// or
// env.manager.baseUrl
//
// instead of directly using:
//
// process.env.HERMES_BASE_URL
// process.env.HERMES_DASHBOARD_SESSION_TOKEN
//
export const loadServerEnv = (): ServerEnv => {
  return {
    hermes: {
      // The Hermes base URL.
      //
      // During local development Hermes may be available at:
      //
      // http://127.0.0.1:9119
      //
      // Later, inside Docker Compose, the control panel container
      // will communicate with the Hermes container through
      // the Docker service name:
      //
      // http://gateway:9119
      //
      // Docker will therefore provide something like:
      //
      // HERMES_BASE_URL=http://gateway:9119
      //
      // The .replace(/\/+$/, "") removes trailing slashes.
      //
      // Example:
      //
      // http://gateway:9119/
      //
      // becomes:
      //
      // http://gateway:9119
      //
      // This makes it safe to later create URLs like:
      //
      // `${baseUrl}/api/status`
      //
      // without accidentally producing:
      //
      // http://gateway:9119//api/status
      //
      baseUrl: getOptionalEnv(
        "HERMES_BASE_URL",
        "http://127.0.0.1:9119",
      ).replace(/\/+$/, ""),

      // This is the secret token our backend sends to protected
      // Hermes API endpoints.
      //
      // Hermes expects it in this HTTP header:
      //
      // X-Hermes-Session-Token: <secret>
      //
      // Later, HermesClient will use it approximately like:
      //
      // headers: {
      //   "X-Hermes-Session-Token": env.hermes.sessionToken
      // }
      //
      // There is intentionally NO default value for this token.
      //
      // Secrets should always be explicitly configured.
      sessionToken: getRequiredEnv("HERMES_DASHBOARD_SESSION_TOKEN"),
    },
    manager: {
      // The base URL for the Hermes Manager.
      //
      // During local development, the manager may be available at:
      //
      // http://127.0.0.1:9120
      //
      // Later, inside Docker Compose, the manager container will communicate with the Hermes container through
      // the Docker service name:
      //
      // http://manager:9120
      //
      // Docker will therefore provide something like:
      //
      // MANAGER_BASE_URL=http://manager:9120
      //
      // The .replace(/\/+$/, "") removes trailing slashes.
      //
      // Example:
      //
      // http://manager:9120/
      //
      // becomes:
      //
      // http://manager:9120
      //
      // This makes it safe to later create URLs like:
      //
      // `${baseUrl}/api/status`
      //
      // without accidentally producing:
      //
      // http://manager:9120//api/status
      //
      baseUrl: getOptionalEnv(
        "MANAGER_BASE_URL",
        "http://127.0.0.1:9200",
      ).replace(/\/+$/, ""),
    },
  };
};

/*
Architecture:

Environment / Docker configuration
            │
            ↓
          env.ts
            │
            ↓
      HermesClient
            │
    ┌───────┼─────────┐
    ↓       ↓         ↓
  Status   Codex   WhatsApp
                    │
                 Scheduler
                    │
                   Agent

Responsibility of this file:

1. Read environment variables
2. Validate required values
3. Provide sensible defaults where appropriate
4. Keep configuration logic in one place
5. Prevent process.env usage from being scattered across the backend
*/
