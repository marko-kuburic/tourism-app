// // src/modules/tours/TourListForTourists.jsx
// import React, { useEffect, useState } from "react";
// import { Link } from "react-router-dom";
// import { ToursAPI } from "./ToursApi"; // tvoja funkcija za dobavljanje tura
// import { KeyPointsAPI } from "./KeyPointsApi"; // API za dobijanje ključnih tačaka (više ne koristimo ovde)
// import "../../styles/tours.css"; // tvoja stilizacija
// import AddTourReview from "./AddTourReview"; // Komponenta za dodavanje recenzija
// import { PurchaseAPI } from '../purchase/PurchaseApi';
// import OwnedBadge from './OwnedBadge';


// function centsToMoney(cents) {
//   if (cents == null || Number.isNaN(Number(cents))) return "-";
//   return (Number(cents) / 100).toFixed(2);
// }


// function AddToCartBtn({ tourId }) {
//   const [busy, setBusy] = React.useState(false);

//   const add = async () => {
//     try {
//       setBusy(true);
//       await PurchaseAPI.addItem(tourId);
//       alert('Dodato u korpu');
//     } catch (e) {
//       const msg = (e?.message || '').toLowerCase();
//       alert(msg.includes('already') ? 'Tura je već u korpi' : (e.message || 'Greška'));
//     } finally {
//       setBusy(false);
//     }
//   };

//   return (
//     <button
//       className="t-btn"
//       disabled={busy}
//       onClick={add}
//     >
//       {busy ? 'Dodajem…' : 'Dodaj u korpu'}
//     </button>
//   );
// }



// export default function TourListForTourists() {
//   const [tours, setTours] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [err, setErr] = useState("");

//   useEffect(() => {
//     async function loadTours() {
//       try {
//         setLoading(true);
//         // NOVO: uzimamo samo objavljene ture + prva ključna tačka iz backend-a
//         const data = await ToursAPI.listPublic();
//         setTours(Array.isArray(data) ? data : []);
//       } catch (e) {
//         setErr(e.message || "Failed to load tours.");
//       } finally {
//         setLoading(false);
//       }
//     }
//     loadTours();
//   }, []);

//   if (loading) {
//     return (
//       <div className="t-container">
//         <p>Loading…</p>
//       </div>
//     );
//   }

//   if (err) {
//     return (
//       <div className="t-container">
//         <div className="t-alert">{err}</div>
//       </div>
//     );
//   }

//   // Public endpoint već vraća samo PUBLISHED ture,
//   // ali zadržavamo "publishedTours" varijablu da minimalno diramo ostatak koda.
//   const publishedTours = tours;

//   return (
//     <div className="t-container">
//       <h1 className="t-title">Tours</h1>
//       {publishedTours.length === 0 ? (
//         <div className="t-empty">No tours available.</div>
//       ) : (
//         <div className="t-grid-cards">
//           {publishedTours.map((tour) => {
//             // Prva ključna tačka sada stiže direktno u odgovoru
//             const firstPoint = tour.firstKeyPointName
//               ? {
//                   name: tour.firstKeyPointName,
//                   lat: tour.firstKeyPointLat,
//                   lng: tour.firstKeyPointLng,
//                   imageUrl: tour.firstKeyPointImageUrl,
//                 }
//               : null;

//             return (
//               <article key={tour.id} className="t-card">
//                 {/* Slika prve ključne tačke (ako postoji) */}
//                 {firstPoint?.imageUrl ? (
//                   <img
//                     src={firstPoint.imageUrl}
//                     alt={firstPoint.name || tour.name}
//                     className="t-card-cover"
//                     style={{ width: "100%", height: 160, objectFit: "cover" }}
//                   />
//                 ) : (
//                   <div
//                     className="t-card-cover"
//                     style={{
//                       width: "100%", height: 160, background: "#f3f4f6",
//                       display: "flex", alignItems: "center", justifyContent: "center",
//                       color: "#6b7280", fontSize: 14
//                     }}
//                   >
//                     No image
//                   </div>
//                 )}

