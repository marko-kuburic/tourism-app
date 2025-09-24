// src/modules/tours/CreateTour.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ToursAPI } from "./ToursApi";
import "../../styles/tours.css";

const initialForm = {
  name: "",
  description: "",
  difficulty: "EASY", // REQUIRED
  tagsCSV: "",        // helper for quick paste
};

export default function CreateTour() {
  const [form, setForm] = useState(initialForm);
  const [tags, setTags] = useState([]); // string[]
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  function onChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (name === "tagsCSV") syncCsvToTags(value);
  }

  function syncCsvToTags(csv) {
    const arr = String(csv || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    setTags(arr);
  }

  function addTag(t) {
    const v = String(t || "").trim();
    if (!v) return;
    setTags((prev) => (prev.includes(v) ? prev : [...prev, v]));
  }

  function removeTagAt(i) {
    setTags((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");

    if (!form.name.trim()) return setError("Name is required.");
    if (!form.description.trim()) return setError("Description is required.");
    if (!form.difficulty) return setError("Difficulty is required.");

    // Spec requires: initial price = 0, status = DRAFT
    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      difficulty: form.difficulty,   // EASY | MEDIUM | HARD
      tags,                          // [] or ["city","food"]
      priceCents: 0,                 // auto-set to 0 on creation
      status: "DRAFT",               // required by spec
    };

    try {
      setSubmitting(true);
      await ToursAPI.create(payload);
      navigate("/tours"); // author can see their tours on the list page
    } catch (err) {
      setError(err?.message || "Failed to create tour.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="t-container">
      <div className="t-card">
        <h1 className="t-title">Create Tour</h1>
        {error && <div className="t-alert">{error}</div>}

        <form onSubmit={onSubmit} className="t-form">
          <div className="t-row">
            <label>Name*</label>
            <input
              name="name"
              value={form.name}
              onChange={onChange}
              placeholder="e.g. Belgrade Fortress Walk"
            />
          </div>

          <div className="t-row">
            <label>Description*</label>
            <textarea
              name="description"
              value={form.description}
              onChange={onChange}
              rows={4}
              placeholder="Short summary…"
            />
          </div>

          <div className="t-grid">
            <div className="t-row">
              <label>Difficulty*</label>
              <select
                name="difficulty"
                value={form.difficulty}
                onChange={onChange}
              >
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
              </select>
            </div>

            <div className="t-row">
              <label>Tags (CSV)</label>
              <input
                name="tagsCSV"
                value={form.tagsCSV}
                onChange={onChange}
                placeholder="city, history, family"
              />
              <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
                <input
                  placeholder="Add single tag"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag(e.currentTarget.value);
                      e.currentTarget.value = "";
                    }
                  }}
                />
                <button
                  type="button"
                  className="t-btn-secondary"
                  onClick={(e) => {
                    const inp = e.currentTarget.previousSibling;
                    if (inp && inp.value) {
                      addTag(inp.value);
                      inp.value = "";
                    }
                  }}
                >
                  Add tag
                </button>
              </div>
              {!!tags.length && (
                <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {tags.map((t, i) => (
                    <span
                      key={t + i}
                      className="t-chip"
                      style={{
                        padding: "4px 8px",
                        borderRadius: 999,
                        background: "#eef",
                        border: "1px solid #cdd",
                        display: "inline-flex",
                        gap: 6,
                        alignItems: "center",
                      }}
                    >
                      {t}
                      <button
                        type="button"
                        className="t-btn-link"
                        onClick={() => removeTagAt(i)}
                        title="Remove"
                        aria-label={`Remove ${t}`}
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Price is auto-set to 0 by spec; we show it as read-only info */}
          <div className="t-row">
            <label>Initial price</label>
            <input value="0" readOnly />
            <small className="muted">Price is set to 0 upon creation (status: DRAFT).</small>
          </div>

          <div className="t-actions">
            <button disabled={submitting} type="submit" className="t-btn">
              {submitting ? "Saving…" : "Create"}
            </button>
            <button
              type="button"
              className="t-btn-secondary"
              onClick={() => {
                setForm(initialForm);
                setTags([]);
                setError("");
              }}
              disabled={submitting}
            >
              Reset
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
