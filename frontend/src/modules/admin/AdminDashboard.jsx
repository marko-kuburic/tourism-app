export default function AdminDashboard() {
  return (
    <div className="page">
      <h1>Admin dashboard</h1>
      <ul>
        <li><a href="/admin/users">Korisnici (pregled/blokiranje)</a></li>
        {/* Dodaj još admin sekcija po potrebi */}
      </ul>
    </div>
  );
}
