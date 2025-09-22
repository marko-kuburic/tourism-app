export function normalizeRole(profile) {
  if (!profile) return "";
  const raw =
    profile.role ??
    (Array.isArray(profile.roles) && profile.roles[0]) ??
    (Array.isArray(profile.authorities) && profile.authorities[0]?.authority) ??
    "";
  return String(raw).toLowerCase().replace(/^role_/, ""); // npr. ROLE_GUIDE -> "guide"
}

export function landingPathFor(role) {
  if (role === "admin") return "/admin";     // admin vidi user-management (pregled/blok) :contentReference[oaicite:0]{index=0}
  if (role === "guide") return "/author";    // autor pravi/uređuje svoje ture :contentReference[oaicite:1]{index=1}
  if (role === "tourist") return "/tours";   // turista lista objavljene ture, ostavlja recenzije :contentReference[oaicite:2]{index=2}
  return "/login";
}
