
import React, { useEffect, useMemo, useState } from "react";
import "../../styles/tours.css";
import { ToursAPI } from "./ToursApi";
import { KeyPointsAPI } from "./KeyPointsApi";
import { PurchaseAPI } from "../purchase/PurchaseApi";
import TourReviews from "./TourReviews";
import AddTourReview from "./AddTourReview";
import { getProfile, normalizeRole } from "../auth/api";

// util
function centsToMoney(cents) {
  if (cents == null || Number.isNaN(Number(cents))) return "-";
  return (Number(cents) / 100).toFixed(2);
}

function Durations({ d }) {
  if (!d) return null;
  const entries = Object.entries(d);
  if (entries.length === 0) return null;
  return (
    <div className="t-muted" style={{ marginTop: 6 }}>
      {entries.map(([mode, mins]) => (
        <span key={mode} style={{ marginRight: 10 }}>
          {mode}: {mins} min
        </span>
      ))}
    </div>
  );
}

// Dodaj u korpu / prikaži status
function AddToCartBtn({ tourId, onOwned }) {
  const [busy, setBusy] = useState(false);
  const [inCart, setInCart] = useState(false);
  const [owned, setOwned] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { owned } = await PurchaseAPI.hasOwnership(tourId);
        if (!alive) return;
        setOwned(!!owned);
        if (owned) onOwned?.();
      } catch (_) {
        // ignoriši
      }
    })();
    return () => (alive = false);
  }, [tourId, onOwned]);

  async function add() {
    try {
      setBusy(true);
      await PurchaseAPI.addItem(tourId);
      setInCart(true);
    } catch (e) {
      alert(e.message || "Neuspelo dodavanje u korpu");
    } finally {
      setBusy(false);
    }
  }

  if (owned) return <span className="t-badge t-badge--success">Kupljeno</span>;
  if (inCart) return <span className="t-badge">Tura je u korpi</span>;
  return (
    <button disabled={busy} onClick={add} className="t-btn">
      Dodaj u korpu
    </button>
  );
}