//                 <header className="t-card-head">
//                   <h2 className="t-card-title">{tour.name}  <OwnedBadge tourId={tour.id} /></h2>
//                   {/* status je uvek PUBLISHED, ali ostavimo badge radi konzistentnosti UI-a */}
//                   <span className="t-badge">PUBLISHED</span>
//                 </header>

//                 <div className="t-meta">
//                   <span>Difficulty: {tour.difficulty}</span>
//                   <span> · </span>
//                   <span>Price: € {centsToMoney(tour.priceCents)}</span>
//                   {tour.lengthKm != null && (
//                     <>
//                       <span> · </span>
//                       <span>Length: {tour.lengthKm.toFixed(1)} km</span>
//                     </>
//                   )}
//                 </div>

//                 {/* Prva ključna tačka */}
//                 {firstPoint && (
//                   <div className="t-desc">
//                     <strong>Start: </strong>
//                     {firstPoint.name}
//                     {firstPoint.lat != null && firstPoint.lng != null && (
//                       <> ({Number(firstPoint.lat).toFixed(4)}, {Number(firstPoint.lng).toFixed(4)})</>
//                     )}
//                   </div>
//                 )}

//                 {/* Durations (WALK/BIKE/CAR) */}
//                 {tour.durations && Object.keys(tour.durations).length > 0 && (
//                   <div className="t-durations" style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
//                     {Object.entries(tour.durations).map(([k, v]) => (
//                       <span
//                         key={k}
//                         className="t-pill"
//                         style={{ padding: "2px 8px", borderRadius: 999, background: "#eef2ff", color: "#111827", fontSize: 12 }}
//                       >
//                         {k}: {v} min
//                       </span>
//                     ))}
//                   </div>
//                 )}

//                 <div className="t-actions" style={{ marginTop: 10, display: "flex", gap: 8 }}>
//                 <Link className="t-btn" to={`/tours/${tour.id}`}>
//                   Dodaj u korpu
//                 </Link>
//                 <AddToCartBtn tourId={tour.id} />
//               </div>


//                 {/* Forma za dodavanje recenzije — ostavljamo postojeće ponašanje */}
//                 <div className="add-review" style={{ marginTop: 14 }}>
//                   <h3>Add Review</h3>
//                   <AddTourReview
//                     tourId={tour.id}
//                     onReviewAdded={(review) => {
//                       // Po potrebi ovde osvežiš prikaz recenzija/listu
//                       // (Public API ne vraća recenzije; ovo je hook za tvoj postojeći flow)
//                     }}
//                   />
//                 </div>
//               </article>
//             );
//           })}
//         </div>
//       )}
//     </div>
//   );
// }

import React, { useEffect, useState } from "react";
import { ToursAPI } from "./ToursApi";
import "../../styles/tours.css";
import AddTourReview from "./AddTourReview";
import { PurchaseAPI } from "../purchase/PurchaseApi";
import OwnedBadge from "./OwnedBadge";

function centsToMoney(cents) {
  if (cents == null || Number.isNaN(Number(cents))) return "-";
  return (Number(cents) / 100).toFixed(2);
}

// Jedino dugme za korpu – menja se u "Tura je u korpi"
function AddToCartBtn({ tourId }) {
  const [busy, setBusy] = React.useState(false);
  const [inCart, setInCart] = React.useState(false);

  // Pre-mount provera da li je već u korpi (da bi radilo i posle refresh-a)
  React.useEffect(() => {
    let alive = true;
    PurchaseAPI.getCart()
      .then(c =>
        alive && setInCart(Array.isArray(c.items) && c.items.some(i => i.tourId === tourId))
      )
      .catch(() => {}); // ako kart API ne radi, samo prikaži dugme
    return () => { alive = false; };
  }, [tourId]);

  const add = async () => {
    try {
      setBusy(true);
      await PurchaseAPI.addItem(tourId);
      setInCart(true);
    } catch (e) {
      const msg = (e?.message || "").toLowerCase();
      if (msg.includes("already")) {
        setInCart(true);
      } else {
        alert(e.message || "Greška");
      }
    } finally {
      setBusy(false);
    }
  };

  if (inCart) {
    return (
      <span
        className="t-pill"
        style={{
          padding: "4px 10px",
          borderRadius: 999,
          background: "#e0f2fe",
          color: "#075985",
          fontSize: 12,
          fontWeight: 600,
        }}
      >
        Tura je u korpi
      </span>
    );
  }

  return (
    <button className="t-btn" disabled={busy} onClick={add}>
      {busy ? "Dodajem…" : "Dodaj u korpu"}
    </button>
  );
}

