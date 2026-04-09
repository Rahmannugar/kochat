import { useAuthStore } from "@/lib/auth/auth.store"

export type ApiClientOptions = Omit<RequestInit, "body"> & {
  body?: BodyInit | Record<string, unknown>;
};

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly data?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false
  }

  const prototype = Object.getPrototypeOf(value)

  return prototype === Object.prototype || prototype === null
}

async function parseResponse(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  return response.text();
}

let pendingUnauthorizedCheck: Promise<void> | null = null

const handleUnauthorizedResponse = () => {
  if (typeof window === "undefined") {
    return Promise.resolve()
  }

  if (pendingUnauthorizedCheck) {
    return pendingUnauthorizedCheck
  }

  pendingUnauthorizedCheck = fetch("/api/auth/get-session", {
    method: "GET",
    credentials: "same-origin",
    cache: "no-store",
  })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error("Unable to verify the current session")
      }

      const session = await parseResponse(response)
      const hasActiveSession =
        session &&
        typeof session === "object" &&
        "session" in session &&
        "user" in session &&
        (session as { session: unknown; user: unknown }).session &&
        (session as { session: unknown; user: unknown }).user

      if (hasActiveSession) {
        return
      }

      useAuthStore.getState().clearSession()

      if (!window.location.pathname.startsWith("/sign-in")) {
        window.location.assign("/sign-in")
      }
    })
    .catch(() => {
      useAuthStore.getState().clearSession()

      if (!window.location.pathname.startsWith("/sign-in")) {
        window.location.assign("/sign-in")
      }
    })
    .finally(() => {
      pendingUnauthorizedCheck = null
    })

  return pendingUnauthorizedCheck
}

export class ApiClient {
  constructor(private readonly baseUrl = "") {}

  async request<T>(path: string, options: ApiClientOptions = {}): Promise<T> {
    const { body, headers, ...rest } = options;

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...rest,
      body: isPlainObject(body) ? JSON.stringify(body) : body,
      headers: {
        ...(isPlainObject(body) ? { "Content-Type": "application/json" } : {}),
        ...headers,
      },
    });

    const data = await parseResponse(response);

    if (!response.ok) {
      if (response.status === 401) {
        handleUnauthorizedResponse()
      }

      throw new ApiError(
        typeof data === "string" ? data : "Request failed",
        response.status,
        data,
      );
    }

    return data as T;
  }

  get<T>(path: string, options?: Omit<ApiClientOptions, "method" | "body">) {
    return this.request<T>(path, { ...options, method: "GET" });
  }

  post<T>(path: string, body?: ApiClientOptions["body"], options?: ApiClientOptions) {
    return this.request<T>(path, { ...options, method: "POST", body });
  }

  patch<T>(path: string, body?: ApiClientOptions["body"], options?: ApiClientOptions) {
    return this.request<T>(path, { ...options, method: "PATCH", body });
  }

  delete<T>(path: string, body?: ApiClientOptions["body"], options?: ApiClientOptions) {
    return this.request<T>(path, { ...options, method: "DELETE", body });
  }
}

export const apiClient = new ApiClient("/api");
