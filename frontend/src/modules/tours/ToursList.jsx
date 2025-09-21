// src/modules/tours/ToursList.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ToursAPI } from "./ToursApi";
import TourReviews from "./TourReviews";
import AddTourReview from "./AddTourReview";

function TourCard({ tour }) {
  const [reviews, setReviews] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await ToursAPI.getReviews(tour.id);
        setReviews(Array.isArray(data) ? data : []);
      } catch {}
      setLoading(false);
    })();
  }, [tour.id]);

  const created = tour?.createdAt ? new Date(tour.createdAt).toLocaleString() : "-";
  const updated = tour?.updatedAt ? new Date(tour.updatedAt).toLocaleString() : null;
  const tags = Array.isArray(tour?.tags) ? tour.tags : (tour?.tags ? Array.from(tour.tags) : []);

  return (
    <article key={tour.id} className="t-card">
      <header className="t-card-head">
        <h2 className="t-card-title">{tour.name}</h2>
        <span className="t-badge">{tour.status || "DRAFT"}</span>
      </header>

      {tour.description && <p className="t-desc">{tour.description}</p>}

      <div className="t-meta">
        <span>Difficulty: {tour.difficulty || "-"}</span>
        <span>Price: € {centsToMoney(tour.priceCents)}</span>
      </div>

      {tags.length > 0 && (
        <div className="t-tags">
          {tags.map((tag) => (
            <span key={tag} className="t-tag">#{tag}</span>
          ))}
        </div>
      )}

      {/* Reviews section */}
      {loading ? <div>Loading reviews...</div> : <TourReviews reviews={reviews} />}
      <AddTourReview tourId={tour.id} onReviewAdded={review => setReviews(prev => [review, ...prev])} />

      <footer className="t-footer">
        <small className="t-muted">
          created {created}
          {updated && ` • updated ${updated}`}
        </small>
      </footer>
    </article>
  );
// kraj TourCard
}
import "../../styles/tours.css";
import { getProfile } from "../auth/api";

function centsToMoney(cents) {
  if (cents == null || Number.isNaN(Number(cents))) return "-";
  return (Number(cents) / 100).toFixed(2);
}

export default function ToursList() {
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [profile, setProfile] = useState(null);

  async function load() {
    try {
      setLoading(true);
      setErr("");
      const [data, me] = await Promise.all([
        ToursAPI.list(),                // GET /tours (preko /api-tours)
        getProfile().catch(() => null), // ko je ulogovan
      ]);
      setTours(Array.isArray(data) ? data : []);
      setProfile(me);
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

            const isAuthor = profile && String(profile.id) === String(t.authorId);

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

                {/* >>> DODATA DUGMAD <<< */}
              

                <div className="t-actions" style={{ marginTop: 10, display: "flex", gap: 8 }}>
                  
                  {isAuthor && (profile.role === "guide" || profile.role === "admin") && (
                    <Link className="t-btn" to={`/tours/${t.id}`}>View</Link>
                  )}
                </div>

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
