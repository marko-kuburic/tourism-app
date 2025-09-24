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

// mala značka za status
function StatusBadge({ status }) {
  const styles = {
    base: "display:inline-block;padding:2px 6px;border-radius:6px;font-size:12px",
    DRAFT:   "background:#eef1f5;color:#333;border:1px solid #d7dbe2",
    PUBLISHED: "background:#e8f7ef;color:#106b36;border:1px solid #bce5cd",
    ARCHIVED:  "background:#fff7e6;color:#8a5a00;border:1px solid #ffe0a3",
  };
  const tone = styles[status] || styles.DRAFT;
  return <span style={{ ...parseStyle(styles.base), ...parseStyle(tone) }}>{status}</span>;
}
function parseStyle(inline) {
  return inline.split(";").filter(Boolean).reduce((acc, d) => {
    const [k, v] = d.split(":");
    if (!k || !v) return acc;
    const key = k.trim().replace(/-([a-z])/g, (_,c)=>c.toUpperCase());
    acc[key] = v.trim();
    return acc;
  }, {});
}

function toDate(value) {
  if (value == null) return null;

  // 1) Array from Jackson: [yyyy, M, d, H, m, s, nanos?]
  if (Array.isArray(value)) {
    const [y, m, d, H = 0, M = 0, S = 0, _nano = 0] = value;
    // JS months are 0-based
    const dt = new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1, H, M, S));
    return isNaN(+dt) ? null : dt;
  }

  // 2) Numeric epoch (seconds or ms) or numeric-like string
  if (typeof value === "number" || /^\d+$/.test(String(value))) {
    const n = Number(value);
    const ms = n > 1e12 ? n : n * 1000; // treat 13-digit as ms, 10-digit as s
    const dt = new Date(ms);
    return isNaN(+dt) ? null : dt;
  }

  // 3) Strings
  if (typeof value === "string") {
    const s = value.trim();
    if (!s) return null;

    // "YYYY-MM-DD HH:mm:ss" → assume UTC (append Z)
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(\.\d+)?$/.test(s)) {
      const iso = s.replace(" ", "T") + "Z";
      const dt = new Date(iso);
      return isNaN(+dt) ? null : dt;
    }

    // ISO-like: "YYYY-MM-DDTHH:mm:ss[.SSS][Z|±hh:mm]"
    const dt = new Date(s);
    return isNaN(+dt) ? null : dt;
  }

  return null;
}

function fmtDate(value) {
  const d = toDate(value);
  return d ? d.toLocaleString() : "";
}

/* ----------------------------------------------- */

