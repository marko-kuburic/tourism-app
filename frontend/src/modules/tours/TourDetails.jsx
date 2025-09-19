// src/modules/tours/TourDetails.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

import { ToursAPI } from "./ToursApi";
import { KeyPointsAPI } from "./KeyPointsApi";
import { getProfile } from "../auth/api";

L.Icon.Default.mergeOptions({ iconUrl: markerIcon, shadowUrl: markerShadow });

function ClickToPick({ onPick }) {
  useMapEvents({ click(e) { onPick(e.latlng); } });
  return null;
}

export default function TourDetails() {
  const { id } = useParams();
  const [tour, setTour] = useState(null);
  const [points, setPoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [profile, setProfile] = useState(null);

  // forma (sada je DOLE)
  const [form, setForm] = useState({ name: "", description: "", imageUrl: "" });
  const [picked, setPicked] = useState(null);       // lat/lng poslednjeg klika na mapu
  const [editingId, setEditingId] = useState(null); // ako nije null → UPDATE
  const formRef = useRef(null);

  const canEdit = useMemo(() => {
    if (!profile || !tour) return false;
    // prilagodi polje autora ako kod tebe nije authorId
    return (profile.role === "guide" || profile.role === "admin") &&
           String(tour.authorId) === String(profile.id);
  }, [profile, tour]);

  useEffect(() => {
    (async () => {
      try {
        const [me, t] = await Promise.all([
          getProfile().catch(()=>null),
          ToursAPI.get(id),
        ]);
        setProfile(me);
        setTour(t);
        const kp = await KeyPointsAPI.list(id);
        setPoints(Array.isArray(kp) ? kp : []);
      } catch (e) {
        setErr(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  function resetForm() {
    setForm({ name: "", description: "", imageUrl: "" });
    setPicked(null);
    setEditingId(null);
  }

  async function handleSave() {
    if (!form.name?.trim() || !form.description?.trim()) {
      alert("Name i Description su obavezni.");
      return;
    }
    if (!picked && !editingId) {
      alert("Klikni na mapu da izabereš lokaciju nove tačke.");
      return;
    }
    try {
      if (!editingId) {
        const body = {
          name: form.name.trim(),
          description: form.description.trim(),
          imageUrl: form.imageUrl?.trim() || undefined,
          lat: picked.lat,
          lng: picked.lng,
        };
        const created = await KeyPointsAPI.create(id, body);
        setPoints(prev => [...prev, created]);
      } else {
        const body = {
          name: form.name.trim(),
          description: form.description.trim(),
          imageUrl: form.imageUrl?.trim() || undefined,
          lat: picked ? picked.lat : Number(form.lat),
          lng: picked ? picked.lng : Number(form.lng),
        };
        const updated = await KeyPointsAPI.update(id, editingId, body);
        setPoints(prev => prev.map(p => p.id === editingId ? updated : p));
      }
      resetForm();
      // posle snimanja skrolujemo na vrh da odmah vidi ažuriranu listu
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      alert(e.message);
    }
  }

  async function handleDelete(kpId) {
    if (!confirm("Delete this key point?")) return;
    try {
      await KeyPointsAPI.remove(id, kpId);
      setPoints(prev => prev.filter(p => p.id !== kpId));
    } catch (e) {
      alert(e.message);
    }
  }

  function startEdit(p) {
    setEditingId(p.id);
    setForm({
      name: p.name || "",
      description: p.description || "",
      imageUrl: p.imageUrl || "",
      lat: p.lat,
      lng: p.lng,
    });
    setPicked(null); // dok ne klikneš ponovo na mapi
    // skrol do forme (na dnu)
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  }

  const sortedPoints = useMemo(() => {
    return [...points].sort((a,b) => {
      if (a.seq !== b.seq) return (a.seq ?? 0) - (b.seq ?? 0);
      const ca = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const cb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return ca - cb;
    });
  }, [points]);

  const polyPositions = sortedPoints.map(p => [p.lat, p.lng]);
  const center = polyPositions[0] || [44.7866, 20.4489];

  if (loading) return <div style={{padding:16}}>Loading...</div>;

  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ marginBottom: 6 }}>Tour: {tour?.name || "..."}</h2>
      {err && <div style={{ color: "crimson", marginBottom: 10 }}>{err}</div>}

      {/* ====== LISTA KLJUČNIH TAČAKA (GORE) ====== */}
      <section style={{ marginBottom: 14 }}>
        <h3>Key points ({sortedPoints.length})</h3>
        {sortedPoints.length === 0 ? (
          <div style={{ opacity: 0.7 }}>Nema ključnih tačaka još uvek.</div>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 8 }}>
            {sortedPoints.map((p, idx) => (
              <li key={p.id} style={{ border: "1px solid #333", borderRadius: 10, padding: 10, display: "grid", gap: 6 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
                  <div>
                    <strong>#{(p.seq ?? idx + 1)} {p.name}</strong>
                    <div style={{ opacity: 0.75 }}>{p.lat.toFixed(5)}, {p.lng.toFixed(5)}</div>
                  </div>
                  {canEdit && (
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => startEdit(p)}>Edit</button>
                      <button onClick={() => handleDelete(p.id)}>Delete</button>
                    </div>
                  )}
                </div>
                {p.description && <div style={{ opacity: 0.85 }}>{p.description}</div>}
                {p.imageUrl && <img src={p.imageUrl} alt="" style={{ maxWidth: 320, borderRadius: 8 }} />}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ====== MAPA (SREDINA, PUNA ŠIRINA) ====== */}
      <section>
        <MapContainer center={center} zoom={13} style={{ height: 520, width: "100%", borderRadius: 12 }}>
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {sortedPoints.map((p) => (
            <Marker key={p.id} position={[p.lat, p.lng]}>
              <Popup>
                <strong>{p.name}</strong>
                <div style={{ marginTop: 6 }}>{p.description}</div>
                {p.imageUrl && (
                  <img src={p.imageUrl} alt="" style={{ marginTop: 6, maxWidth: 220, borderRadius: 8 }} />
                )}
              </Popup>
            </Marker>
          ))}
          {polyPositions.length >= 2 && <Polyline positions={polyPositions} />}
          {canEdit && <ClickToPick onPick={setPicked} />}
        </MapContainer>
        <p style={{opacity:0.7, marginTop:8}}>
          {canEdit
            ? (picked
                ? <>Izabrano: {picked.lat.toFixed(5)}, {picked.lng.toFixed(5)} — popuni formu dole i snimi.</>
                : <>Klikni na mapu da izabereš lokaciju nove tačke ili za izmene tokom edit-a.</>
              )
            : "Samo autor može da menja tačke."}
        </p>
      </section>

      {/* ====== FORMA (DOLE) ====== */}
      <section ref={formRef} style={{ marginTop: 14 }}>
        <h3>{editingId ? "Edit key point" : "Add key point"}</h3>
        <div style={{ display: "grid", gap: 8, maxWidth: 680 }}>
          <label>
            <div>Name</div>
            <input
              value={form.name}
              onChange={e => setForm(s => ({ ...s, name: e.target.value }))}
              placeholder="Tačka - npr. Kalemegdan"
              disabled={!canEdit}
            />
          </label>
          <label>
            <div>Description</div>
            <textarea
              rows={3}
              value={form.description}
              onChange={e => setForm(s => ({ ...s, description: e.target.value }))}
              placeholder="Kratak opis…"
              disabled={!canEdit}
            />
          </label>
          <label>
            <div>Image URL (optional)</div>
            <input
              value={form.imageUrl}
              onChange={e => setForm(s => ({ ...s, imageUrl: e.target.value }))}
              placeholder="https://…"
              disabled={!canEdit}
            />
          </label>

          {/* info o koordinatama tokom add/edit */}
          <div style={{ opacity: 0.75 }}>
            {editingId
              ? (picked
                  ? <>Editing · novi klik: {picked?.lat?.toFixed(5)}, {picked?.lng?.toFixed(5)}</>
                  : <>Editing · trenutne: {form.lat}, {form.lng} (klikni na mapu da promeniš)</>
                )
              : (picked
                  ? <>New point at: {picked?.lat?.toFixed(5)}, {picked?.lng?.toFixed(5)}</>
                  : <>Klikni na mapu iznad da postaviš lokaciju nove tačke</>
                )}
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={handleSave}
              disabled={!canEdit || !form.name?.trim() || !form.description?.trim() || (!picked && !editingId)}
            >
              {editingId ? "Update key point" : "Create key point"}
            </button>
            <button onClick={resetForm} disabled={!canEdit}>Cancel</button>
          </div>
        </div>
      </section>
    </div>
  );
}
