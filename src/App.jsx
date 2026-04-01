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

  // MODIFICATO: Gestione valori nulli e unicità dei tratti
  const trattiFiltrati = useMemo(() => {
    if (!zona || !via) return [];

    const list = zoneVie
      .filter((item) => item.zona === zona && item.via === via)
      .map((item) => item.tratto || "INTERA"); // Se nel DB è null, lo consideriamo "INTERA"
    
    // Rimuoviamo i duplicati e ordiniamo
    return [...new Set(list)].sort((a, b) => a.localeCompare(b, "it"));
  }, [zoneVie, zona, via]);

  // NUOVO: Effetto per gestire il default e il readonly logico
  useEffect(() => {
    if (trattiFiltrati.length > 0) {
      // Se esiste "INTERA" tra le opzioni, la mettiamo come default
      if (trattiFiltrati.includes("INTERA")) {
        setTratto("INTERA");
      } else {
        // Altrimenti prendiamo il primo valore disponibile
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
    setErrorMessage("");

    const { data, error } = await supabase
      .from("segnalazioni")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      setErrorMessage("Errore nel caricamento delle segnalazioni.");
      setLoadingList(false);
      return;
    }

    setItems(data || []);
    setLoadingList(false);
  }

  async function loadZoneVie() {
    setLoadingZoneVie(true);

    const { data, error } = await supabase
      .from("zone_vie")
      .select("zona, via, tratto")
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

  function handleZonaChange(event) {
    const selectedZona = event.target.value;
    setZona(selectedZona);
    setVia("");
    setTratto("");
  }

  function handlePhotoChange(event) {
    const file = event.target.files?.[0];
    if (!file) {
      setFotoFile(null);
      setFotoPreview("");
      return;
    }

    setFotoFile(file);

    const reader = new FileReader();
    reader.onload = () => {
      setFotoPreview(reader.result);
    };
    reader.readAsDataURL(file);
  }

  async function uploadPhoto() {
    if (!fotoFile) return null;

    const ext = fotoFile.name.split(".").pop()?.toLowerCase() || "jpg";
    const fileName = `${crypto.randomUUID()}.${ext}`;
    const filePath = `uploads/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("foto-segnalazioni")
      .upload(filePath, fotoFile, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage
      .from("foto-segnalazioni")
      .getPublicUrl(filePath);

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
    setErrorMessage("");

    try {
      let imageUrl = null;
      if (fotoFile) imageUrl = await uploadPhoto();

      const scores = getNumericScores({ visibilita, traffico, lunghezza, larghezza, grade });
      const ratingTotale = calculateRating(scores);

      const payload = {
        tratto,
        titolo: `${via} - ${tratto}`,
        zona,
        via,
        visibilita,
        traffico,
        lunghezza,
        larghezza,
        grade,
        note,
        image_url: imageUrl,
        score_visibilita: scores.score_visibilita,
        score_traffico: scores.score_traffico,
        score_lunghezza: scores.score_lunghezza,
        score_larghezza: scores.score_larghezza,
        score_grade: scores.score_grade,
        rating_totale: ratingTotale,
      };

      const { data, error } = await supabase.from("segnalazioni").insert([payload]).select();
      if (error) throw error;

      const savedItem = data?.[0];
      if (savedItem) setItems((prev) => [savedItem, ...prev]);

      setZona("");
      setVia("");
      setTratto("");
      setVisibilita("");
      setTraffico("");
      setLunghezza("");
      setLarghezza("");
      setGrade("");
      setNote("");
      setFotoFile(null);
      setFotoPreview("");
      if (document.getElementById("foto-upload")) document.getElementById("foto-upload").value = "";
    } catch (error) {
      console.error(error);
      setErrorMessage("Errore nel salvataggio.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 md:p-10">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[420px_1fr]">
        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900">Inserimento segnalazione</h1>
          </div>

          <div className="space-y-4">
            {/* ZONA */}
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Zona</label>
              <select
                value={zona}
                onChange={handleZonaChange}
                disabled={loadingZoneVie}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500 disabled:bg-slate-100"
              >
                <option value="">{loadingZoneVie ? "Caricamento..." : "Seleziona zona"}</option>
                {zoneList.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </div>

            {/* VIA */}
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Via</label>
              <select
                value={via}
                onChange={(e) => {
                  setVia(e.target.value);
                  setTratto(""); 
                }}
                disabled={!zona || loadingZoneVie}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500 disabled:bg-slate-100"
              >
                <option value="">{!zona ? "Prima seleziona zona" : "Seleziona via"}</option>
                {vieFiltrate.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </div>

            {/* TRATTO (MODIFICATO) */}
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Tratto</label>
              <select
                value={tratto}
                onChange={(e) => setTratto(e.target.value)}
                // MODIFICATO: Disabilitato se c'è solo un'opzione disponibile
                disabled={!via || trattiFiltrati.length <= 1}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500 disabled:bg-slate-50 disabled:text-slate-500"
              >
                {trattiFiltrati.length === 0 && <option value="">Seleziona via prima</option>}
                {trattiFiltrati.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
              {trattiFiltrati.length === 1 && via && (
                <p className="mt-1 text-[10px] text-slate-400 ml-2 italic">Valore unico preimpostato</p>
              )}
            </div>

            {/* Altri campi rimangono uguali... */}
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Visibilità</label>
              <select value={visibilita} onChange={(e) => setVisibilita(e.target.value)} className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500">
                <option value="">Seleziona visibilità</option>
                {visibilitaList.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </div>
            
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Traffico</label>
              <select value={traffico} onChange={(e) => setTraffico(e.target.value)} className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500">
                <option value="">Seleziona traffico</option>
                {trafficoList.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Lunghezza</label>
              <select value={lunghezza} onChange={(e) => setLunghezza(e.target.value)} className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500">
                <option value="">Seleziona lunghezza</option>
                {lunghezzaList.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Larghezza</label>
              <select value={larghezza} onChange={(e) => setLarghezza(e.target.value)} className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500">
                <option value="">Seleziona larghezza</option>
                {larghezzaList.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Grade</label>
              <select value={grade} onChange={(e) => setGrade(e.target.value)} className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500">
                <option value="">Seleziona grade</option>
                {gradeList.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Upload foto</label>
              <input id="foto-upload" type="file" accept="image/*" onChange={handlePhotoChange} className="block w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700" />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Note</label>
              <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note..." rows={4} className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500" />
            </div>

            <button onClick={addItem} disabled={!canAdd} className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-40">
              {loading ? "Salvataggio..." : "Aggiungi alla lista"}
            </button>
          </div>
        </section>

        {/* LISTA (rimane invariata) */}
        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
           {/* ... resto del codice per la lista ... */}
           <h2 className="text-xl font-bold text-slate-900 mb-6">Ultime segnalazioni</h2>
           <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {items.map(item => (
                <article key={item.id} className={`overflow-hidden rounded-3xl border bg-slate-50 ${top3Ids.includes(item.id) ? "border-red-700 ring-4 ring-red-500" : "border-slate-200"}`}>
                   <div className="p-4">
                      <h3 className="font-bold">{item.via}</h3>
                      <p className="text-sm">{item.tratto}</p>
                      <p className="text-xs text-slate-500">{item.zona}</p>
                   </div>
                </article>
              ))}
           </div>
        </section>
      </div>
    </div>
  );
}