export default function TourListForTourists() {
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    async function loadTours() {
      try {
        setLoading(true);
        const data = await ToursAPI.listPublic(); // PUBLISHED + prva ključna tačka
        setTours(Array.isArray(data) ? data : []);
      } catch (e) {
        setErr(e.message || "Failed to load tours.");
      } finally {
        setLoading(false);
      }
    }
    loadTours();
  }, []);

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

  const publishedTours = tours;

  return (
    <div className="t-container">
      <h1 className="t-title">Tours</h1>
      {publishedTours.length === 0 ? (
        <div className="t-empty">No tours available.</div>
      ) : (
        <div className="t-grid-cards">
          {publishedTours.map((tour) => {
            const firstPoint = tour.firstKeyPointName
              ? {
                  name: tour.firstKeyPointName,
                  lat: tour.firstKeyPointLat,
                  lng: tour.firstKeyPointLng,
                  imageUrl: tour.firstKeyPointImageUrl,
                }
              : null;

            return (
              <article key={tour.id} className="t-card">
                {/* Slika prve ključne tačke (ako postoji) */}
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
                      background: "#f3f4f6",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#6b7280",
                      fontSize: 14,
                    }}
                  >
                    No image
                  </div>
                )}

                <header className="t-card-head">
                  <h2 className="t-card-title">
                    {tour.name} <OwnedBadge tourId={tour.id} />
                  </h2>
                  <span className="t-badge">PUBLISHED</span>
                </header>

                <div className="t-meta">
                  <span>Difficulty: {tour.difficulty}</span>
                  <span> · </span>
                  <span>Price: € {centsToMoney(tour.priceCents)}</span>
                  {tour.lengthKm != null && (
                    <>
                      <span> · </span>
                      <span>Length: {tour.lengthKm.toFixed(1)} km</span>
                    </>
                  )}
                </div>

                {/* Prva ključna tačka */}
                {firstPoint && (
                  <div className="t-desc">
                    <strong>Start: </strong>
                    {firstPoint.name}
                    {firstPoint.lat != null && firstPoint.lng != null && (
                      <>
                        {" "}
                        ({Number(firstPoint.lat).toFixed(4)},{" "}
                        {Number(firstPoint.lng).toFixed(4)})
                      </>
                    )}
                  </div>
                )}

                {/* Durations (WALK/BIKE/CAR) */}
                {tour.durations && Object.keys(tour.durations).length > 0 && (
                  <div
                    className="t-durations"
                    style={{
                      marginTop: 8,
                      display: "flex",
                      gap: 8,
                      flexWrap: "wrap",
                    }}
                  >
                    {Object.entries(tour.durations).map(([k, v]) => (
                      <span
                        key={k}
                        className="t-pill"
                        style={{
                          padding: "2px 8px",
                          borderRadius: 999,
                          background: "#eef2ff",
                          color: "#111827",
                          fontSize: 12,
                        }}
                      >
                        {k}: {v} min
                      </span>
                    ))}
                  </div>
                )}

                {/* Jedino dugme za korpu */}
                <div className="t-actions" style={{ marginTop: 10, display: "flex", gap: 8 }}>
                  <AddToCartBtn tourId={tour.id} />
                </div>

                {/* Recenzije */}
                <div className="add-review" style={{ marginTop: 14 }}>
                  <h3>Add Review</h3>
                  <AddTourReview
                    tourId={tour.id}
                    onReviewAdded={() => { /* hook po potrebi */ }}
                  />
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
