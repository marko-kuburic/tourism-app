const blogBaseUrl =
  (import.meta && import.meta.env && import.meta.env.VITE_BLOG_API_URL) ||
  '/api/blog'; // <-- default kroz gateway

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
  // Zadržano radi kompatibilnosti (kao pre) – javna lista /blogs
  const res = await fetch(`${blogBaseUrl}/blogs?limit=${encodeURIComponent(limit)}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to load feed (${res.status})`);
  return res.json();
}

// NOVO: eksplicitni feed sa following logikom (JWT obavezan) -> /blogs/feed
export async function getFeed(limit = 50) {
  const res = await fetch(`${blogBaseUrl}/blogs/feed?limit=${encodeURIComponent(limit)}`, {
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

// NOVO: kreiranje bloga
export async function createBlog({ title, description_md, images = [] }) {
  const res = await fetch(`${blogBaseUrl}/blogs`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ title, description_md, images }),
  });
  if (!res.ok) {
    let err = {};
    try { err = await res.json(); } catch {}
    throw new Error(err.error || err.message || `Failed to create blog (${res.status})`);
  }
  return res.json(); // očekuje se ceo Blog
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
    body: JSON.stringify({}), // ok i bez body-ja
  });
  if (!res.ok) {
    let err = {};
    try { err = await res.json(); } catch {}
    throw new Error(err.error || `Failed to like (${res.status})`);
  }
  return parseJsonSafe(res); // često 204, pa vraćamo null
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
    method: 'PATCH', // ili PUT, ali handler prima PATCH
    headers: getAuthHeaders(),
    body: JSON.stringify({ text }),
  });
  if (!res.ok) {
    let err = {};
    try { err = await res.json(); } catch {}
    throw new Error(err.error || `Failed to update comment (${res.status})`);
  }
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

export async function uploadBlogImage(file) {
  const fd = new FormData();
  fd.append("image", file);

  const res = await fetch(`${blogBaseUrl}/blogs/upload-image`, {
    method: "POST",
    headers: {
      // IMPORTANT: don't set Content-Type; browser will set multipart boundary
      ...(localStorage.getItem("auth_token") && {
        Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
      }),
    },
    body: fd,
  });

  if (!res.ok) {
    let err = {};
    try { err = await res.json(); } catch {}
    throw new Error(err.error || `Image upload failed (${res.status})`);
  }
  return res.json();
}

export async function uploadBlogImages(files = []) {
  const results = [];
  for (const f of files) {
    const r = await uploadBlogImage(f);
    if (r?.file_path) results.push(r.file_path);
  }
  return results;
}