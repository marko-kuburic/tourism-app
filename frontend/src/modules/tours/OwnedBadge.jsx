import { useEffect, useState } from 'react';
import { PurchaseAPI } from '../purchase/PurchaseApi';

export default function OwnedBadge({ tourId, className = '' }) {
  const [owned, setOwned] = useState(false);

  useEffect(() => {
    let alive = true;
    PurchaseAPI.hasOwnership(tourId).then(r => { if (alive) setOwned(!!r.owned); });
    return () => { alive = false; };
  }, [tourId]);

  if (!owned) return null;
  return (
    <span className={`ml-2 px-2 py-0.5 rounded bg-green-100 text-green-800 text-xs ${className}`}>
      Kupljeno
    </span>
  );
}
