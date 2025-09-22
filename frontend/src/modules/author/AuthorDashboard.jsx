import { Link } from "react-router-dom";
export default function AuthorDashboard() {
  return (
    <div className="page">
      <h1>Author dashboard</h1>
      <div style={{ display:"flex", gap:12 }}>
        <Link className="t-btn" to="/tours/new">+ New Tour</Link>
        <Link className="t-btn" to="/author/my-tours">My Tours</Link>
      </div>
    </div>
  );
}
