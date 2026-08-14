/**
 * Central HTTP API client for SpecTrace Frontend.
 * Communicates with backend endpoints at VITE_API_URL (default: http://localhost:3000/api).
 */

const API_BASE_URL = (
  (import.meta.env['VITE_API_URL'] as string | undefined) || "http://localhost:3000/api"
).replace(/\/$/, "");

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface ApiResponseEnvelope<T> {
  success: boolean;
  data?: T;
  meta?: Record<string, unknown>;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

async function handleResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type") || "";

  if (response.status === 204) {
    return {} as T;
  }

  if (contentType.includes("application/json")) {
    const json: ApiResponseEnvelope<T> = await response.json();
    if (!response.ok || json.success === false) {
      const code = json.error?.code || `HTTP_${response.status}`;
      const message =
        json.error?.message ||
        getHttpErrorMessage(response.status, response.statusText);
      throw new ApiError(response.status, code, message, json.error?.details);
    }
    return (json.data !== undefined ? json.data : json) as T;
  }

  if (!response.ok) {
    const text = await response.text();
    throw new ApiError(
      response.status,
      `HTTP_${response.status}`,
      text || getHttpErrorMessage(response.status, response.statusText),
    );
  }

  return (await response.text()) as unknown as T;
}

function getHttpErrorMessage(status: number, statusText: string): string {
  switch (status) {
    case 400:
      return "Bad Request — Invalid parameters provided.";
    case 404:
      return "Resource not found.";
    case 409:
      return "Conflict — Resource with this identifier already exists.";
    case 413:
      return "File too large — Exceeds maximum upload limit.";
    case 415:
      return "Unsupported Media Type — Format not accepted.";
    case 422:
      return "Unprocessable Entity — Validation failed.";
    case 502:
      return "Bad Gateway — External service failure.";
    case 503:
      return "Service Unavailable — External service or database unconfigured.";
    default:
      return statusText || `Request failed with status ${status}`;
  }
}

export async function apiGet<T>(
  path: string,
  params?: Record<string, string | number | boolean | undefined>,
): Promise<T> {
  const url = new URL(
    path.startsWith("http")
      ? path
      : `${API_BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`,
  );

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });
  }

  try {
    const res = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });
    return await handleResponse<T>(res);
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(
      0,
      "NETWORK_ERROR",
      `Failed to connect to backend service at ${url.host}. Please check server status.`,
      err,
    );
  }
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  const url = `${API_BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
  try {
    const fetchOptions: RequestInit = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    };
    if (body !== undefined) fetchOptions.body = JSON.stringify(body);
    const res = await fetch(url, fetchOptions);
    return await handleResponse<T>(res);
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(
      0,
      "NETWORK_ERROR",
      "Network request failed. Please verify API connection.",
      err,
    );
  }
}

export async function apiPostForm<T>(
  path: string,
  formData: FormData,
  queryParams?: Record<string, string>,
): Promise<T> {
  const url = new URL(
    `${API_BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`,
  );
  if (queryParams) {
    Object.entries(queryParams).forEach(([k, v]) => url.searchParams.append(k, v));
  }

  try {
    const res = await fetch(url.toString(), {
      method: "POST",
      // Do not set Content-Type header when sending FormData — browser will set multipart boundary
      headers: {
        Accept: "application/json",
      },
      body: formData,
    });
    return await handleResponse<T>(res);
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(
      0,
      "NETWORK_ERROR",
      "Upload request failed. Please check your connection.",
      err,
    );
  }
}

export async function apiPatch<T>(path: string, body: unknown): Promise<T> {
  const url = `${API_BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
  try {
    const res = await fetch(url, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    });
    return await handleResponse<T>(res);
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(
      0,
      "NETWORK_ERROR",
      "Update request failed. Please verify API connection.",
      err,
    );
  }
}

export async function apiDelete<T>(path: string): Promise<T> {
  const url = `${API_BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
  try {
    const res = await fetch(url, {
      method: "DELETE",
      headers: {
        Accept: "application/json",
      },
    });
    return await handleResponse<T>(res);
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(
      0,
      "NETWORK_ERROR",
      "Delete request failed. Please verify API connection.",
      err,
    );
  }
}

export async function apiDownloadBlob(
  path: string,
  filename: string,
): Promise<void> {
  const url = `${API_BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new ApiError(
        res.status,
        `EXPORT_ERROR`,
        `Export failed with status ${res.status}`,
      );
    }
    const blob = await res.blob();
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(0, "DOWNLOAD_FAILED", "Failed to download export file.", err);
  }
}
