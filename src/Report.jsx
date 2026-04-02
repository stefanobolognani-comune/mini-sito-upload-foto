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
    XLSX.writeFile(workbook, `Report_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  // FUNZIONE SALVA NOTA
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

  const stats = useMemo(() => {
    if (filteredItems.length === 0) return { totale: 0, media: 0, massimo: 0 };
    const totale = filteredItems.length;
    const somma = filteredItems.reduce((acc, item) => acc + Number(item.rating_totale || 0), 0);
    const massimo = Math.max(...filteredItems.map((item) => Number(item.rating_totale || 0)));
    return { totale, media: Number((somma / totale).toFixed(2)), massimo: Number(massimo.toFixed(2)) };
  }, [filteredItems]);

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
    <div className="p-4 md:p-10 bg-slate-50 min-h-screen">
      <div className="mx-auto max-w-7xl space-y-6">
        
        {/* FILTRI */}
        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h1 className="text-2xl font-bold text-slate-900 mb-6">Report Urbanistica</h1>
          <div className="grid gap-4 md:grid-cols-3">
            <select value={zona} onChange={(e) => {setZona(e.target.value); setVia(""); setTratto("");}} className="w-full rounded-2xl border border-slate-300 p-3 outline-none focus:border-blue-500">
              <option value="">Tutte le zone</option>
              {zoneList.map(z => <option key={z} value={z}>{z}</option>)}
            </select>
            <select value={via} onChange={(e) => {setVia(e.target.value); setTratto("");}} disabled={!zona} className="w-full rounded-2xl border border-slate-300 p-3 outline-none focus:border-blue-500 disabled:bg-slate-50">
              <option value="">Tutte le vie</option>
              {vieFiltrate.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
            <select value={tratto} onChange={(e) => setTratto(e.target.value)} disabled={!via} className="w-full rounded-2xl border border-slate-300 p-3 outline-none focus:border-blue-500 disabled:bg-slate-50">
              <option value="">Tutti i tratti</option>
              {trattiFiltrati.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </section>

        {/* STATS RAPIDE */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-3xl shadow-sm ring-1 ring-slate-200 text-center">
            <div className="text-xs text-slate-400 uppercase font-bold">Totale</div>
            <div className="text-2xl font-black">{stats.totale}</div>
          </div>
          <div className="bg-white p-4 rounded-3xl shadow-sm ring-1 ring-slate-200 text-center">
            <div className="text-xs text-slate-400 uppercase font-bold">Media</div>
            <div className="text-2xl font-black text-blue-600">{stats.media}</div>
          </div>
          <div className="bg-white p-4 rounded-3xl shadow-sm ring-1 ring-slate-200 text-center">
            <div className="text-xs text-slate-400 uppercase font-bold">Max</div>
            <div className="text-2xl font-black text-red-600">{stats.massimo}</div>
          </div>
        </div>

        {/* TABELLA */}
        <section className="rounded-3xl bg-white shadow-sm ring-1 ring-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h2 className="text-lg font-bold">Dettaglio Segnalazioni</h2>
            <button onClick={exportToExcel} className="bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-green-700 transition">
              Esporta Excel
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wider">
                  <th className="p-4 font-bold">Località</th>
                  <th className="p-4 font-bold">Dati Tecnici</th>
                  <th className="p-4 font-bold text-center">Rating</th>
                  <th className="p-4 font-bold">Note</th>
                  <th className="p-4 text-right"></th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition">
                    <td className="p-4">
                      <div className="font-bold text-slate-900 leading-tight">{item.via}</div>
                      <div className="text-[10px] text-slate-400 uppercase font-medium">{item.zona} {item.tratto ? `• ${item.tratto}` : ""}</div>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-1 mb-1 text-[10px] font-bold">
                        <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 uppercase">V: {item.visibilita}</span>
                        <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 uppercase">T: {item.traffico}</span>
                      </div>
                      <div className="text-slate-500 text-[11px]">Dim: <span className="font-bold text-slate-700">{item.lunghezza}x{item.larghezza}m</span></div>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`block mx-auto w-fit px-2 py-0.5 rounded-full text-[9px] font-black uppercase mb-1 ${getGradeStyle(item.grade)}`}>{item.grade}</span>
                      <span className="text-lg font-black text-slate-900">{item.rating_totale}</span>
                    </td>
                    <td className="p-4 text-[11px] italic text-slate-400 max-w-[200px] truncate">
                      {item.note || "—"}
                    </td>
                    <td className="p-4 text-right">
                      <button 
                        onClick={() => { setEditingItem(item); setTempNote(item.note || ""); setIsModalOpen(true); }}
                        className="p-2 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* MODAL NOTE */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <h2 className="text-lg font-bold mb-1">Note Tecniche</h2>
            <p className="text-[10px] text-slate-400 uppercase mb-4">{editingItem?.via}</p>
            <textarea
              value={tempNote}
              onChange={(e) => setTempNote(e.target.value)}
              className="w-full h-32 rounded-2xl border border-slate-200 p-4 text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition"
              placeholder="Inserisci osservazioni..."
            />
            <div className="mt-4 flex gap-2">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 p-3 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-2xl transition">Annulla</button>
              <button onClick={handleSaveNote} className="flex-1 p-3 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-2xl shadow-lg shadow-blue-200 transition">Salva</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}