export default function TourListForTourist() {
  const [profile, setProfile] = useState(null);
  const role = useMemo(() => normalizeRole(profile), [profile]);

  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);

  // po turama: reviews, ownership, keypoints
  const [reviewsMap, setReviewsMap] = useState({});    // { [tourId]: Review[] }
  const [ownedMap, setOwnedMap] = useState({});        // { [tourId]: true/false }
  const [kpsMap, setKpsMap] = useState({});            // { [tourId]: KeyPoint[] }

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        // profil (da bismo sakrili/prikazali formu za recenziju)
        getProfile().then(setProfile).catch(() => setProfile(null));

        // objavljene ture za turiste (public DTO: uključuje *prvu* ključnu tačku)
        const list = await ToursAPI.listPublic();
        if (!alive) return;
        setTours(list);

        // paralelno za svaku turu dohvatimo recenzije + ownership (+ keypoints ako owned)
        await Promise.all(
          list.map(async (t) => {
            // reviews
            try {
              const rev = await ToursAPI.getReviews(t.id);
              if (!alive) return;
              setReviewsMap((m) => ({ ...m, [t.id]: Array.isArray(rev) ? rev : (rev?.items || []) }));
            } catch (_) {}

            // ownership
            try {
              const { owned } = await PurchaseAPI.hasOwnership(t.id);
              if (!alive) return;
              setOwnedMap((m) => ({ ...m, [t.id]: !!owned }));
              if (owned) {
                const kps = await KeyPointsAPI.list(t.id); // FULL lista kada je kupljeno
                if (!alive) return;
                setKpsMap((m) => ({ ...m, [t.id]: kps || [] }));
              }
            } catch (_) {}
          })
        );
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => (alive = false);
  }, []);

  if (loading) return <div className="t-page"><div className="t-empty">Učitavanje...</div></div>;

  if (!tours.length) {
    return (
      <div className="t-page">
        <h2>Objavljene ture</h2>
        <div className="t-empty">Trenutno nema dostupnih tura.</div>
      </div>
    );
  }

  return (
    <div className="t-page">
      <h2>Objavljene ture</h2>

      <div className="t-grid-cards">
        {tours.map((tour) => {
          const owned = !!ownedMap[tour.id];

          // prva ključna tačka iz public DTO-a
          const firstPoint = tour.firstKeyPointName
            ? {
                id: tour.firstKeyPointId,
                name: tour.firstKeyPointName,
                description: tour.firstKeyPointDescription,
                lat: tour.firstKeyPointLat,
                lng: tour.firstKeyPointLng,
                imageUrl: tour.firstKeyPointImageUrl,
                seq: 1,
              }
            : null;

          // sve KP ako je kupljeno, inače samo prvu
          const keypoints = owned ? (kpsMap[tour.id] || []) : (firstPoint ? [firstPoint] : []);

          return (
            <article key={tour.id} className="t-card">
              {/* Cover */}
              {firstPoint?.imageUrl ? (
                <img
                  src={firstPoint.imageUrl}
                  alt={firstPoint.name || tour.name}
                  className="t-card-cover"
                  style={{ width: "100%", height: 160, objectFit: "cover" }}
                />
              ) : (
                <div
                  className="t-card-cover"
                  style={{
                    width: "100%",
                    height: 160,
                    display: "grid",
                    placeItems: "center",
                    background: "#101114",
                    color: "#94a3b8",
                    fontWeight: 600,
                  }}
                >
                  {tour.name}
                </div>
              )}

              <div className="t-card-body">
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <h3 className="t-card-title" title={tour.name} style={{ maxWidth: "70%" }}>
                    {tour.name}
                  </h3>
                  <AddToCartBtn
                    tourId={tour.id}
                    onOwned={async () => {
                      // ako je kupljeno tokom rada, odmah dotegni sve KP
                      try {
                        const kps = await KeyPointsAPI.list(tour.id);
                        setKpsMap((m) => ({ ...m, [tour.id]: kps || [] }));
                        setOwnedMap((m) => ({ ...m, [tour.id]: true }));
                      } catch {}
                    }}
                  />
                </div>

                <div className="t-muted" style={{ marginTop: 4 }}>
                  Cena: {centsToMoney(tour.priceCents)} €
                </div>
                {tour.lengthKm != null && (
                  <div className="t-muted">Dužina: {tour.lengthKm.toFixed(2)} km</div>
                )}
                <Durations d={tour.durations} />

                {/* Ključne tačke */}
                <div style={{ marginTop: 12 }}>
                  <h4 style={{ marginBottom: 6 }}>
                    Ključne tačke {owned ? "" : "(prikazana je samo prva pre kupovine)"}
                  </h4>
                  {keypoints.length === 0 ? (
                    <div className="t-empty">Nema ključnih tačaka.</div>
                  ) : (
                    <ol style={{ paddingLeft: 18, margin: 0 }}>
                      {keypoints.map((kp) => (
                        <li key={kp.id || kp.seq} style={{ marginBottom: 6 }}>
                          <div style={{ fontWeight: 600 }}>{kp.name}</div>
                          {kp.description && (
                            <div className="t-muted" style={{ marginTop: 2 }}>
                              {kp.description}
                            </div>
                          )}
                          {typeof kp.lat === "number" && typeof kp.lng === "number" && (
                            <div className="t-muted" style={{ marginTop: 2 }}>
                              ({kp.lat.toFixed(5)}, {kp.lng.toFixed(5)})
                            </div>
                          )}
                        </li>
                      ))}
                    </ol>
                  )}
                </div>

                {/* Recenzije (uvek vidljive) */}
                <div style={{ marginTop: 14 }}>
                  <TourReviews reviews={reviewsMap[tour.id] || []} />
                </div>

                {/* Dodaj recenziju — samo turista */}
                {role === "tourist" && (
                  <div className="add-review" style={{ marginTop: 10 }}>
                    <AddTourReview
                      tourId={tour.id}
                      onReviewAdded={(created) => {
                        setReviewsMap((m) => ({
                          ...m,
                          [tour.id]: [created, ...(m[tour.id] || [])],
                        }));
                      }}
                    />
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

