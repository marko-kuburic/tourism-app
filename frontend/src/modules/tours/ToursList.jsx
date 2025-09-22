// src/modules/tours/ToursList.jsx
import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { ToursAPI } from "./ToursApi"; // tvoja funkcija za dobavljanje tura
import TourReviews from "./TourReviews";
import AddTourReview from "./AddTourReview";
import "../../styles/tours.css"; // tvoja stilizacija
import { getProfile } from "../auth/api"; // tvoje API funkcije za getProfile i ulogu

// Pretvori cente u valutu
function centsToMoney(cents) {
  if (cents == null || Number.isNaN(Number(cents))) return "-";
  return (Number(cents) / 100).toFixed(2);
}

// Helper za ulogu
function normalizeRole(profile) {
  if (!profile) return "";
  const raw =
    profile.role ??
    profile.Role ??
    (Array.isArray(profile.roles) && profile.roles[0]) ??
    (Array.isArray(profile.authorities) && profile.authorities[0]?.authority) ??
    "";
  return String(raw).toLowerCase().replace(/^role_/, "");
}

// Komponenta za prikaz ture
function TourCard({ tour, profile }) {
  const [reviews, setReviews] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await ToursAPI.getReviews(tour.id);
        setReviews(Array.isArray(data) ? data : []);
      } catch {
        // swallow error
      } finally {
        setLoading(false);
      }
    })();
  }, [tour.id]);

  const created = tour?.createdAt ? new Date(tour.createdAt).toLocaleString() : "-";
  const updated = tour?.updatedAt ? new Date(tour.updatedAt).toLocaleString() : null;
  const tags = Array.isArray(tour?.tags) ? tour.tags : (tour?.tags ? Array.from(tour.tags) : []);
  const role = profile?.role; // 'admin' | 'guide' | 'tourist' | undefined

  return (
    <article className="t-card">
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

      {/* Reviews */}
      {loading ? <div>Loading reviews...</div> : <TourReviews reviews={reviews} />}

      {/* Add review — samo za turiste */}
      {role === "tourist" && (
        <AddTourReview
          tourId={tour.id}
          onReviewAdded={(review) => setReviews((prev) => [review, ...prev])}
        />
      )}

      {/* Akcije */}
      <div className="t-actions" style={{ marginTop: 10, display: "flex", gap: 8 }}>
        {/* View — za admin/guide (bez obzira na authorId) */}
        {(role === "admin" || role === "guide") && (
          <Link className="t-btn" to={`/tours/${tour.id}`}>View</Link>
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
}

export default function ToursList() {
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [profile, setProfile] = useState(null);

  const role = normalizeRole(profile); // Uloga: "admin", "guide", "tourist"

  // Funkcija za učitavanje tura i profila
  async function load() {
    try {
      setLoading(true);
      setErr("");
      const [data, me] = await Promise.all([
        ToursAPI.list(),                // GET /tours
        getProfile().catch(() => null), // Ulogovani korisnik ili null
      ]);
      setTours(Array.isArray(data) ? data : []);
      setProfile(me);
    } catch (e) {
      setErr(e.message || "Failed to load tours.");
    } finally {
      setLoading(false);
    }
  }

  // Učitaj podatke kada se komponenta montira
  useEffect(() => {
    load();
  }, []);

  // 1) Filtriranje tura prema ulozi (samo autorove ture)
  const filteredTours = useMemo(() => {
    if (role === "guide" && profile?.id) {
      // Ako je korisnik autor (guide), prikazuje samo ture koje je on postavio
      return tours.filter((tour) => String(tour.authorId) === String(profile.id));
    }
    if (role === "admin") {
      // Admin vidi sve ture
      return tours;
    }
    // Turisti vide samo objavljene ture (ne DRAFT)
    return tours.filter((tour) => String(tour?.status || "").toUpperCase() !== "DRAFT");
  }, [tours, role, profile?.id]);

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
        {/* 2) "New Tour" dugme samo za guide/admin */}
        {(role === "guide" || role === "admin") && (
          <Link className="t-btn" to="/tours/new">+ New Tour</Link>
        )}
      </div>

      {filteredTours.length === 0 ? (
        <div className="t-empty">
          {role === "guide" ? "You have no tours yet." : "No tours available."}
        </div>
      ) : (
        <div className="t-grid-cards">
          {filteredTours.map((t) => (
            <TourCard key={t.id} tour={t} profile={profile} />
          ))}
        </div>
      )}
    </div>
  );
}
