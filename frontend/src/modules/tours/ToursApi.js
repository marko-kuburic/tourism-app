
const ROOT = (import.meta?.env?.VITE_API_BASE_URL) || 'http://localhost:8080';
const API_BASE = `${ROOT}/api-tours`;

console.log('ToursAPI BASE URL:', API_BASE);

function authHeader() {
  const t = localStorage.getItem('auth_token');
  return t ? { Authorization: `Bearer ${t}` } : {};
}

async function apiFetch(path, options = {}) {
  console.log('apiFetch pozvan sa path:', path);
  console.log('apiFetch API_BASE:', API_BASE);
  console.log('apiFetch finalni URL:', `${API_BASE}${path}`);
  
  const headers = {
    'Content-Type': 'application/json',
    ...authHeader(),
    ...(options.headers || {}),
  };

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (!res.ok) {
    try {
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('application/json')) {
        const b = await res.json();
        throw new Error(b.message || b.error || `HTTP ${res.status}`);
      }
      throw new Error((await res.text()) || `HTTP ${res.status}`);
    } catch {
      throw new Error(`HTTP ${res.status}`);
    }
  }

  if (res.status === 204) return null;
  return res.json();
}

export const ToursAPI = {
  async list() {
    const data = await apiFetch('/tours');
    // gRPC ListTours response is { items: [...] }
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.items)) return data.items;
    return [];
  },

  async create(body) {
    // body must contain: { name, description, priceCents, difficulty, [status], [tags] }
    const data = await apiFetch('/tours', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    // gRPC CreateTour response is { tour: {...}, requestId: "..." }
    return data?.tour || data;
  },

  get(id) {
    return apiFetch(`/tours/${id}`);
  },

  remove(id) {
    return apiFetch(`/tours/${id}`, { method: 'DELETE' });
  },
    // Reviews
    getReviews(tourId) {
      return apiFetch(`/tours/${tourId}/reviews`);
    },
    addReview(tourId, body) {
      console.log('addReview pozvan sa:', { tourId, body });
      const url = `/tours/${tourId}/reviews`;
      console.log('addReview URL:', url);
      return apiFetch(url, { method: 'POST', body: JSON.stringify(body) });
    },

    listPublic() {
      return apiFetch(`/tours/public`);
    },

    publish(id, body) {
      return apiFetch(`/tours/${id}/publish`, { method: 'POST', body: JSON.stringify(body) });
    },
    archive(id) {
      return apiFetch(`/tours/${id}/archive`, { method: 'POST' });
    },
    unarchive(id) {
      return apiFetch(`/tours/${id}/unarchive`, { method: 'POST' });
    }

};
