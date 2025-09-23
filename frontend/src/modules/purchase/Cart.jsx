import React, { useEffect, useState } from 'react';
import { PurchaseAPI } from './PurchaseApi';
import { useNavigate } from 'react-router-dom';

export default function Cart() {
  const [cart, setCart] = useState(null);
  const [err, setErr] = useState('');

  const load = async () => {
    try { setCart(await PurchaseAPI.getCart()); setErr(''); }
    catch (e) { setErr(e.message); }
  };

  useEffect(()=>{ load(); }, []);

  const items = Array.isArray(cart?.items) ? cart.items : [];
  const navigate = useNavigate();
  const del = async (id) => { await PurchaseAPI.removeItem(id); load(); };
  
  const checkout = async () => {
    try {
      await PurchaseAPI.checkout();
      setCart({ items: [], totalCents: 0 });
      alert('Uspešna kupovina!');
      navigate('/tours', { replace: true });
      load();
    } catch (e) { alert(e.message); }
  };

  if (err) return <div className="text-red-600">{err}</div>;
  if (!cart) return <div>Učitavanje...</div>;

  const total = (cart.totalCents||0)/100;

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Moja korpa</h2>
      {!items.length && <div className="opacity-70">Korpa je prazna.</div>}
      <ul className="divide-y">
        {items.map(it => (
          <li key={it.id} className="py-3 flex justify-between items-center">
            <div>
              <div className="font-medium">{it.tourName}</div>
              <div className="text-sm opacity-70">#{it.tourId}</div>
            </div>
            <div className="flex items-center gap-4">
              <div>{(it.priceCents/100).toFixed(2)} €</div>
              <button className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300"
                      onClick={()=>del(it.id)}>Ukloni</button>
            </div>
          </li>
        ))}
      </ul>

      <div className="flex justify-between items-center mt-4">
        <div className="text-xl font-semibold">Ukupno: {total.toFixed(2)} €</div>
        <button className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
                disabled={!items.length}
                onClick={checkout}>
          Checkout
        </button>
      </div>
    </div>
  );
}
