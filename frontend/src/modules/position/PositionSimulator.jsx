// src/modules/position/PositionSimulator.jsx
import React, { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

import { KeyPointsAPI } from "../tours/KeyPointsApi";
import { getProfile } from "../auth/api";

L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

function ClickHandler({ onClick }) {
  useMapEvents({ click(e) { onClick(e.latlng); } });
  return null;
}

export default function PositionSimulator() {
  const [profile, setProfile] = useState(null);
  const [loc, setLoc] = useState(null);
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try { setProfile(await getProfile()); } catch {}
      try {
        const cur = await KeyPointsAPI.getPosition();
        if (cur && typeof cur.lat === "number") setLoc({ lat: cur.lat, lng: cur.lng });
      } catch (e) {}
    })();
  }, []);

  const center = useMemo(() => loc ? [loc.lat, loc.lng] : [44.7866, 20.4489], [loc]);

  async function setPosition(lat, lng) {
    try {
      setSaving(true);
      const saved = await KeyPointsAPI.setPosition(lat, lng);
      setLoc({ lat: saved.lat, lng: saved.lng });
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{padding:16}}>
      <h2>Position Simulator</h2>
      {profile && profile.role !== "tourist" && <div style={{opacity:0.8}}>Note: Page is intended for Tourist role.</div>}
      {err && <div style={{color:"crimson"}}>{err}</div>}

      <MapContainer center={center} zoom={13} style={{ height: 540, width: "100%", borderRadius: 12 }}>
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {loc && <Marker position={[loc.lat, loc.lng]} />}
        <ClickHandler onClick={(ll) => setPosition(ll.lat, ll.lng)} />
      </MapContainer>

      <div style={{marginTop:12, display:"flex", gap:12, alignItems:"center"}}>
        <button onClick={() => {
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((pos) => {
              setPosition(pos.coords.latitude, pos.coords.longitude);
            }, () => alert("Could not get geolocation."));
          } else {
            alert("Geolocation not supported.");
          }
        }} disabled={saving}>
          Use my current device location
        </button>
        {loc && <span style={{opacity:0.7}}>Current: {loc.lat.toFixed(5)}, {loc.lng.toFixed(5)}</span>}
      </div>
    </div>
  );
}
