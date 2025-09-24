import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createBlog, uploadBlogImage } from "./blogApi";
import "../../../styles/tours.css";

const initial = {
  title: "",
  description_md: "",
};

export default function CreateBlog() {
  const [form, setForm] = useState(initial);
  const [files, setFiles] = useState([]); // File[]
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  function onChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  function onFilesPicked(e) {
    const list = Array.from(e.target.files || []);
    if (!list.length) return;
    setFiles((prev) => [...prev, ...list]);
  }

  function removeFileAt(idx) {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");

    if (!form.title.trim()) return setError("Title je obavezan.");
    if (!form.description_md.trim())
      return setError("Description (Markdown) je obavezan.");

    setSubmitting(true);
    try {
      // Upload files and collect returned server paths
      const uploadedPaths = [];
      for (const f of files) {
        const res = await uploadBlogImage(f); // expects { file_path: "/uploads/..." }
        if (res?.file_path) uploadedPaths.push(res.file_path);
      }

      const payload = {
        title: form.title.trim(),
        description_md: form.description_md,
        images: uploadedPaths, // only uploaded files
      };

      const created = await createBlog(payload);
      if (created?.id) navigate(`/blog/${created.id}`);
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

          {/* File Uploads ONLY */}
          <div className="t-row">
            <label>Upload Images (files)</label>
            <input type="file" accept="image/*" multiple onChange={onFilesPicked} />

            {!!files.length && (
              <div
                style={{
                  marginTop: 12,
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(120px,1fr))",
                  gap: 10,
                }}
              >
                {files.map((f, i) => {
                  const previewUrl = URL.createObjectURL(f);
                  return (
                    <div key={i} className="t-thumb">
                      <img
                        src={previewUrl}
                        alt={f.name}
                        style={{
                          width: "100%",
                          height: 90,
                          objectFit: "cover",
                          borderRadius: 8,
                        }}
                        onLoad={() => URL.revokeObjectURL(previewUrl)}
                      />
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginTop: 4,
                        }}
                      >
                        <small
                          style={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            maxWidth: "80%",
                          }}
                        >
                          {f.name}
                        </small>
                        <button
                          type="button"
                          className="t-btn-link"
                          onClick={() => removeFileAt(i)}
                          title="Remove"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="t-actions">
            <button disabled={submitting} type="submit" className="t-btn">
              {submitting ? "Saving…" : "Create"}
            </button>
            <button
              type="button"
              className="t-btn-secondary"
              onClick={() => {
                setForm(initial);
                setFiles([]);
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
