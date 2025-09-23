// src/modules/auth/api.js
const ROOT = (import.meta?.env?.VITE_API_BASE_URL) || 'http://localhost:8080';

// Service bases (go through gateway)
const STAKE = `${ROOT}/api/stakeholders`;
const FOLLOW = `${ROOT}/api/following`;

function authHeader() {
  const t = localStorage.getItem('auth_token');
  return t ? { Authorization: `Bearer ${t}` } : {};
}

function jsonHeaders(extra = {}) {
  return { 'Content-Type': 'application/json', ...authHeader(), ...extra };
}

async function handle(res, fallbackMsg) {
  if (res.ok) return res.status === 204 ? null : res.json();
  try {
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      const b = await res.json();
      throw new Error(b.error || b.message || fallbackMsg || `HTTP ${res.status}`);
    }
    const t = await res.text();
    throw new Error(t || fallbackMsg || `HTTP ${res.status}`);
  } catch {
    throw new Error(fallbackMsg || `HTTP ${res.status}`);
  }
}

export async function login(payload) {
  const res = await fetch(`${STAKE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handle(res, 'Login failed');
}

export async function register(payload) {
  const res = await fetch(`${STAKE}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handle(res, 'Register failed');
}

export async function getProfile() {
  const res = await fetch(`${STAKE}/me`, {
    headers: jsonHeaders(),
  });
  return handle(res, 'Failed to fetch profile');
}

// Normalizacija uloge (tako da radi sa 'guide', 'admin', 'tourist')
export function normalizeRole(profile) {
  if (!profile) return "";
  const raw =
    profile.role ??
    profile.Role ??
    (Array.isArray(profile.roles) && profile.roles[0]) ??
    (Array.isArray(profile.authorities) && profile.authorities[0]?.authority) ??
    "";
  return String(raw).toLowerCase().replace(/^role_/, "");
}


export async function updateProfile(payload) {
  // Filter out empty strings and only send fields that have values
  const filteredPayload = {};
  Object.keys(payload).forEach(key => {
    const value = payload[key];
    if (value !== null && value !== undefined && value !== '') {
      filteredPayload[key] = value;
    }
  });
  
  const res = await fetch(`${STAKE}/me`, {
    method: 'PUT',
    headers: jsonHeaders(),
    body: JSON.stringify(filteredPayload),
  });
  return handle(res, 'Failed to update profile');
}

export async function getAllUsers() {
  const res = await fetch(`${STAKE}/users`, {
    headers: jsonHeaders(),
  });
  return handle(res, 'Failed to fetch users');
}

export async function blockUser(userId) {
  const res = await fetch(`${STAKE}/block-user/${userId}`, {
    method: 'POST',
    headers: jsonHeaders(),
  });
  return handle(res, 'Failed to block user');
}

export async function getRecommendations() {
  const res = await fetch(`${FOLLOW}/recommendations`, {
    headers: authHeader(),
  });
  return handle(res, 'Failed to load recommendations');
}

export async function followUser(userId) {
  const res = await fetch(`${FOLLOW}/follow/${userId}`, {
    method: 'POST',
    headers: authHeader(),
  });
  return handle(res, 'Failed to follow user');
}

export async function uploadProfilePicture(file) {
  const formData = new FormData();
  formData.append('profile_picture', file);
  
  const res = await fetch(`${STAKE}/upload-profile-picture`, {
    method: 'POST',
    headers: authHeader(),
    body: formData,
  });
  return handle(res, 'Failed to upload profile picture');
}