const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

async function request(path, { method = 'GET', token, body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      if (data?.error) message = data.error;
    } catch {
      // response wasn't JSON -- keep the generic message
    }
    throw new Error(message);
  }

  if (res.status === 204) return null;
  return res.json();
}

function query(params = {}) {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== '');
  const qs = new URLSearchParams(entries).toString();
  return qs ? `?${qs}` : '';
}

export const api = {
  register: (email, password, displayName) =>
    request('/api/auth/register', { method: 'POST', body: { email, password, displayName } }),

  login: (email, password) =>
    request('/api/auth/login', { method: 'POST', body: { email, password } }),

  listBooks: (token, params = {}) => request(`/api/books${query(params)}`, { token }),

  getBook: (token, id) => request(`/api/books/${id}`, { token }),

  createBook: (token, data) => request('/api/books', { method: 'POST', token, body: data }),

  updateBook: (token, id, data) => request(`/api/books/${id}`, { method: 'PUT', token, body: data }),

  deleteBook: (token, id) => request(`/api/books/${id}`, { method: 'DELETE', token }),

  markPurchased: (token, id, pricePaid) =>
    request(`/api/books/${id}/mark-purchased${query({ pricePaid })}`, { method: 'POST', token }),

  lookupIsbn: (token, isbn) => request(`/api/books/lookup/${encodeURIComponent(isbn)}`, { token }),

  addFromIsbn: (token, isbn, status = 'owned') =>
    request(`/api/books/from-isbn/${encodeURIComponent(isbn)}${query({ status })}`, { method: 'POST', token }),

  getResearch: (token, id) => request(`/api/books/${id}/research`, { token }),

  runResearch: (token, id, forceRefresh = false) =>
    request(`/api/books/${id}/research${query({ forceRefresh })}`, { method: 'POST', token }),
};
