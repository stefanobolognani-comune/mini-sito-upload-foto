import { useEffect, useMemo, useState } from "react";
import { supabase } from "./supabaseClient";
import * as XLSX from "xlsx"; // <--- Ricordati di installare questa libreria

export default function Report() {
  const [zona, setZona] = useState("");
  const [via, setVia] = useState("");
  const [tratto, setTratto] = useState("");

  const [items, setItems] = useState([]);
  const [zoneVie, setZoneVie] = useState([]);

  const [loadingItems, setLoadingItems] = useState(true);
  const [loadingZoneVie, setLoadingZoneVie] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  // STATI PER IL MODAL DELLE NOTE
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [tempNote, setTempNote] = useState("");

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
      .select("zona, via, tratto")
      .order("zona", { ascending: true })
      .order("via", { ascending: true })
      .order("tratto", { ascending: true });

    if (error) {
      console.error(error);
      setErrorMessage("Errore nel caricamento di zone, vie e tratti.");
      setLoadingZoneVie(false);
      return;
    }
    setZoneVie(data || []);
    setLoadingZoneVie(false);
  }

  // FUNZIONE ESPORTA EXCEL
  const exportToExcel = () => {
    const dataToExport = filteredItems.map((item) => ({
      Zona: item.zona,
      Via: item.via,
      Tratto: item.tratto || "-",
      Visibilità: item.visibilita,
      Traffico: item.traffico,
      Lunghezza: item.lunghezza,
      Larghezza: item.larghezza,
      Grado: item.grade,
      Rating: item.rating_totale,
      Note: item.note || "-",
      Data: item.created_at ? new Date(item.created_at).toLocaleString("it-IT") : "-",
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Segnalazioni");
    XLSX.writeFile(workbook, `Report_Segnalazioni_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  // FUNZIONE SALVA NOTA SU SUPABASE
  async function handleSaveNote() {
    if (!editingItem) return;

    const { error } = await supabase
      .from("segnalazioni")
      .update({ note: tempNote })
      .eq("id", editingItem.id);

    if (error) {
      alert("Errore nel salvataggio: " + error.message);
    } else {
      setItems(items.map(i => i.id === editingItem.id ? { ...i, note: tempNote } : i));
      setIsModalOpen(false);
      setEditingItem(null);
    }
  }

  const zoneList = useMemo(() => {
    const uniqueZones = [...new Set(zoneVie.map((item) => item.zona))];
    return uniqueZones.sort((a, b) => a.localeCompare(b, "it"));
  }, [zoneVie]);

  const vieFiltrate = useMemo(() => {
    if (!zona) return [];
    const uniqueVie = [...new Set(zoneVie.filter((item) => item.zona === zona).map((item) => item.via))];
    return uniqueVie.sort((a, b) => a.localeCompare(b, "it"));
  }, [zoneVie, zona]);

  const trattiFiltrati = useMemo(() => {
    if (!zona || !via) return [];
    const uniqueTratti = [...new Set(zoneVie.filter((item) => item.zona === zona && item.via === via).map((item) => item.tratto))];
    return uniqueTratti.sort((a, b) => a.localeCompare(b, "it"));
  }, [zoneVie, zona, via]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchZona = zona ? item.zona === zona : true;
      const matchVia = via ? item.via === via : true;
      const matchTratto = tratto ? item.tratto === tratto : true;
      return matchZona && matchVia && matchTratto;
    });
  }, [items, zona, via, tratto]);

  const top10 = useMemo(() => {
    return [...items].sort((a, b) => (b.rating_totale || 0) - (a.rating_totale || 0)).slice(0, 10);
  }, [items]);

  const stats = useMemo(() => {
    if (filteredItems.length === 0) return { totale: 0, media: 0, massimo: 0 };
    const totale = filteredItems.length;
    const somma = filteredItems.reduce((acc, item) => acc + Number(item.rating_totale || 0), 0);
    const massimo = Math.max(...filteredItems.map((item) => Number(item.rating_totale || 0)));
    return { totale, media: Number((somma / totale).toFixed(2)), massimo: Number(massimo.toFixed(2)) };
  }, [filteredItems]);

  function handleZonaChange(event) {
    setZona(event.target.value);
    setVia("");
    setTratto("");
  }

  function handleViaChange(event) {
    setVia(event.target.value);
    setTratto("");
  }

  function getGradeStyle(gradeValue) {
    switch (gradeValue) {
      case "Nuova": return "bg-blue-100 text-blue-800";
      case "Buona": return "bg-green-100 text-green-800";
      case "Discreta": return "bg-yellow-100 text-yellow-800";
      case "Scadente": return "bg-orange-100 text-orange-800";
      case "Pessima": return "bg-red-200 text-red-900";
      case "Critica": return "bg-red-600 text-white";
      default: return "bg-gray-100 text-gray-800";
    }
  }

  return (
    <div className="p-6 md:p-10 bg-slate-50 min-h-screen text-slate-900">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* HEADER FILTRI */}
        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900">Report Segnalazioni</h1>
            <p className="mt-2 text-sm text-slate-600">Filtra per zona, via e tratto.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Zona</label>
              <select value={zona} onChange={handleZonaChange} disabled={loadingZoneVie} className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500 disabled:bg-slate-100">
                <option value="">{loadingZoneVie ? "Caricamento..." : "Tutte le zone"}</option>
                {zoneList.map((z) => <option key={z} value={z}>{z}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Via</label>
              <select value={via} onChange={handleViaChange} disabled={!zona} className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500 disabled:bg-slate-100">
                <option value="">{!zona ? "Seleziona zona" : "Tutte le vie"}</option>
                {vieFiltrate.map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Tratto</label>
              <select value={tratto} onChange={(e) => setTratto(e.target.value)} disabled={!via} className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500 disabled:bg-slate-100">
                <option value="">{!via ? "Seleziona via" : "Tutti i tratti"}</option>
                {trattiFiltrati.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
        </section>

        {/* STATISTICHE */}
        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="text-sm text-slate-500">Segnalazioni filtrate</div>
            <div className="mt-2 text-3xl font-bold">{stats.totale}</div>
          </div>
          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="text-sm text-slate-500">Rating medio</div>
            <div className="mt-2 text-3xl font-bold">{stats.media}</div>
          </div>
          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="text-sm text-slate-500">Rating massimo</div>
            <div className="mt-2 text-3xl font-bold">{stats.massimo}</div>
          </div>
        </section>

        {/* SCHEDA TABELLARE */}
        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold">Scheda tabellare</h2>
              <p className="text-sm text-slate-600">Dettaglio completo.</p>
            </div>
            <button
              onClick={exportToExcel}
              disabled={filteredItems.length === 0}
              className="flex items-center justify-center gap-2 rounded-2xl bg-green-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50 shadow-sm"
            >
              Esporta Excel
            </button>
          </div>

          {loadingItems ? (
            <div className="p-10 text-center text-slate-500 italic">Caricamento dati...</div>
          ) : filteredItems.length === 0 ? (
            <div className="p-10 text-center text-slate-500 italic">Nessun dato trovato.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-sm text-left">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-700">
                    <th className="p-3 font-semibold">Zona/Via/Tratto</th>
                    <th className="p-3 font-semibold">Dati Tecnici</th>
                    <th className="p-3 font-semibold">Grade/Rating</th>
                    <th className="p-3 font-semibold">Note</th>
                    <th className="p-3 font-semibold text-right">Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item) => (
                    <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                      <td className="p-3">
                        <div className="font-bold">{item.via}</div>
                        <div className="text-[10px] text-slate-500 uppercase">{item.zona} • {item.tratto || "-"}</div>
                      </td>
                      <td className="p-3 text-xs">
                        Vis: {item.visibilita} | Traff: {item.traffico}<br/>
                        Dim: {item.lunghezza}x{item.larghezza}m
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold mr-2 ${getGradeStyle(item.grade)}`}>{item.grade}</span>
                        <span className="font-black text-lg">{item.rating_totale}</span>
                      </td>
                      <td className="p-3 text-slate-600 italic max-w-xs truncate">{item.note || "-"}</td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => { setEditingItem(item); setTempNote(item.note || ""); setIsModalOpen(true); }}
                          className="rounded-xl bg-slate-100 p-2 text-slate-600 hover:bg-blue-100 hover:text-blue-600 transition"
                        >
                          Modifica
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {/* MODAL PER MODIFICA NOTE */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-2xl ring-1 ring-slate-200">
            <h2 className="text-xl font-bold text-slate-900">Modifica Note</h2>
            <p className="text-xs text-slate-500 mb-4 uppercase tracking-widest">{editingItem?.via}</p>
            <textarea
              value={tempNote}
              onChange={(e) => setTempNote(e.target.value)}
              className="h-40 w-full rounded-2xl border border-slate-300 p-4 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition resize-none"
              placeholder="Aggiungi una nota..."
            />
            <div className="mt-6 flex gap-3">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 rounded-2xl bg-slate-100 py-3 font-semibold text-slate-600 hover:bg-slate-200 transition">Annulla</button>
              <button onClick={handleSaveNote} className="flex-1 rounded-2xl bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700 transition shadow-md">Salva Nota</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}