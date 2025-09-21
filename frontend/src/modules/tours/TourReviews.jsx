import React from "react";

export default function TourReviews({ reviews }) {
  return (
    <div className="t-card" style={{marginTop:16}}>
      <h3 className="t-card-title">Reviews</h3>
      {reviews.length === 0 ? (
        <div className="t-empty">No reviews yet.</div>
      ) : (
        <ul style={{padding:0, listStyle:'none'}}>
          {reviews.map(r => (
            <li key={r.id} style={{marginBottom:12}}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontWeight: 500 }}>Rating: {r.rating} / 5</span>
                <span style={{ color: "#2976f6", fontWeight: 500, fontSize: 15 }}>by {r.username || "Unknown user"}</span>
              </div>
              <div style={{ marginTop: 4 }}>Comment: {r.comment}</div>
              <div className="t-muted" style={{fontSize:12, marginTop: 2}}>Posted: {new Date(r.createdAt).toLocaleString()}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
