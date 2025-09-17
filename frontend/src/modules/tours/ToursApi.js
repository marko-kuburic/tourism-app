const API_BASE =
  import.meta.env.VITE_TOURS_BASE ||
  import.meta.env.VITE_TOURS_API_URL ||
  '/api-tours';

function authHeaders() {
  const t = localStorage.getItem('auth_token');
  return t ? { Authorization: `Bearer ${t}` } : {};
}

async function apiFetch(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...authHeaders(),
    ...(options.headers || {}),
  };
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const ct = res.headers.get('content-type') || '';
      msg = ct.includes('application/json')
        ? (await res.json()).message || (await res.json()).error || msg
        : await res.text() || msg;
    } catch {}
    throw new Error(msg);
  }
  return res.status === 204 ? null : res.json();
}

export const ToursAPI = {
  list() {
    return apiFetch('/tours');
  },
  // expects a fully-formed body from the caller
  create(body) {
    return apiFetch('/tours', { method: 'POST', body: JSON.stringify(body) });
  },
  get(id) {
    return apiFetch(`/tours/${id}`);
  },
  remove(id) {
    return apiFetch(`/tours/${id}`, { method: 'DELETE' });
  },
};
