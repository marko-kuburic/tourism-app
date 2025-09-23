import { useState } from "react";
import { ToursAPI } from "../tours/ToursApi";

export default function TourActions({ tour, onChange }) {
  const [openPublish, setOpenPublish] = useState(false);
  const [walk, setWalk] = useState("");
  const [bike, setBike] = useState("");
  const [car, setCar] = useState("");
  const [loading, setLoading] = useState(false);

  const durationsPayload = () => {
    const d = {};
    const n = (v) => Number.isFinite(+v) && +v > 0;
    if (n(walk)) d.WALK = +walk;
    if (n(bike)) d.BIKE = +bike;
    if (n(car)) d.CAR = +car;
    return d;
  };

  const doPublish = async () => {
    try {
      const durations = durationsPayload();
      if (Object.keys(durations).length === 0)
        return alert("Unesi barem jednu pozitivnu vrednost (minute) za WALK/BIKE/CAR.");
      setLoading(true);
      const updated = await ToursAPI.publish(tour.id, { durations });
      onChange?.(updated);
      setOpenPublish(false);
    } catch (e) {
      console.error(e);
      alert(e?.message || "Greška pri objavi.");
    } finally {
      setLoading(false);
    }
  };

  const doArchive = async () => {
    try {
      setLoading(true);
      const updated = await ToursAPI.archive(tour.id);
      onChange?.(updated);
    } catch (e) {
      console.error(e);
      alert(e?.message || "Greška pri arhiviranju.");
    } finally {
      setLoading(false);
    }
  };

  const doUnarchive = async () => {
    try {
      setLoading(true);
      const updated = await ToursAPI.unarchive(tour.id);
      onChange?.(updated);
    } catch (e) {
      console.error(e);
      alert(e?.message || "Greška pri aktiviranju.");
    } finally {
      setLoading(false);
    }
  };

  const StatusBadge = ({ status }) => {
    const color =
      status === "PUBLISHED" ? "bg-green-100 text-green-700" :
      status === "ARCHIVED"  ? "bg-yellow-100 text-yellow-700" :
                               "bg-gray-100 text-gray-700";
    return <span className={`inline-block px-2 py-1 text-xs rounded ${color}`}>{status}</span>;
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <StatusBadge status={tour.status} />
        {tour.lengthKm != null && (
          <span className="text-sm text-gray-600">Dužina: {tour.lengthKm.toFixed(1)} km</span>
        )}
        {tour.publishedAt && (
          <span className="text-xs text-gray-500">Objavljeno: {new Date(tour.publishedAt).toLocaleString()}</span>
        )}
        {tour.archivedAt && (
          <span className="text-xs text-gray-500">Arhivirano: {new Date(tour.archivedAt).toLocaleString()}</span>
        )}
      </div>

      {/* Akcije u zavisnosti od statusa */}
      {tour.status === "DRAFT" && (
        <div className="flex flex-col gap-2 rounded-xl border p-3">
          <div className="flex items-center justify-between">
            <div className="font-medium">Objavi turu</div>
            <button
              className="px-3 py-1 rounded bg-slate-100 text-slate-700 text-sm"
              onClick={() => setOpenPublish((v) => !v)}
            >
              {openPublish ? "Sakrij formu" : "Prikaži formu"}
            </button>
          </div>
          {openPublish && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">WALK (min)</label>
                <input className="w-full border rounded px-2 py-1" inputMode="numeric" value={walk} onChange={e=>setWalk(e.target.value)} placeholder="npr. 120" />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">BIKE (min)</label>
                <input className="w-full border rounded px-2 py-1" inputMode="numeric" value={bike} onChange={e=>setBike(e.target.value)} placeholder="npr. 45" />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">CAR (min)</label>
                <input className="w-full border rounded px-2 py-1" inputMode="numeric" value={car} onChange={e=>setCar(e.target.value)} placeholder="npr. 15" />
              </div>
              <div className="sm:col-span-3">
                <button
                  className="px-4 py-2 rounded bg-green-600 text-white disabled:opacity-50"
                  disabled={loading}
                  onClick={doPublish}
                >
                  {loading ? "Objavljivanje..." : "Objavi"}
                </button>
              </div>
            </div>
          )}
          <p className="text-xs text-gray-500">
            Uslovi: naziv + opis + težina, najmanje 2 ključne tačke, i bar jedno vreme (WALK/BIKE/CAR) &gt; 0.
          </p>
        </div>
      )}

      {tour.status === "PUBLISHED" && (
        <div>
          <button
            className="px-4 py-2 rounded bg-yellow-600 text-white disabled:opacity-50"
            disabled={loading}
            onClick={doArchive}
          >
            {loading ? "Arhiviranje..." : "Arhiviraj"}
          </button>
        </div>
      )}

      {tour.status === "ARCHIVED" && (
        <div>
          <button
            className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50"
            disabled={loading}
            onClick={doUnarchive}
          >
            {loading ? "Aktiviranje..." : "Aktiviraj"}
          </button>
        </div>
      )}

      {/* Pregled definisanih vremena */}
      {tour.durations && Object.keys(tour.durations).length > 0 && (
        <div className="text-sm text-gray-700">
          <span className="font-medium">Vremena: </span>
          {Object.entries(tour.durations).map(([k,v]) => (
            <span key={k} className="mr-3">{k}: {v} min</span>
          ))}
        </div>
      )}
    </div>
  );
}
