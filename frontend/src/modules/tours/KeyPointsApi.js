// src/modules/tours/KeyPointsApi.js
const API_BASE = import.meta.env.VITE_TOURS_BASE
  || import.meta.env.VITE_TOURS_API_URL
  || '/api-tours';

function authHeaders() {
  const t = localStorage.getItem('auth_token');
  return t ? { Authorization: `Bearer ${t}` } : {};
}

async function apiFetch(url, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...authHeaders(),
    ...(options.headers || {}),
  };
  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      if (data?.message || data?.error) msg = data.message || data.error;
    } catch {}
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }
  if (res.status === 204) return null;
  return res.json();
}

// kandidati za rute (probamo redom dok jedna ne prođe)
const KP_PATHS = [
  (id) => `/tours/${id}/keypoints`,
  (id) => `/tours/${id}/key-points`,
  (id) => `/api/tours/${id}/keypoints`,
  (id) => `/api/v1/tours/${id}/key-points`,
];

const resolved = { pathFn: null }; // kada otkrijemo ispravnu rutu, čuvamo je

async function resolveList(tourId) {
  if (resolved.pathFn) return resolved.pathFn;

  for (const make of KP_PATHS) {
    try {
      // probaj GET liste — ako uspe, zaključamo ovu putanju
      await apiFetch(`${API_BASE}${make(tourId)}`, { method: 'GET' });
      resolved.pathFn = make;
      return make;
    } catch (e) {
      if (e.status === 404) continue;
      // za 401/403 ne odustaj odmah, ali i dalje pokušaj sledeće
      if (e.status === 401 || e.status === 403) {
        // i dalje setuj pathFn — ruta postoji, samo nemaš prava
        resolved.pathFn = make;
        return make;
      }
    }
  }
  throw new Error('Key points endpoint not found');
}

export const KeyPointsAPI = {
  async list(tourId) {
    try {
      const make = await resolveList(tourId);
      return apiFetch(`${API_BASE}${make(tourId)}`);
    } catch (e) {
      if (e.status === 404) return []; // nema tačaka još uvek
      throw e;
    }
  },
  async create(tourId, body) {
    const make = await resolveList(tourId);
    return apiFetch(`${API_BASE}${make(tourId)}`, {
      method: 'POST', body: JSON.stringify(body)
    });
  },
  async update(tourId, keyPointId, body) {
    const make = await resolveList(tourId);
    const base = make(tourId);
    // podrži i /keypoints/:id i /key-points/:id
    const url = base.replace(/\/key-?points$/, (m) => `${m}/${keyPointId}`);
    return apiFetch(`${API_BASE}${url}`, {
      method: 'PUT', body: JSON.stringify(body)
    });
  },
  async remove(tourId, keyPointId) {
    const make = await resolveList(tourId);
    const base = make(tourId);
    const url = base.replace(/\/key-?points$/, (m) => `${m}/${keyPointId}`);
    return apiFetch(`${API_BASE}${url}`, { method: 'DELETE' });
  },
};
