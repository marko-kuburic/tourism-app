// // src/modules/tours/TourListForTourists.jsx
// import React, { useEffect, useState } from "react";
// import { Link } from "react-router-dom";
// import { ToursAPI } from "./ToursApi"; // tvoja funkcija za dobavljanje tura
// import { KeyPointsAPI } from "./KeyPointsApi"; // API za dobijanje ključnih tačaka
// import "../../styles/tours.css"; // tvoja stilizacija
// import AddTourReview from "./AddTourReview"; // Komponenta za dodavanje recenzija

// function centsToMoney(cents) {
//   if (cents == null || Number.isNaN(Number(cents))) return "-";
//   return (Number(cents) / 100).toFixed(2);
// }

// export default function TourListForTourists() {
//   const [tours, setTours] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [err, setErr] = useState("");
//   const [keyPoints, setKeyPoints] = useState({}); // Držimo ključne tačke po ID-u ture

//   useEffect(() => {
//     async function loadTours() {
//       try {
//         setLoading(true);
//         const data = await ToursAPI.list(); // Dobavljanje svih tura
//         setTours(Array.isArray(data) ? data : []);

//         // Dohvatimo ključne tačke na osnovu tura
//         const keyPointsData = await Promise.all(
//           data.map((tour) => KeyPointsAPI.list(tour.id))  // Koristi novu funkciju za dohvatanje ključnih tačaka
//         );
        
//         // Mapiramo ključne tačke prema ID-ovima tura
//         const keyPointsMap = {};
//         keyPointsData.forEach((keyPoint, index) => {
//           keyPointsMap[data[index].id] = keyPoint; // Povezujemo ključne tačke sa ID-jem ture
//         });

//         setKeyPoints(keyPointsMap); // Postavljamo ključne tačke u state
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

//   // Filtriranje tura da prikazemo samo objavljene (ne DRAFT)
//   const publishedTours = tours.filter(tour => tour.status == "DRAFT");

//   return (
//     <div className="t-container">
//       <h1 className="t-title">Tours</h1>
//       {publishedTours.length === 0 ? (
//         <div className="t-empty">No tours available.</div>
//       ) : (
//         <div className="t-grid-cards">
//           {publishedTours.map((tour) => {
//             // Prikazujemo samo osnovne informacije + prvu ključnu tačku
//             const firstPoint = keyPoints[tour.id] && keyPoints[tour.id][0]; // Dohvatanje prve ključne tačke za tu turu
//             return (
//               <article key={tour.id} className="t-card">
//                 <header className="t-card-head">
//                   <h2 className="t-card-title">{tour.name}</h2>
//                   <span className="t-badge">{tour.status || "DRAFT"}</span>
//                 </header>

//                 <div className="t-meta">
//                   <span>Price: € {centsToMoney(tour.priceCents)}</span>
//                 </div>

//                 {/* Prva ključna tačka */}
//                 {firstPoint && (
//                   <div className="t-desc">
//                     <strong>First Key Point: </strong>{firstPoint.name}
//                   </div>
//                 )}

//                 {/* Forma za dodavanje recenzije — samo za turiste */}
//                 <div className="add-review">
//                   <h3>Add Review</h3>
//                   <AddTourReview
//                     tourId={tour.id}
//                     onReviewAdded={(review) => {
//                       // Ovdje možete dodati logiku za dodavanje recenzije
//                       // Možeš ažurirati stanje tura da odražava nove recenzije
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

// src/modules/tours/TourListForTourists.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ToursAPI } from "./ToursApi"; // tvoja funkcija za dobavljanje tura
import { KeyPointsAPI } from "./KeyPointsApi"; // API za dobijanje ključnih tačaka (više ne koristimo ovde)
import "../../styles/tours.css"; // tvoja stilizacija
import AddTourReview from "./AddTourReview"; // Komponenta za dodavanje recenzija

function centsToMoney(cents) {
  if (cents == null || Number.isNaN(Number(cents))) return "-";
  return (Number(cents) / 100).toFixed(2);
}

export default function TourListForTourists() {
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    async function loadTours() {
      try {
        setLoading(true);
        // NOVO: uzimamo samo objavljene ture + prva ključna tačka iz backend-a
        const data = await ToursAPI.listPublic();
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

  // Public endpoint već vraća samo PUBLISHED ture,
  // ali zadržavamo "publishedTours" varijablu da minimalno diramo ostatak koda.
  const publishedTours = tours;

  return (
    <div className="t-container">
      <h1 className="t-title">Tours</h1>
      {publishedTours.length === 0 ? (
        <div className="t-empty">No tours available.</div>
      ) : (
        <div className="t-grid-cards">
          {publishedTours.map((tour) => {
            // Prva ključna tačka sada stiže direktno u odgovoru
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
                      width: "100%", height: 160, background: "#f3f4f6",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: "#6b7280", fontSize: 14
                    }}
                  >
                    No image
                  </div>
                )}

                <header className="t-card-head">
                  <h2 className="t-card-title">{tour.name}</h2>
                  {/* status je uvek PUBLISHED, ali ostavimo badge radi konzistentnosti UI-a */}
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
                      <> ({Number(firstPoint.lat).toFixed(4)}, {Number(firstPoint.lng).toFixed(4)})</>
                    )}
                  </div>
                )}

                {/* Durations (WALK/BIKE/CAR) */}
                {tour.durations && Object.keys(tour.durations).length > 0 && (
                  <div className="t-durations" style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {Object.entries(tour.durations).map(([k, v]) => (
                      <span
                        key={k}
                        className="t-pill"
                        style={{ padding: "2px 8px", borderRadius: 999, background: "#eef2ff", color: "#111827", fontSize: 12 }}
                      >
                        {k}: {v} min
                      </span>
                    ))}
                  </div>
                )}

                {/* CTA */}
                {/* <div className="t-actions" style={{ marginTop: 10, display: "flex", gap: 8 }}>
                  <Link className="t-btn" to={`/tours/${tour.id}`}>
                    Details
                  </Link>
                </div> */}

                {/* Forma za dodavanje recenzije — ostavljamo postojeće ponašanje */}
                <div className="add-review" style={{ marginTop: 14 }}>
                  <h3>Add Review</h3>
                  <AddTourReview
                    tourId={tour.id}
                    onReviewAdded={(review) => {
                      // Po potrebi ovde osvežiš prikaz recenzija/listu
                      // (Public API ne vraća recenzije; ovo je hook za tvoj postojeći flow)
                    }}
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

