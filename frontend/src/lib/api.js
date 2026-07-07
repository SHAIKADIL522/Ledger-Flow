const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.status  = status;
    this.details = details;
  }
}

let isRefreshing = false;
// Each queued entry holds resolve/reject so the original caller gets the
// actual response (or error) once refresh completes — not just undefined.
let refreshQueue = [];

function flushQueue(error) {
  const q = refreshQueue;
  refreshQueue = [];
  q.forEach(({ resolve, reject }) => (error ? reject(error) : resolve()));
}

// Single-flight flag so we only redirect once even if many requests fail.
let redirecting = false;
function redirectToLogin() {
  if (redirecting) return;
  redirecting = true;
  if (typeof window !== "undefined" && window.location.pathname !== "/login") {
    window.location.href = "/login";
  }
}

async function refreshAccessToken() {
  const res = await fetch(`${API_URL}/auth/refresh`, {
    method:      "POST",
    credentials: "include",
  });

  // Rate-limited — this is NOT a session failure. Don't treat it as one.
  if (res.status === 429) {
    throw new ApiError("Too many requests. Please wait a moment and try again.", 429);
  }

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

  // 401 → attempt token refresh exactly once, then retry original request.
  if (res.status === 401 && retry) {
    // Another request is already refreshing — join the queue and wait.
    // When refresh resolves, re-fire this request ourselves (don't rely on
    // the queue flush to return the response — it can't, promises resolve void).
    if (isRefreshing) {
      await new Promise((resolve, reject) =>
        refreshQueue.push({ resolve, reject })
      );
      // Refresh succeeded (otherwise the promise above threw) — retry once.
      return request(path, { method, body, headers }, false);
    }

    isRefreshing = true;
    try {
      await refreshAccessToken();
      flushQueue(null);
      // Retry this request now that we have a fresh access token.
      return request(path, { method, body, headers }, false);
    } catch (err) {
      flushQueue(err);
      // Only redirect to /login on an actual auth failure. A 429 (rate
      // limit) or any other transient error should surface to the caller
      // instead of nuking the session and bouncing the user out.
      if (err.status === 401) redirectToLogin();
      throw err;
    } finally {
      // Reset only after flush + retry so any new 401 that arrives while
      // this request re-fires doesn't kick off a second refresh race.
      isRefreshing  = false;
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
  get:    (path)       => request(path),
  post:   (path, body) => request(path, { method: "POST",   body }),
  put:    (path, body) => request(path, { method: "PUT",    body }),
  patch:  (path, body) => request(path, { method: "PATCH",  body }),
  delete: (path, body) => request(path, { method: "DELETE", body }),
};

export { ApiError, API_URL };