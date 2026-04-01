import { useEffect, useMemo, useState } from "react";
import { supabase } from "./supabaseClient";

export default function App() {
  const [zona, setZona] = useState("");
  const [via, setVia] = useState("");
  const [tratto, setTratto] = useState("");

  const [visibilita, setVisibilita] = useState("");
  const [traffico, setTraffico] = useState("");
  const [lunghezza, setLunghezza] = useState("");
  const [larghezza, setLarghezza] = useState("");
  const [grade, setGrade] = useState("");
  const [note, setNote] = useState("");

  const [fotoFile, setFotoFile] = useState(null);
  const [fotoPreview, setFotoPreview] = useState("");

  const [items, setItems] = useState([]);
  const [zoneVie, setZoneVie] = useState([]);

  const [loading, setLoading] = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingZoneVie, setLoadingZoneVie] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const visibilitaList = ["ALTA", "MEDIA", "BASSA"];
  const trafficoList = ["ALTO", "MEDIO", "BASSO"];
  const lunghezzaList = ["CORTA", "MEDIA", "LUNGA"];
  const larghezzaList = ["STRETTA", "MEDIA", "LARGA"];
  const gradeList = ["Nuova", "Buona", "Discreta", "Scadente", "Pessima", "Critica"];

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

  // Gestione tratti con default "INTERA" per i NULL
  const trattiFiltrati = useMemo(() => {
    if (!zona || !via) return [];
    const list = zoneVie
      .filter((item) => item.zona === zona && item.via === via)
      .map((item) => item.tratto || "INTERA");
    return [...new Set(list)].sort((a, b) => a.localeCompare(b, "it"));
  }, [zoneVie, zona, via]);

  // Seleziona automaticamente il tratto
  useEffect(() => {
    if (trattiFiltrati.length > 0) {
      if (trattiFiltrati.includes("INTERA")) {
        setTratto("INTERA");
      } else {
        setTratto(trattiFiltrati[0]);
      }
    } else {
      setTratto("");
    }
  }, [trattiFiltrati]);

  const canAdd = useMemo(() => {
    return zona && via && tratto && visibilita && traffico && lunghezza && larghezza && grade && !loading;
  }, [zona, via, tratto, visibilita, traffico, lunghezza, larghezza, grade, loading]);

  const top3Ids = useMemo(() => {
    return [...items]
      .sort((a, b) => (b.rating_totale || 0) - (a.rating_totale || 0))
      .slice(0, 3)
      .map((item) => item.id);
  }, [items]);

  useEffect(() => {
    loadItems();
    loadZoneVie();
  }, []);

  async function loadItems() {
    setLoadingList(true);
    const { data, error } = await supabase
      .from("segnalazioni")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      setErrorMessage("Errore nel caricamento delle segnalazioni.");
    } else {
      setItems(data || []);
    }
    setLoadingList(false);
  }

  async function loadZoneVie() {
    setLoadingZoneVie(true);
    const { data, error } = await supabase
      .from("zone_vie")
      .select("zona, via, tratto")
      .order("zona", { ascending: true })
      .order("via", { ascending: true });
    if (!error) setZoneVie(data || []);
    setLoadingZoneVie(false);
  }

  function handleZonaChange(event) {
    setZona(event.target.value);
    setVia("");
    setTratto("");
  }

  function handlePhotoChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setFotoFile(file);
    const reader = new FileReader();
    reader.onload = () => setFotoPreview(reader.result);
    reader.readAsDataURL(file);
  }

  async function uploadPhoto() {
    if (!fotoFile) return null;
    const ext = fotoFile.name.split(".").pop()?.toLowerCase() || "jpg";
    const fileName = `${crypto.randomUUID()}.${ext}`;
    const filePath = `uploads/${fileName}`;
    const { error: uploadError } = await supabase.storage
      .from("foto-segnalazioni")
      .upload(filePath, fotoFile);
    if (uploadError) throw uploadError;
    const { data } = supabase.storage.from("foto-segnalazioni").getPublicUrl(filePath);
    return data.publicUrl;
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

  function getNumericScores({ visibilita, traffico, lunghezza, larghezza, grade }) {
    const scoreVisibilitaMap = { ALTA: 5, MEDIA: 3, BASSA: 1 };
    const scoreTrafficoMap = { BASSO: 1, MEDIO: 3, ALTO: 5 };
    const scoreLunghezzaMap = { CORTA: 1, MEDIA: 3, LUNGA: 5 };
    const scoreLarghezzaMap = { LARGA: 5, MEDIA: 3, STRETTA: 1 };
    const scoreGradeMap = { Nuova: 0, Buona: 1, Discreta: 2, Scadente: 3, Pessima: 4, Critica: 5 };
    return {
      score_visibilita: scoreVisibilitaMap[visibilita] || 0,
      score_traffico: scoreTrafficoMap[traffico] || 0,
      score_lunghezza: scoreLunghezzaMap[lunghezza] || 0,
      score_larghezza: scoreLarghezzaMap[larghezza] || 0,
      score_grade: scoreGradeMap[grade] || 0,
    };
  }

  function calculateRating(scores) {
    const PESI = { visibilita: 0.1, traffico: 0.25, lunghezza: 0.10, larghezza: 0.15, grade: 0.4 };
    const totale =
      scores.score_visibilita * PESI.visibilita +
      scores.score_traffico * PESI.traffico +
      scores.score_lunghezza * PESI.lunghezza +
      scores.score_larghezza * PESI.larghezza +
      scores.score_grade * PESI.grade;
    return Number(totale.toFixed(2));
  }

  async function addItem() {
    if (!canAdd) return;
    setLoading(true);
    try {
      let imageUrl = null;
      if (fotoFile) imageUrl = await uploadPhoto();
      const scores = getNumericScores({ visibilita, traffico, lunghezza, larghezza, grade });
      const ratingTotale = calculateRating(scores);
      const payload = {
        tratto, titolo: `${via} - ${tratto}`, zona, via, visibilita, traffico, lunghezza, larghezza, grade, note,
        image_url: imageUrl, score_visibilita: scores.score_visibilita, score_traffico: scores.score_traffico,
        score_lunghezza: scores.score_lunghezza, score_larghezza: scores.score_larghezza,
        score_grade: scores.score_grade, rating_totale: ratingTotale,
      };
      const { data, error } = await supabase.from("segnalazioni").insert([payload]).select();
      if (error) throw error;
      if (data?.[0]) setItems((prev) => [data[0], ...prev]);
      
      // Reset form
      setZona(""); setVia(""); setTratto(""); setVisibilita(""); setTraffico(""); setLunghezza(""); setLarghezza(""); setGrade(""); setNote("");
      setFotoFile(null); setFotoPreview("");
      if (document.getElementById("foto-upload")) document.getElementById("foto-upload").value = "";
    } catch (e) { console.error(e); setErrorMessage("Errore nel salvataggio."); }
    finally { setLoading(false); }
  }

  return (
    <div className="p-6 md:p-10">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[420px_1fr]">
        {/* COLONNA SINISTRA: FORM */}
        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h1 className="text-2xl font-bold text-slate-900 mb-6">Inserimento segnalazione</h1>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Zona</label>
              <select value={zona} onChange={handleZonaChange} className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500 disabled:bg-slate-100">
                <option value="">{loadingZoneVie ? "Caricamento..." : "Seleziona zona"}</option>
                {zoneList.map((z) => <option key={z} value={z}>{z}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Via</label>
              <select value={via} onChange={(e) => { setVia(e.target.value); setTratto(""); }} disabled={!zona} className="w-full rounded-2xl border border-slate-300 px-4 py-3 focus:border-slate-500 disabled:bg-slate-100">
                <option value="">{!zona ? "Prima seleziona zona" : "Seleziona via"}</option>
                {vieFiltrate.map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Tratto</label>
              <select value={tratto} onChange={(e) => setTratto(e.target.value)} disabled={!via || trattiFiltrati.length <= 1} className="w-full rounded-2xl border border-slate-300 px-4 py-3 focus:border-slate-500 disabled:bg-slate-50 disabled:text-slate-500">
                {trattiFiltrati.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              {trattiFiltrati.length === 1 && via && <p className="mt-1 text-[10px] text-slate-400 ml-2 italic">Valore unico preimpostato</p>}
            </div>
            {/* Altri select (Visibilità, Traffico, etc...) */}
            {[
              { label: "Visibilità", state: visibilita, setter: setVisibilita, list: visibilitaList },
              { label: "Traffico", state: traffico, setter: setTraffico, list: trafficoList },
              { label: "Lunghezza", state: lunghezza, setter: setLunghezza, list: lunghezzaList },
              { label: "Larghezza", state: larghezza, setter: setLarghezza, list: larghezzaList },
              { label: "Grade", state: grade, setter: setGrade, list: gradeList }
            ].map((f) => (
              <div key={f.label}>
                <label className="mb-1 block text-sm font-medium text-slate-700">{f.label}</label>
                <select value={f.state} onChange={(e) => f.setter(e.target.value)} className="w-full rounded-2xl border border-slate-300 px-4 py-3 focus:border-slate-500">
                  <option value="">Seleziona {f.label.toLowerCase()}</option>
                  {f.list.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
            ))}
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Upload foto</label>
              <input id="foto-upload" type="file" accept="image/*" onChange={handlePhotoChange} className="block w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Note</label>
              <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note..." rows={3} className="w-full rounded-2xl border border-slate-300 px-4 py-3 focus:border-slate-500" />
            </div>
            {fotoPreview && <img src={fotoPreview} className="h-40 w-full object-cover rounded-2xl border" alt="preview" />}
            <button onClick={addItem} disabled={!canAdd} className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-white font-semibold hover:opacity-90 disabled:opacity-40">
              {loading ? "Salvataggio..." : "Aggiungi alla lista"}
            </button>
          </div>
        </section>

        {/* COLONNA DESTRA: LISTA (CARD DETTAGLIATE) */}
        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">Ultime segnalazioni</h2>
            <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium">Totale: {items.length}</div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => (
              <article key={item.id} className={`overflow-hidden rounded-3xl border bg-slate-50 ${top3Ids.includes(item.id) ? "border-red-700 ring-4 ring-red-500 shadow-lg shadow-red-300" : "border-slate-200"}`}>
  {item.image_url ? (
    <img src={item.image_url} alt={item.via} className="h-48 w-full object-cover" />
  ) : (
    <div className="flex h-48 items-center justify-center bg-slate-200 text-sm text-slate-500">Nessuna foto salvata</div>
  )}

  <div className="space-y-4 p-4">
    {/* 1. INFORMAZIONI GENERALI */}
    <div>
      <h3 className="text-lg font-semibold text-slate-900 uppercase">{item.via}</h3>
      <p className="text-sm font-medium text-slate-700">{item.tratto}</p>
      <p className="mt-1 text-sm text-slate-600">{item.zona}</p>
      <p className="mt-1 text-xs text-slate-400 italic">Creato il {new Date(item.created_at).toLocaleString("it-IT")}</p>
    </div>

    {/* 2. RATING TOTALE (SPOSTATO QUI) con colore dinamico*/}
    <div className="rounded-2xl bg-white border border-slate-200 px-4 py-3 shadow-sm">
	<div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Rating totale</div>
	<div className={`text-3xl font-black ${item.rating_totale > 4 ? "text-red-600" : "text-slate-900"}`}>
    {item.rating_totale ?? "-"}
  </div>
</div>

    {/* 3. BADGE E GRADE */}
    <div className="flex flex-wrap items-center gap-2">
      {/* Grade Badge (Ora più grande come chiesto prima) */}
      <span className={`rounded-full px-4 py-2 text-sm font-black uppercase tracking-wider shadow-sm ${getGradeStyle(item.grade)}`}>
        {item.grade}
      </span>
      
      {/* Altri mini-badge */}
      <div className="flex flex-wrap gap-1 text-[10px] text-slate-500">
        <span className="rounded-md bg-white px-2 py-1 ring-1 ring-slate-200">Visibilità: {item.visibilita}</span>
        <span className="rounded-md bg-white px-2 py-1 ring-1 ring-slate-200">Traffico: {item.traffico}</span>
        <span className="rounded-md bg-white px-2 py-1 ring-1 ring-slate-200">Lunghezza: {item.lunghezza}</span>
        <span className="rounded-md bg-white px-2 py-1 ring-1 ring-slate-200">Larghezza: {item.larghezza}</span>
      </div>
    </div>

    {/* 4. NOTE */}
    <div className="rounded-2xl bg-slate-100 px-4 py-2">
      <div className="text-[10px] uppercase tracking-wide text-slate-500 font-bold">Note</div>
      <div className="mt-1 text-sm text-slate-700 italic leading-snug">
        {item.note?.trim() ? item.note : "Nessuna nota aggiuntiva."}
      </div>
    </div>
  </div>
</article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}