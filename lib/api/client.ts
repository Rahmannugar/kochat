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
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function parseResponse(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  return response.text();
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

  delete<T>(path: string, options?: Omit<ApiClientOptions, "method" | "body">) {
    return this.request<T>(path, { ...options, method: "DELETE" });
  }
}

export const apiClient = new ApiClient("/api");
