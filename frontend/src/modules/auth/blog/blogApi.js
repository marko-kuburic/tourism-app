const blogBaseUrl =
  (import.meta && import.meta.env && import.meta.env.VITE_BLOG_API_URL) ||
  'http://localhost:8080';

function getAuthHeaders() {
  const token = localStorage.getItem('auth_token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}


async function parseJsonSafe(res) {
  const text = await res.text();
  if (!text) return null;
  try { return JSON.parse(text); } catch { return null; }
}

export async function getBlogFeed(limit = 50) {
  const res = await fetch(`${blogBaseUrl}/blogs?limit=${encodeURIComponent(limit)}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to load feed (${res.status})`);
  return res.json();
}

export async function listBlogs(limit = 50) {
  const res = await fetch(`${blogBaseUrl}/blogs?limit=${encodeURIComponent(limit)}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to list blogs (${res.status})`);
  return res.json();
}

export async function getBlog(id) {
  const res = await fetch(`${blogBaseUrl}/blogs/${encodeURIComponent(id)}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to load blog (${res.status})`);
  return res.json();
}

export async function listComments(blogId) {
  const res = await fetch(`${blogBaseUrl}/blogs/${encodeURIComponent(blogId)}/comments`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to load comments (${res.status})`);
  return res.json();
}

export async function addComment(blogId, text) {
  const res = await fetch(`${blogBaseUrl}/blogs/${encodeURIComponent(blogId)}/comments`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ text }),
  });
  if (!res.ok) {
    let err = {};
    try { err = await res.json(); } catch {}
    throw new Error(err.error || `Failed to add comment (${res.status})`);
  }
  return res.json();
}

export async function like(blogId) {
  const res = await fetch(`${blogBaseUrl}/blogs/${encodeURIComponent(blogId)}/like`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({}), // ok je i bez body-ja
  });
  if (!res.ok) {
    let err = {};
    try { err = await res.json(); } catch {}
    throw new Error(err.error || `Failed to like (${res.status})`);
  }
  return parseJsonSafe(res); // može biti null i to je ok
}

export async function unlike(blogId) {
  const res = await fetch(`${blogBaseUrl}/blogs/${encodeURIComponent(blogId)}/like`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    let err = {};
    try { err = await res.json(); } catch {}
    throw new Error(err.error || `Failed to unlike (${res.status})`);
  }
  return parseJsonSafe(res); // može biti null
}

export async function updateComment(blogId, commentId, text) {
  const res = await fetch(`${blogBaseUrl}/blogs/${encodeURIComponent(blogId)}/comments/${encodeURIComponent(commentId)}`, {
    method: 'PATCH', // ili PUT ako tako radi backend
    headers: getAuthHeaders(),
    body: JSON.stringify({ text }),
  });
  if (!res.ok) {
    let err = {};
    try { err = await res.json(); } catch {}
    throw new Error(err.error || `Failed to update comment (${res.status})`);
  }
  // mnogi backend-i vraćaju updated komentar; ako ne, vrati minimalno što imaš
  try { return await res.json(); } catch { return { id: commentId, text }; }
}

export async function deleteComment(blogId, commentId) {
  const res = await fetch(`${blogBaseUrl}/blogs/${encodeURIComponent(blogId)}/comments/${encodeURIComponent(commentId)}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    let err = {};
    try { err = await res.json(); } catch {}
    throw new Error(err.error || `Failed to delete comment (${res.status})`);
  }
  return true;
}
