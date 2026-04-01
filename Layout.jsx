import { Link, Outlet, useLocation } from "react-router";

export default function Layout() {
  const location = useLocation();

  function getLinkClass(path) {
    const isActive = location.pathname === path;
    return `rounded-2xl px-4 py-2 text-sm font-medium transition ${
      isActive
        ? "bg-slate-900 text-white"
        : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100"
    }`;
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4 md:px-10">
          <div>
            <h1 className="text-lg font-bold text-slate-900">Assessorato Urbanistica</h1>
            <p className="text-sm text-slate-500">Gestione segnalazioni e report</p>
          </div>

          <nav className="flex items-center gap-2">
            <Link to="/" className={getLinkClass("/")}>
              Inserimento
            </Link>
            <Link to="/report" className={getLinkClass("/report")}>
              Report
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <Outlet />
      </main>
    </div>
  );
}