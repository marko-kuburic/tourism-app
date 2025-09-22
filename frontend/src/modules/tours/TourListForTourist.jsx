// src/modules/tours/TourListForTourists.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ToursAPI } from "./ToursApi"; // tvoja funkcija za dobavljanje tura
import { KeyPointsAPI } from "./KeyPointsApi"; // API za dobijanje ključnih tačaka
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
  const [keyPoints, setKeyPoints] = useState({}); // Držimo ključne tačke po ID-u ture

  useEffect(() => {
    async function loadTours() {
      try {
        setLoading(true);
        const data = await ToursAPI.list(); // Dobavljanje svih tura
        setTours(Array.isArray(data) ? data : []);

        // Dohvatimo ključne tačke na osnovu tura
        const keyPointsData = await Promise.all(
          data.map((tour) => KeyPointsAPI.list(tour.id))  // Koristi novu funkciju za dohvatanje ključnih tačaka
        );
        
        // Mapiramo ključne tačke prema ID-ovima tura
        const keyPointsMap = {};
        keyPointsData.forEach((keyPoint, index) => {
          keyPointsMap[data[index].id] = keyPoint; // Povezujemo ključne tačke sa ID-jem ture
        });

        setKeyPoints(keyPointsMap); // Postavljamo ključne tačke u state
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

  // Filtriranje tura da prikazemo samo objavljene (ne DRAFT)
  const publishedTours = tours.filter(tour => tour.status == "DRAFT");

  return (
    <div className="t-container">
      <h1 className="t-title">Tours</h1>
      {publishedTours.length === 0 ? (
        <div className="t-empty">No tours available.</div>
      ) : (
        <div className="t-grid-cards">
          {publishedTours.map((tour) => {
            // Prikazujemo samo osnovne informacije + prvu ključnu tačku
            const firstPoint = keyPoints[tour.id] && keyPoints[tour.id][0]; // Dohvatanje prve ključne tačke za tu turu
            return (
              <article key={tour.id} className="t-card">
                <header className="t-card-head">
                  <h2 className="t-card-title">{tour.name}</h2>
                  <span className="t-badge">{tour.status || "DRAFT"}</span>
                </header>

                <div className="t-meta">
                  <span>Price: € {centsToMoney(tour.priceCents)}</span>
                </div>

                {/* Prva ključna tačka */}
                {firstPoint && (
                  <div className="t-desc">
                    <strong>First Key Point: </strong>{firstPoint.name}
                  </div>
                )}

                {/* Forma za dodavanje recenzije — samo za turiste */}
                <div className="add-review">
                  <h3>Add Review</h3>
                  <AddTourReview
                    tourId={tour.id}
                    onReviewAdded={(review) => {
                      // Ovdje možete dodati logiku za dodavanje recenzije
                      // Možeš ažurirati stanje tura da odražava nove recenzije
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
