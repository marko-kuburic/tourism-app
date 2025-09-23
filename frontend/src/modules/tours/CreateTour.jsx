// src/modules/tours/CreateTour.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ToursAPI } from "./ToursApi";
import "../../styles/tours.css";

const initialForm = {
  name: "",
  description: "",
  price: "",          // UI price, we’ll convert to cents
  difficulty: "EASY", // REQUIRED
};

export default function CreateTour() {
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  function onChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  function toPriceCents(raw) {
    const cleaned = String(raw ?? "")
      .trim()
      .replace(",", ".")
      .replace(/[^\d.]/g, "");
    const n = cleaned === "" ? NaN : Number(cleaned);
    if (!Number.isFinite(n)) return NaN;
    return Math.round(n * 100);
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");

    if (!form.name.trim()) return setError("Name is required.");
    const priceCents = toPriceCents(form.price);
    if (!Number.isFinite(priceCents) || priceCents <= 0) {
      return setError("Invalid price");
    }
    if (!form.difficulty) return setError("Difficulty is required.");

    // Payload: ONLY what backend expects
    const payload = {
      name: form.name.trim(),
      description: String(form.description || "").trim(),
      priceCents,
      difficulty: form.difficulty, // EASY | MEDIUM | HARD
      status: "PUBLISHED",            // default status
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
              <label>Price* (shown to user)</label>
              <input
                name="price"
                value={form.price}
                onChange={onChange}
                inputMode="decimal"
                placeholder="e.g. 25"
              />
            </div>

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
          </div>

          <div className="t-actions">
            <button disabled={submitting} type="submit" className="t-btn">
              {submitting ? "Saving…" : "Create"}
            </button>
            <button
              type="button"
              className="t-btn-secondary"
              onClick={() => setForm(initialForm)}
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
