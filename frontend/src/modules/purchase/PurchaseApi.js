const API_BASE = (import.meta.env.VITE_PURCHASE_API_URL || 'http://localhost:8080/purchase')
  .replace(/\/+$/, ''); // skini trailing slash

function authHeaders() {
  const t = localStorage.getItem('auth_token');
  console.log('Auth token:', t ? 'postoji' : 'ne postoji');
  return t ? { Authorization: `Bearer ${t}` } : {};
}

async function apiFetch(path, options = {}) {
  const url = `${API_BASE}${path}`;
  
  // Dodaj timeout od 10 sekundi
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);
  
  try {
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json', ...authHeaders(), ...(options.headers || {}) },
      signal: controller.signal,
      ...options
    });
    clearTimeout(timeoutId);
    
    if (!res.ok) {
      let msg = `HTTP ${res.status}`;
      try { msg = (await res.text()) || msg; } catch {}
      throw new Error(msg);
    }
    return res.json();
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Zahtev je prekinut zbog timeout-a (10s)');
    }
    throw error;
  }
}


export const PurchaseAPI = {
  getCart() { return apiFetch('/cart'); },
  addItem(tourId) { return apiFetch('/cart/items', { method:'POST', body: JSON.stringify({ tourId }) }); },
  removeItem(itemId) { return apiFetch(`/cart/items/${itemId}`, { method:'DELETE' }); },
  checkout() { return apiFetch('/cart/checkout', { method:'POST' }); },
  hasOwnership(tourId) { return apiFetch(`/ownership/tours/${tourId}`); },
  tokens() { return apiFetch('/tokens'); }
};
