// src/modules/tours/ToursList.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ToursAPI } from "./ToursApi";
import "../../styles/tours.css";

function centsToMoney(cents) {
  if (cents == null || Number.isNaN(Number(cents))) return "-";
  return (Number(cents) / 100).toFixed(2);
}

export default function ToursList() {
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  async function load() {
    try {
      setLoading(true);
      setErr("");
      const data = await ToursAPI.list(); // GET /tours (preko /api-tours proxyja)
      setTours(Array.isArray(data) ? data : []);
    } catch (e) {
      setErr(e.message || "Failed to load tours.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <div className="t-container">
        <p>Loading…</p>
      </div>
    );
  }

  if (err) {
    return (
      <div className="t-container">
        <div className="t-alert">{err}</div>
      </div>
    );
  }

  return (
    <div className="t-container">
      <div className="t-header">
        <h1 className="t-title">Tours</h1>
        <Link className="t-btn" to="/tours/new">+ New Tour</Link>
      </div>

      {tours.length === 0 ? (
        <div className="t-empty">No tours yet. Create your first one.</div>
      ) : (
        <div className="t-grid-cards">
          {tours.map((t) => {
            const created = t?.createdAt ? new Date(t.createdAt).toLocaleString() : "-";
            const updated = t?.updatedAt ? new Date(t.updatedAt).toLocaleString() : null;
            const tags = Array.isArray(t?.tags) ? t.tags : (t?.tags ? Array.from(t.tags) : []);

            return (
              <article key={t.id} className="t-card">
                <header className="t-card-head">
                  <h2 className="t-card-title">{t.name}</h2>
                  <span className="t-badge">{t.status || "DRAFT"}</span>
                </header>

                {t.description && <p className="t-desc">{t.description}</p>}

                <div className="t-meta">
                  <span>Difficulty: {t.difficulty || "-"}</span>
                  <span>Price: € {centsToMoney(t.priceCents)}</span>
                </div>

                {tags.length > 0 && (
                  <div className="t-tags">
                    {tags.map((tag) => (
                      <span key={tag} className="t-tag">#{tag}</span>
                    ))}
                  </div>
                )}

                <footer className="t-footer">
                  <small className="t-muted">
                    created {created}
                    {updated && ` • updated ${updated}`}
                  </small>
                </footer>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
