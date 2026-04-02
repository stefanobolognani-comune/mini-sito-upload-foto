import { useEffect, useMemo, useState } from "react";
import { supabase } from "./supabaseClient";
import * as XLSX from "xlsx";

export default function Report() {
  const [zona, setZona] = useState("");
  const [via, setVia] = useState("");
  const [tratto, setTratto] = useState("");

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
    const { data, error } = await supabase
      .from("segnalazioni")
      .select("*")
      .order("rating_totale", { ascending: false });

    if (error) {
      setErrorMessage("Errore nel caricamento dati.");
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
      .select("zona, via, tratto")
      .order("zona", { ascending: true })
      .order("via", { ascending: true });

    if (error) {
      setLoadingZoneVie(false);
      return;
    }
    setZoneVie(data || []);
    setLoadingZoneVie(false);
  }

  // --- FUNZIONE EXPORT (Include le Note) ---
  const exportToExcel = () => {
    const dataToExport = filteredItems.map((item) => ({
      ZONA: item.zona,
      VIA: item.via,
      TRATTO: item.tratto || "-",
      VISIBILITÀ: item.visibilita,
      TRAFFICO: item.traffico,
      LUNGHEZZA: item.lunghezza,
      LARGHEZZA: item.larghezza,
      GRADO: item.grade,
      RATING: item.rating_totale,
      NOTE: item.note || "", // <--- Note incluse qui
      DATA: item.created_at ? new Date(item.created_at).toLocaleDateString("it-IT") : "-",
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
    XLSX.writeFile(workbook, `Report_Urbano_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  const zoneList = useMemo(() => {
    return [...new Set(zoneVie.map((item) => item.zona))].sort();
  }, [zoneVie]);

  const vieFiltrate = useMemo(() => {
    if (!zona) return [];
    return [...new Set(zoneVie.filter((i) => i.zona === zona).map((i) => i.via))].sort();
  }, [zoneVie, zona]);

  const trattiFiltrati = useMemo(() => {
    if (!via) return [];
    return [...new Set(zoneVie.filter((i) => i.via === via).map((i) => i.tratto))].sort();
  }, [zoneVie, via]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      return (zona ? item.zona === zona : true) &&
             (via ? item.via === via : true) &&
             (tratto ? item.tratto === tratto : true);
    });
  }, [items, zona, via, tratto]);

  function getGradeStyle(grade) {
    const styles = {
      "Nuova": "bg-blue-50 text-blue-600",
      "Buona": "bg-green-50 text-green-600",
      "Discreta": "bg-yellow-50 text-yellow-600",
      "Scadente": "bg-orange-50 text-orange-600",
      "Pessima": "bg-red-50 text-red-600",
      "Critica": "bg-red-600 text-white"
    };
    return styles[grade] || "bg-slate-50 text-slate-400";
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 text-slate-800">
      <div className="mx-auto max-w-7xl space-y-6">
        
        {/* HEADER & FILTRI */}
        <header className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900">Database Segnalazioni</h1>
              <p className="text-sm text-slate-500">Visualizzazione e analisi dei dati tecnici rilevati.</p>
            </div>
            <button 
              onClick={exportToExcel}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-2xl font-bold text-sm transition shadow-lg shadow-emerald-100 flex items-center justify-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              ESPORTA EXCEL
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <select value={zona} onChange={(e) => {setZona(e.target.value); setVia("");}} className="bg-slate-50 border-none rounded-2xl p-3 text-sm focus:ring-2 focus:ring-slate-200 transition">
              <option value="">Tutte le Zone</option>
              {zoneList.map(z => <option key={z} value={z}>{z}</option>)}
            </select>
            <select value={via} onChange={(e) => {setVia(e.target.value); setTratto("");}} disabled={!zona} className="bg-slate-50 border-none rounded-2xl p-3 text-sm focus:ring-2 focus:ring-slate-200 transition disabled:opacity-50">
              <option value="">Tutte le Vie</option>
              {vieFiltrate.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
            <select value={tratto} onChange={(e) => setTratto(e.target.value)} disabled={!via} className="bg-slate-50 border-none rounded-2xl p-3 text-sm focus:ring-2 focus:ring-slate-200 transition disabled:opacity-50">
              <option value="">Tutti i Tratti</option>
              {trattiFiltrati.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </header>

        {/* TABELLA DATI */}
        <main className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] uppercase tracking-widest text-slate-400 font-bold">
                  <th className="p-4">Località</th>
                  <th className="p-4 text-center">Dati Tecnici</th>
                  <th className="p-4 text-center">Rating / Grado</th>
                  <th className="p-4">Note</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-slate-50">
                {loadingItems ? (
                  <tr><td colSpan="4" className="p-10 text-center text-slate-400 italic">Caricamento in corso...</td></tr>
                ) : filteredItems.length === 0 ? (
                  <tr><td colSpan="4" className="p-10 text-center text-slate-400 italic">Nessun dato corrispondente ai filtri.</td></tr>
                ) : (
                  filteredItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/30 transition">
                      <td className="p-4">
                        <div className="font-bold text-slate-900">{item.via}</div>
                        <div className="text-[10px] text-slate-400 uppercase font-semibold">{item.zona} {item.tratto && `• ${item.tratto}`}</div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col items-center gap-1">
                          <div className="flex gap-1">
                            <span className="text-[9px] bg-slate-100 px-1 rounded text-slate-500 font-bold">V: {item.visibilita}</span>
                            <span className="text-[9px] bg-slate-100 px-1 rounded text-slate-500 font-bold">T: {item.traffico}</span>
                          </div>
                          <div className="text-[11px] text-slate-600 font-medium">{item.lunghezza} x {item.larghezza} m</div>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <div className="text-lg font-black text-slate-900 leading-none">{item.rating_totale}</div>
                        <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase ${getGradeStyle(item.grade)}`}>
                          {item.grade}
                        </span>
                      </td>
                      <td className="p-4">
                        <p className="text-[11px] text-slate-500 italic leading-relaxed max-w-xs">
                          {item.note || "—"}
                        </p>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  );
}