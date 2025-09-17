import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getBlogFeed, like as likeApi, unlike as unlikeApi } from './blogApi.js';
// Ako tvoj getProfile nije na ovoj putanji, samo promeni import putanju:
import { getProfile } from '../api.js';

export default function BlogFeed() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [blogs, setBlogs] = useState([]);
  const [me, setMe] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      navigate('/login', { replace: true });
      return;
    }
    let mounted = true;
    (async () => {
      try {
        const [profile, feed] = await Promise.all([getProfile(), getBlogFeed(100)]);
        if (!mounted) return;
        setMe(profile || null);
        setBlogs(Array.isArray(feed) ? feed : []);
      } catch (e) {
        if (!mounted) return;
        setError(e.message || 'Failed to load feed');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; }
  }, [navigate]);

  const myId = useMemo(() => me?.id || me?.ID || me?.Id, [me]);

  async function toggleLike(b) {
    try {
      const isLiked = Array.isArray(b.likes) && myId && b.likes.includes(myId);
      const updated = isLiked ? await unlikeApi(b.id) : await likeApi(b.id);
      setBlogs(curr => curr.map(x => (x.id === b.id
        ? (updated?.id ? updated : {
            ...x,
            likes: Array.isArray(x.likes)
              ? (isLiked ? x.likes.filter(i => i !== myId) : [...x.likes, myId])
              : (isLiked ? [] : [myId])
          })
        : x)));
    } catch (e) {
      alert(e.message || 'Greška pri lajku');
    }
  }

  if (loading) return <div className="muted">Loading feed…</div>;
  if (error) return <div className="error">{error}</div>;
  if (!blogs.length) return <div className="muted">No blog posts yet. Follow someone to see their posts.</div>;

  return (
    <div className="grid" style={{ gap: 16 }}>
      <h2>Blog feed</h2>
      {blogs.map(b => (
        <article key={b.id} className="card" style={{ padding: 16 }}>
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0 }}>{b.title}</h3>
            <small className="muted">{new Date(b.created_at || b.createdAt).toLocaleString()}</small>
          </header>
          <div
            className="prose"
            style={{ marginTop: 8 }}
            dangerouslySetInnerHTML={{ __html: b.description_html || b.descriptionHtml || '' }}
          />
          <footer style={{ display: 'flex', gap: 12, marginTop: 12, alignItems: 'center' }}>
            <button onClick={() => toggleLike(b)}>
              {Array.isArray(b.likes) && myId && b.likes.includes(myId) ? 'Unlike' : 'Like'}
            </button>
            <span className="muted">{Array.isArray(b.likes) ? b.likes.length : 0} likes</span>
            <Link to={`/blog/${b.id}`} style={{ marginLeft: 'auto' }}>Open</Link>
          </footer>
        </article>
      ))}
    </div>
  );
}
