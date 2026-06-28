const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.status  = status;
    this.details = details;
  }
}

let isRefreshing  = false;
let refreshQueue  = [];

function flushQueue(error) {
  refreshQueue.forEach(({ resolve, reject }) =>
    error ? reject(error) : resolve()
  );
  refreshQueue = [];
}

async function refreshAccessToken() {
  const res = await fetch(`${API_URL}/auth/refresh`, {
    method:      "POST",
    credentials: "include",
  });
  if (!res.ok) throw new ApiError("Session expired. Please login again.", 401);
}

async function request(
  path,
  { method = "GET", body, headers = {} } = {},
  retry = true
) {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    credentials: "include",
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = null;
  const text = await res.text();
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  // 401 → refresh once then retry
  if (res.status === 401 && retry) {
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        refreshQueue.push({ resolve, reject });
      }).then(() => request(path, { method, body, headers }, false));
    }

    isRefreshing = true;
    try {
      await refreshAccessToken();
      flushQueue(null);
      return request(path, { method, body, headers }, false);
    } catch (err) {
      flushQueue(err);
      if (typeof window !== "undefined") window.location.href = "/login";
      throw new ApiError("Session expired. Please login again.", 401);
    } finally {
      isRefreshing = false;
    }
  }

  if (!res.ok) {
    throw new ApiError(
      data?.error || "Something went wrong. Please try again.",
      res.status,
      data?.details
    );
  }

  return data;
}

export const api = {
  get:    (path)        => request(path),
  post:   (path, body)  => request(path, { method: "POST",   body }),
  put:    (path, body)  => request(path, { method: "PUT",    body }),
  patch:  (path, body)  => request(path, { method: "PATCH",  body }),
  delete: (path, body)  => request(path, { method: "DELETE", body }), // body optional
};

export { ApiError, API_URL };