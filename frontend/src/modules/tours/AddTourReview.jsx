import React, { useState } from "react";
import { ToursAPI } from "./ToursApi";

export default function AddTourReview({ tourId, onReviewAdded }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    console.log('Šaljem recenziju:', { tourId, rating, comment });
    if (rating < 1 || rating > 5) return setError("Rating must be 1-5.");
    try {
      setSubmitting(true);
      const review = await ToursAPI.addReview(tourId, { tourId, rating, comment });
      console.log('Recenzija uspešno dodana:', review);
      setRating(5);
      setComment("");
      if (onReviewAdded) onReviewAdded(review);
    } catch (err) {
      console.error('Greška pri dodavanju recenzije:', err);
      setError(err?.message || "Failed to submit review.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="add-review" style={{ marginTop: 16, background: "#181c24", borderRadius: 10, padding: 18, boxShadow: "0 2px 8px #0002", maxWidth: 350 }}>
      <h3 style={{ marginBottom: 10, color: "#fff" }}>Leave a Review</h3>
      {error && (
        <div style={{ background: "#922", color: "#fff", padding: 8, borderRadius: 6, marginBottom: 8 }}>
          {error}
        </div>
      )}
      <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <label htmlFor="rating" style={{ color: "#fff", fontWeight: 500 }}>Rating:</label>
          <select id="rating" value={rating} onChange={e => setRating(Number(e.target.value))} style={{ padding: 6, borderRadius: 6, fontSize: 16, background: "#222", color: "#fff", border: "1px solid #333" }}>
            {[1,2,3,4,5].map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <label htmlFor="comment" style={{ color: "#fff", fontWeight: 500 }}>Comment:</label>
          <textarea
            id="comment"
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="Your thoughts..."
            rows={3}
            style={{ width: "90%", maxWidth: "320px", marginTop: 4, padding: 10, borderRadius: 6, resize: "vertical", fontSize: 15, background: "#222", color: "#fff", border: "1px solid #333" }}
          />
        </div>
        <button type="submit" disabled={submitting} style={{ alignSelf: "flex-start", background: "#2976f6", color: "#fff", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 500, fontSize: 16, cursor: "pointer", marginTop: 6 }}>
          Submit Review
        </button>
      </form>
    </div>
  );
}

// import React, { useState } from "react";
// import { ToursAPI } from "./ToursApi";

// export default function AddTourReview({ tourId, onReviewAdded }) {
//   const [rating, setRating] = useState(5);
//   const [comment, setComment] = useState("");
//   const [submitting, setSubmitting] = useState(false);
//   const [error, setError] = useState("");

//   async function onSubmit(e) {
//     e.preventDefault();
//     setError("");

//     const r = Number(rating);
//     if (!Number.isFinite(r) || r < 1 || r > 5) {
//       setError("Ocena mora biti 1–5.");
//       return;
//     }

//     try {
//       setSubmitting(true);
//       const created = await ToursAPI.addReview(tourId, { rating: r, comment });
//       onReviewAdded?.(created);
//       setRating(5);
//       setComment("");
//     } catch (e) {
//       setError(e.message || "Greška pri dodavanju recenzije");
//     } finally {
//       setSubmitting(false);
//     }
//   }

//   return (
//     <form onSubmit={onSubmit} className="t-card" style={{ padding: 10 }}>
//       <h4 className="t-card-title">Dodaj recenziju</h4>
//       {error && <div className="t-error" style={{ marginTop: 4 }}>{error}</div>}
//       <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
//         <label>
//           Ocena:&nbsp;
//           <input
//             type="number"
//             min={1}
//             max={5}
//             value={rating}
//             onChange={(e) => setRating(e.target.value)}
//             style={{ width: 64 }}
//           />
//         </label>
//       </div>
//       <div style={{ marginTop: 8 }}>
//         <textarea
//           value={comment}
//           onChange={(e) => setComment(e.target.value)}
//           placeholder="Upiši komentar..."
//           rows={3}
//           style={{
//             width: "100%",
//             maxWidth: 420,
//             marginTop: 4,
//             background: "#222",
//             color: "#fff",
//             border: "1px solid #333",
//             padding: 8,
//             borderRadius: 8
//           }}
//         />
//       </div>
//       <button
//         type="submit"
//         disabled={submitting}
//         className="t-btn"
//         style={{ marginTop: 8 }}
//       >
//         {submitting ? "Slanje..." : "Pošalji recenziju"}
//       </button>
//     </form>
//   );
// }

