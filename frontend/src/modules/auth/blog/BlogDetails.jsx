import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getBlog, listComments, addComment, like as likeApi, unlike as unlikeApi } from './blogApi.js';
// Ako tvoj getProfile nije na ovoj putanji, samo promeni import putanju:
import { getProfile } from '../api.js';
import {  updateComment, deleteComment } from './blogApi.js';


export default function BlogDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [blog, setBlog] = useState(null);
  const [comments, setComments] = useState([]);
  const [comment, setComment] = useState('');
  const [me, setMe] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      navigate('/login', { replace: true });
      return;
    }
    let mounted = true;
    (async () => {
      try {
        const profile = await getProfile();
        const b = await getBlog(id);
        const cs = await listComments(id);
        if (!mounted) return;
        setMe(profile || null);
        setBlog(b || null);
        setComments(Array.isArray(cs) ? cs : []);
      } catch (e) {
        if (!mounted) return;
        setError(e.message || 'Failed to load blog');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; }
  }, [id, navigate]);

  const myId = useMemo(() => me?.id || me?.ID || me?.Id, [me]);

  async function submitComment(e) {
    e.preventDefault();
    const text = comment.trim();
    if (!text) return;
    try {
      const created = await addComment(id, text);
      setComments(curr => [created, ...curr]);
      setComment('');
    } catch (e) {
      alert(e.message || 'Greška pri slanju komentara');
    }
  }

  async function toggleLike() {
    try {
      const isLiked = Array.isArray(blog?.likes) && myId && blog.likes.includes(myId);
      const updated = isLiked ? await unlikeApi(id) : await likeApi(id);
      setBlog(prev => updated?.id ? updated : {
        ...prev,
        likes: Array.isArray(prev.likes)
          ? (isLiked ? prev.likes.filter(i => i !== myId) : [...prev.likes, myId])
          : (isLiked ? [] : [myId]),
      });
    } catch (e) {
      alert(e.message || 'Greška pri lajku');
    }
  }

   function startEdit(c) {
  setEditingId(c.id || c._id);
  setEditingText(c.text || '');
}

function cancelEdit() {
  setEditingId(null);
  setEditingText('');
}

async function saveEdit(c) {
  try {
    const cid = c.id || c._id;
    const updated = await updateComment(id, cid, editingText.trim());
    setComments(curr => curr.map(x =>
      ( (x.id||x._id) === cid ? { ...x, text: updated.text ?? editingText } : x )
    ));
    cancelEdit();
  } catch (e) {
    alert(e.message || 'Greška pri izmeni komentara');
  }
}

async function removeComment(c) {
  if (!confirm('Obrisati komentar?')) return;
  try {
    const cid = c.id || c._id;
    await deleteComment(id, cid);
    setComments(curr => curr.filter(x => (x.id||x._id) !== cid));
  } catch (e) {
    alert(e.message || 'Greška pri brisanju komentara');
  }
}



  if (loading) return <div className="muted">Loading…</div>;
  if (error) return <div className="error">{error}</div>;
  if (!blog) return <div className="muted">Not found</div>;

  return (
    <div className="grid" style={{ gap: 16 }}>
      <article className="card" style={{ padding: 16 }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0 }}>{blog.title}</h2>
          <small className="muted">{new Date(blog.created_at || blog.createdAt).toLocaleString()}</small>
        </header>
        <div
          className="prose"
          style={{ marginTop: 8 }}
          dangerouslySetInnerHTML={{ __html: blog.description_html || blog.descriptionHtml || '' }}
        />
        <footer style={{ display: 'flex', gap: 12, marginTop: 12, alignItems: 'center' }}>
          <button onClick={toggleLike}>
            {Array.isArray(blog.likes) && myId && blog.likes.includes(myId) ? 'Unlike' : 'Like'}
          </button>
          <span className="muted">{Array.isArray(blog.likes) ? blog.likes.length : 0} likes</span>
        </footer>
      </article>

      <section className="card" style={{ padding: 16 }}>
        <h3>Comments</h3>
        <form onSubmit={submitComment} style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <input
            placeholder="Write a comment…"
            value={comment}
            onChange={e => setComment(e.target.value)}
            style={{ flex: 1 }}
          />
          <button type="submit">Post</button>
        </form>
        <div className="stack" style={{ display: 'grid', gap: 12 }}>
          {comments.length === 0 && <div className="muted">No comments yet.</div>}
          {/* {comments.map(c => (
            <div key={c.id} className="row" style={{ borderTop: '1px solid #eee', paddingTop: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong>#{c.author_id?.slice(0,8) || c.authorId?.slice(0,8)}</strong>
                <small className="muted">
                  {new Date(c.updated_at || c.updatedAt || c.created_at || c.createdAt).toLocaleString()}
                </small>
              </div>
              <p style={{ margin: '4px 0 0' }}>{c.text}</p>
            </div>
          ))} */}
            {comments.map(c => {
            const cid = c.id || c._id;
            const isMine = (c.author_id || c.authorId) === myId;

            return (
                <div key={cid} className="row" style={{ borderTop: '1px solid #eee', paddingTop: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    <strong>#{(c.author_id || c.authorId || '').slice(0,8)}</strong>
                    <small className="muted">
                    {new Date(c.updated_at || c.updatedAt || c.created_at || c.createdAt).toLocaleString()}
                    </small>
                </div>

                {editingId === cid ? (
                    <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                    <input
                        value={editingText}
                        onChange={e => setEditingText(e.target.value)}
                        style={{ flex: 1 }}
                    />
                    <button onClick={() => saveEdit(c)}>Save</button>
                    <button type="button" onClick={cancelEdit}>Cancel</button>
                    </div>
                ) : (
                    <p style={{ margin: '4px 0 0' }}>{c.text}</p>
                )}

                {isMine && editingId !== cid && (
                    <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                    <button onClick={() => startEdit(c)}>Edit</button>
                    <button onClick={() => removeComment(c)}>Delete</button>
                    </div>
                )}
                </div>
            );
            })}



        </div>
      </section>
    </div>
  );
}
