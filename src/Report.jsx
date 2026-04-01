import { useEffect, useMemo, useState } from "react";
import { supabase } from "./supabaseClient";

export default function Report() {
  const [zona, setZona] = useState("");
  const [via, setVia] = useState("");

  const [items, setItems] = useState([]);
  const [zoneVie, setZoneVie] = useState([]);

  const [loadingItems, setLoadingItems] = useState(true);
  const [loadingZoneVie, setLoadingZoneVie] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    loadSegnalazioni();
    loadZoneVie();
  }, []);

  async function loadSegnalazioni() {
    setLoadingItems(true);
    setErrorMessage("");

    const { data, error } = await supabase
      .from("segnalazioni")
      .select("*")
      .order("rating_totale", { ascending: false });

    if (error) {
      console.error(error);
      setErrorMessage("Errore nel caricamento delle segnalazioni.");
      setLoadingItems(false);
      return;
    }

    setItems(data || []);
    setLoadingItems(false);
  }

  async function loadZoneVie() {
    setLoadingZoneVie(true);

    const { data, error } = await supabase
      .from("zone_vie")
      .select("zona, via")
      .order("zona", { ascending: true })
      .order("via", { ascending: true });

    if (error) {
      console.error(error);
      setErrorMessage("Errore nel caricamento di zone e vie.");
      setLoadingZoneVie(false);
      return;
    }

    setZoneVie(data || []);
    setLoadingZoneVie(false);
  }

  const zoneList = useMemo(() => {
    const uniqueZones = [...new Set(zoneVie.map((item) => item.zona))];
    return uniqueZones.sort((a, b) => a.localeCompare(b, "it"));
  }, [zoneVie]);

  const vieFiltrate = useMemo(() => {
    if (!zona) return [];
    return zoneVie
      .filter((item) => item.zona === zona)
      .map((item) => item.via)
      .sort((a, b) => a.localeCompare(b, "it"));
  }, [zoneVie, zona]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchZona = zona ? item.zona === zona : true;
      const matchVia = via ? item.via === via : true;
      return matchZona && matchVia;
    });
  }, [items, zona, via]);

  const top10 = useMemo(() => {
    return [...items]
      .sort((a, b) => (b.rating_totale || 0) - (a.rating_totale || 0))
      .slice(0, 10);
  }, [items]);

  const stats = useMemo(() => {
    if (filteredItems.length === 0) {
      return {
        totale: 0,
        media: 0,
        massimo: 0,
      };
    }

    const totale = filteredItems.length;
    const somma = filteredItems.reduce(
      (acc, item) => acc + Number(item.rating_totale || 0),
      0
    );
    const massimo = Math.max(...filteredItems.map((item) => Number(item.rating_totale || 0)));
    const media = somma / totale;

    return {
      totale,
      media: Number(media.toFixed(2)),
      massimo: Number(massimo.toFixed(2)),
    };
  }, [filteredItems]);

  function handleZonaChange(event) {
    setZona(event.target.value);
    setVia("");
  }

  function getGradeStyle(gradeValue) {
    switch (gradeValue) {
      case "Nuova":
        return "bg-blue-100 text-blue-800";
      case "Buona":
        return "bg-green-100 text-green-800";
      case "Discreta":
        return "bg-yellow-100 text-yellow-800";
      case "Scadente":
        return "bg-orange-100 text-orange-800";
      case "Pessima":
        return "bg-red-200 text-red-900";
      case "Critica":
        return "bg-red-600 text-white";
      default:
        return "bg-gray-100 text-gray-800";
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 p-6 md:p-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900">Report Segnalazioni</h1>
            <p className="mt-2 text-sm text-slate-600">
              Filtra per zona e via, consulta i rating e visualizza il Top 10 delle criticità.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Zona</label>
              <select
                value={zona}
                onChange={handleZonaChange}
                disabled={loadingZoneVie}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500 disabled:bg-slate-100"
              >
                <option value="">
                  {loadingZoneVie ? "Caricamento zone..." : "Tutte le zone"}
                </option>
                {zoneList.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Via</label>
              <select
                value={via}
                onChange={(e) => setVia(e.target.value)}
                disabled={!zona || loadingZoneVie}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500 disabled:bg-slate-100"
              >
                <option value="">
                  {!zona ? "Prima seleziona una zona" : "Tutte le vie"}
                </option>
                {vieFiltrate.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {errorMessage && (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </div>
          )}
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="text-sm text-slate-500">Segnalazioni filtrate</div>
            <div className="mt-2 text-3xl font-bold text-slate-900">{stats.totale}</div>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="text-sm text-slate-500">Rating medio</div>
            <div className="mt-2 text-3xl font-bold text-slate-900">{stats.media}</div>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="text-sm text-slate-500">Rating massimo</div>
            <div className="mt-2 text-3xl font-bold text-slate-900">{stats.massimo}</div>
          </div>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-slate-900">Scheda tabellare</h2>
            <p className="mt-1 text-sm text-slate-600">
              Dettaglio completo delle segnalazioni filtrate.
            </p>
          </div>

          {loadingItems ? (
            <div className="rounded-3xl border border-dashed border-slate-300 p-10 text-center text-slate-500">
              Caricamento dati...
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 p-10 text-center text-slate-500">
              Nessun dato trovato per i filtri selezionati.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-100 text-left">
                    <th className="p-3 font-semibold text-slate-700">Zona</th>
                    <th className="p-3 font-semibold text-slate-700">Via</th>
                    <th className="p-3 font-semibold text-slate-700">Visibilità</th>
                    <th className="p-3 font-semibold text-slate-700">Traffico</th>
                    <th className="p-3 font-semibold text-slate-700">Lunghezza</th>
                    <th className="p-3 font-semibold text-slate-700">Larghezza</th>
                    <th className="p-3 font-semibold text-slate-700">Grade</th>
                    <th className="p-3 font-semibold text-slate-700">Rating</th>
                    <th className="p-3 font-semibold text-slate-700">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item) => (
                    <tr key={item.id} className="border-t border-slate-200">
                      <td className="p-3">{item.zona}</td>
                      <td className="p-3 font-medium text-slate-900">{item.via}</td>
                      <td className="p-3">{item.visibilita}</td>
                      <td className="p-3">{item.traffico}</td>
                      <td className="p-3">{item.lunghezza}</td>
                      <td className="p-3">{item.larghezza}</td>
                      <td className="p-3">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${getGradeStyle(
                            item.grade
                          )}`}
                        >
                          {item.grade}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-slate-900">
                        {item.rating_totale ?? "-"}
                      </td>
                      <td className="p-3 text-slate-600">
                        {item.created_at
                          ? new Date(item.created_at).toLocaleString("it-IT")
                          : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-slate-900">Top 10 Rating più alti</h2>
            <p className="mt-1 text-sm text-slate-600">
              Le segnalazioni con priorità più alta in base al rating calcolato.
            </p>
          </div>

          {loadingItems ? (
            <div className="rounded-3xl border border-dashed border-slate-300 p-10 text-center text-slate-500">
              Caricamento classifica...
            </div>
          ) : top10.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 p-10 text-center text-slate-500">
              Nessun dato disponibile.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-100 text-left">
                    <th className="p-3 font-semibold text-slate-700">#</th>
                    <th className="p-3 font-semibold text-slate-700">Zona</th>
                    <th className="p-3 font-semibold text-slate-700">Via</th>
                    <th className="p-3 font-semibold text-slate-700">Grade</th>
                    <th className="p-3 font-semibold text-slate-700">Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {top10.map((item, index) => (
                    <tr key={item.id} className="border-t border-slate-200">
                      <td className="p-3 font-bold text-slate-900">{index + 1}</td>
                      <td className="p-3">{item.zona}</td>
                      <td className="p-3 font-medium text-slate-900">{item.via}</td>
                      <td className="p-3">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${getGradeStyle(
                            item.grade
                          )}`}
                        >
                          {item.grade}
                        </span>
                      </td>
                      <td className="p-3 text-lg font-bold text-slate-900">
                        {item.rating_totale ?? "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}