const API_BASE = (import.meta.env.VITE_PURCHASE_API_URL || 'http://localhost:8080/purchase')
  .replace(/\/+$/, ''); // skini trailing slash

function authHeaders() {
  const t = localStorage.getItem('auth_token');
  return t ? { Authorization: `Bearer ${t}` } : {};
}

async function apiFetch(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...authHeaders(), ...(options.headers || {}) },
    ...options
  });
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try { msg = (await res.text()) || msg; } catch {}
    throw new Error(msg);
  }
  return res.json();
}


export const PurchaseAPI = {
  getCart() { return apiFetch('/cart'); },
  addItem(tourId) { return apiFetch('/cart/items', { method:'POST', body: JSON.stringify({ tourId }) }); },
  removeItem(itemId) { return apiFetch(`/cart/items/${itemId}`, { method:'DELETE' }); },
  checkout() { return apiFetch('/cart/checkout', { method:'POST' }); },
  hasOwnership(tourId) { return apiFetch(`/ownership/tours/${tourId}`); },
  tokens() { return apiFetch('/tokens'); }
};
