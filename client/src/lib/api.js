export class ApiError extends Error {
  constructor(status, code, message, errors) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.errors = errors;
  }
}

export async function request(url, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const config = {
    ...options,
    headers
  };

  if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
    config.body = JSON.stringify(config.body);
  }

  const res = await fetch(url, config);
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const errInfo = data?.error || {};
    throw new ApiError(
      res.status,
      errInfo.code || 'UNKNOWN_ERROR',
      errInfo.message || `Permintaan gagal dengan status ${res.status}`,
      errInfo.errors
    );
  }

  return data;
}