export default function TourDetails() {
  const { id } = useParams();
  const [tour, setTour] = useState(null);
  const [points, setPoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [profile, setProfile] = useState(null);
  const [routeCoords, setRouteCoords] = useState(null);

  // forma (sada je DOLE)
  const [form, setForm] = useState({ name: "", description: "", imageUrl: "" });
  const [picked, setPicked] = useState(null);       // lat/lng poslednjeg klika na mapu
  const [editingId, setEditingId] = useState(null); // ako nije null → UPDATE
  const formRef = useRef(null);

  // Tačka 15 — publish forma i akcije
  const [pubOpen, setPubOpen] = useState(false);
  const [walk, setWalk] = useState("");
  const [bike, setBike] = useState("");
  const [car, setCar] = useState("");
  const [actLoading, setActLoading] = useState(false);

  const canEdit = useMemo(() => {
    if (!profile || !tour) return false;
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

  async function refetchTour() {
    try {
      const t = await ToursAPI.get(id);
      setTour(t);
    } catch (e) {
      console.warn("Refetch tour failed:", e);
    }
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
      await refetchTour();
      resetForm();
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
      await refetchTour();
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
    setPicked(null);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  }

  // OSRM rutiranje uličnom mrežom
  async function computeStreetRoute(pts, profile = "foot") {
    if (!Array.isArray(pts) || pts.length < 2) {
      setRouteCoords(null);
      return;
    }
    try {
      const base = import.meta.env.VITE_ROUTER_BASE || "https://router.project-osrm.org";
      const coords = pts.map(p => `${p.lng},${p.lat}`).join(";"); // lng,lat
      const url = `${base}/route/v1/${profile}/${coords}?overview=full&geometries=geojson`;
      const res = await fetch(url);
      const data = await res.json();
      if (data?.routes?.[0]?.geometry?.coordinates) {
        const ll = data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
        setRouteCoords(ll);
      } else {
        setRouteCoords(null);
      }
    } catch (e) {
      console.warn("OSRM route fail:", e);
      setRouteCoords(null); // fallback
    }
  }

  const sortedPoints = useMemo(() => {
    return [...points].sort((a,b) => {
      if (a.seq !== b.seq) return (a.seq ?? 0) - (b.seq ?? 0);
      const ca = toDate(a.createdAt ?? a.created_at)?.getTime() ?? 0;
      const cb = toDate(b.createdAt ?? b.created_at)?.getTime() ?? 0;
      return ca - cb;
    });
  }, [points]);

  useEffect(() => {
    computeStreetRoute(sortedPoints, "foot");
  }, [sortedPoints]);

  const polyPositions = sortedPoints.map(p => [p.lat, p.lng]);
  const center = polyPositions[0] || [44.7866, 20.4489];

  // === Tačka 15 — akcije: publish / archive / unarchive ===
  function collectDurations() {
    const d = {};
    const isPos = (v) => Number.isFinite(+v) && +v > 0;
    if (isPos(walk)) d.WALK = +walk;
    if (isPos(bike)) d.BIKE = +bike;
    if (isPos(car)) d.CAR = +car;
    return d;
  }

  async function doPublish() {
    try {
      const durations = collectDurations();
      if (Object.keys(durations).length === 0) {
        alert("Unesi barem jednu pozitivnu vrednost (minute) za WALK/BIKE/CAR.");
        return;
      }
      setActLoading(true);
      const updated = await ToursAPI.publish(id, { durations });
      setTour(updated);
      setPubOpen(false);
    } catch (e) {
      alert(e?.message || "Greška pri objavi.");
    } finally {
      setActLoading(false);
    }
  }

  async function doArchive() {
    try {
      setActLoading(true);
      const updated = await ToursAPI.archive(id);
      setTour(updated);
    } catch (e) {
      alert(e?.message || "Greška pri arhiviranju.");
    } finally {
      setActLoading(false);
    }
  }

  async function doUnarchive() {
    try {
      setActLoading(true);
      const updated = await ToursAPI.unarchive(id);
      setTour(updated);
    } catch (e) {
      alert(e?.message || "Greška pri aktiviranju.");
    } finally {
      setActLoading(false);
    }
  }

  if (loading) return <div style={{padding:16}}>Loading...</div>;

  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ marginBottom: 6, display:"flex", alignItems:"center", gap:8 }}>
        Tour: {tour?.name || "..."} {tour?.status && <StatusBadge status={tour.status} />}
      </h2>
      {err && <div style={{ color: "crimson", marginBottom: 10 }}>{err}</div>}

      {/* ====== META + AKCIJE (Tačka 15) ====== */}
      {tour && (
        <section style={{ marginBottom: 14, display:"grid", gap:8 }}>
          <div style={{ color:"#444" }}>
            <div style={{ marginBottom:4 }}>
              <span style={{ opacity:0.75 }}>Težina:</span> <strong>{tour.difficulty}</strong>
              {" · "}
              <span style={{ opacity:0.75 }}>Cena:</span> <strong>{((tour.priceCents ?? 0)/100).toFixed(2)} €</strong>
              {tour.lengthKm != null && <>{" · "}<span style={{ opacity:0.75 }}>Dužina:</span> <strong>{tour.lengthKm.toFixed(1)} km</strong></>}
            </div>
            {tour.durations && Object.keys(tour.durations).length > 0 && (
              <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                {Object.entries(tour.durations).map(([k,v]) => (
                  <span key={k} style={{ padding:"2px 8px", borderRadius:8, background:"#f3f4f6", fontSize:12, color:"#111" }}>
                    {k}: {v} min
                  </span>
                ))}
              </div>
            )}
            <div style={{ fontSize:12, color:"#666", marginTop:4 }}>
              { (tour.publishedAt ?? tour.published_at) && <>Objavljeno: {fmtDate(tour.publishedAt ?? tour.published_at)}{" · "}</> }
              { (tour.archivedAt ?? tour.archived_at) && <>Arhivirano: {fmtDate(tour.archivedAt ?? tour.archived_at)}</> }
            </div>
          </div>

          {/* Akcione tipke po statusu (samo autor može) */}
          {canEdit && (
            <>
              {tour.status === "DRAFT" && (
                <div style={{ border:"1px solid #e5e7eb", borderRadius:12, padding:12 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                    <div style={{ fontWeight:600 }}>Objavi turu</div>
                    <button
                      onClick={() => setPubOpen(v=>!v)}
                      style={{ padding:"6px 10px", borderRadius:8, background:"#f1f5f9", border:"1px solid #e2e8f0" }}
                    >
                      {pubOpen ? "Sakrij formu" : "Prikaži formu"}
                    </button>
                  </div>
                  {pubOpen && (
                    <div style={{ display:"grid", gap:10, gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))" }}>
                      <label>
                        <div style={{ fontSize:12, color:"#666", marginBottom:4 }}>WALK (min)</div>
                        <input value={walk} onChange={e=>setWalk(e.target.value)} placeholder="npr. 120" inputMode="numeric" />
                      </label>
                      <label>
                        <div style={{ fontSize:12, color:"#666", marginBottom:4 }}>BIKE (min)</div>
                        <input value={bike} onChange={e=>setBike(e.target.value)} placeholder="npr. 45" inputMode="numeric" />
                      </label>
                      <label>
                        <div style={{ fontSize:12, color:"#666", marginBottom:4 }}>CAR (min)</div>
                        <input value={car} onChange={e=>setCar(e.target.value)} placeholder="npr. 15" inputMode="numeric" />
                      </label>
                      <div style={{ gridColumn:"1 / -1" }}>
                        <button
                          onClick={doPublish}
                          disabled={actLoading}
                          style={{ padding:"8px 14px", borderRadius:8, background:"#16a34a", color:"#fff", border:"none" }}
                        >
                          {actLoading ? "Objavljivanje..." : "Objavi"}
                        </button>
                      </div>
                      <div style={{ fontSize:12, color:"#666", gridColumn:"1 / -1" }}>
                        Uslovi: naziv + opis + težina, najmanje 2 ključne tačke, i bar jedno vreme (WALK/BIKE/CAR) &gt; 0.
                      </div>
                    </div>
                  )}
                </div>
              )}

              {tour.status === "PUBLISHED" && (
                <div>
                  <button
                    onClick={doArchive}
                    disabled={actLoading}
                    style={{ padding:"8px 14px", borderRadius:8, background:"#ca8a04", color:"#fff", border:"none" }}
                  >
                    {actLoading ? "Arhiviranje..." : "Arhiviraj"}
                  </button>
                </div>
              )}

              {tour.status === "ARCHIVED" && (
                <div>
                  <button
                    onClick={doUnarchive}
                    disabled={actLoading}
                    style={{ padding:"8px 14px", borderRadius:8, background:"#2563eb", color:"#fff", border:"none" }}
                  >
                    {actLoading ? "Aktiviranje..." : "Aktiviraj"}
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      )}

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
          {routeCoords ? (
            <Polyline positions={routeCoords} />
          ) : (
            polyPositions.length >= 2 && (
              <Polyline positions={polyPositions} dashArray="6 8" />
            )
          )}

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
