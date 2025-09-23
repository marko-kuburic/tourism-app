// src/modules/blog/CreateBlog.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createBlog } from "./blogApi"; 
import "../../../styles/tours.css"; 

const initial = {
  title: "",
  description_md: "",
  imagesCSV: "",
};

export default function CreateBlog() {
  const [form, setForm] = useState(initial);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  function onChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  function toImages(csv) {
    return String(csv || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");

    if (!form.title.trim()) return setError("Title je obavezan.");
    if (!form.description_md.trim()) return setError("Description (Markdown) je obavezan.");

    const payload = {
      title: form.title.trim(),
      description_md: form.description_md,
      images: toImages(form.imagesCSV),
    };

    try {
      setSubmitting(true);
      const created = await createBlog(payload);
      if (created?.id) navigate(`/blog/${created.id}`); // rute iz App.jsx: /blog i /blog/:id
      else navigate(`/blog`);
    } catch (err) {
      setError(err?.message || "Neuspešno kreiranje bloga.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="t-container">
      <div className="t-card">
        <h1 className="t-title">Create Blog</h1>
        {error && <div className="t-alert">{error}</div>}

        <form onSubmit={onSubmit} className="t-form">
          <div className="t-row">
            <label>Title*</label>
            <input
              name="title"
              value={form.title}
              onChange={onChange}
              placeholder="Npr. Weekend u Kotoru"
            />
          </div>

          <div className="t-row">
            <label>Description (Markdown)*</label>
            <textarea
              name="description_md"
              value={form.description_md}
              onChange={onChange}
              rows={12}
              placeholder="Piši u **Markdown**…"
            />
          </div>

          <div className="t-row">
            <label>Images (CSV)</label>
            <input
              name="imagesCSV"
              value={form.imagesCSV}
              onChange={onChange}
              placeholder="https://img1.jpg, https://img2.jpg"
            />
          </div>

          <div className="t-actions">
            <button disabled={submitting} type="submit" className="t-btn">
              {submitting ? "Saving…" : "Create"}
            </button>
            <button
              type="button"
              className="t-btn-secondary"
              onClick={() => setForm(initial)}
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
