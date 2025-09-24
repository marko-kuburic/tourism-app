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

    // Spec: initial price = 0, status = DRAFT
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
      navigate("/tours");
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

              {/* tag adder row */}
              <div
                style={{
                  marginTop: 8,
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                }}
              >
                <input
                  placeholder="Add single tag"
                  style={{
                    background: "#0b1020",
                    color: "#e5e7eb",
                    border: "1px solid #374151",
                    borderRadius: 8,
                    padding: "8px 10px",
                    outline: "none",
                  }}
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

              {/* visible, high-contrast chips */}
              {!!tags.length && (
                <div
                  style={{
                    marginTop: 10,
                    display: "flex",
                    gap: 8,
                    flexWrap: "wrap",
                  }}
                >
                  {tags.map((t, i) => (
                    <span
                      key={t + i}
                      className="t-chip"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "6px 10px",
                        borderRadius: 999,
                        background: "#111827",   // dark slate
                        color: "#e5e7eb",        // light text
                        border: "1px solid #374151",
                        boxShadow: "0 1px 0 rgba(0,0,0,.25)",
                        fontSize: 12,
                        lineHeight: 1,
                      }}
                    >
                      {t}
                      <button
                        type="button"
                        onClick={() => removeTagAt(i)}
                        title={`Remove ${t}`}
                        aria-label={`Remove ${t}`}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "inherit",
                          cursor: "pointer",
                          opacity: 0.85,
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                        onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.85")}
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
