import { useEffect, useMemo, useState } from "react";
import { supabase } from "./supabaseClient";

export default function App() {
  const [visibilita, setVisibilita] = useState("");
  const [traffico, setTraffico] = useState("");
  const [lunghezza, setLunghezza] = useState("");
  const [larghezza, setLarghezza] = useState("");
  const [grade, setGrade] = useState("");
  const [titolo, setTitolo] = useState("");

  const [fotoFile, setFotoFile] = useState(null);
  const [fotoPreview, setFotoPreview] = useState("");

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const visibilitaList = ["ALTA", "MEDIA", "BASSA"];
  const trafficoList = ["ALTO", "MEDIO", "BASSO"];
  const lunghezzaList = ["CORTA", "MEDIA", "LUNGA"];
  const larghezzaList = ["STRETTA", "MEDIA", "LARGA"];
  const gradeList = ["Nuova", "Buona", "Discreta", "Scadente", "Pessima", "Critica"];

  const canAdd = useMemo(() => {
    return titolo.trim() && visibilita && traffico && lunghezza && larghezza && grade && !loading;
  }, [titolo, visibilita, traffico, lunghezza, larghezza, grade, loading]);

  useEffect(() => {
    loadItems();
  }, []);

  async function loadItems() {
    setLoadingList(true);
    setErrorMessage("");

    const { data, error } = await supabase
      .from("segnalazioni")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setErrorMessage("Errore nel caricamento dei dati.");
      setLoadingList(false);
      return;
    }

    setItems(data || []);
    setLoadingList(false);
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

  async function addItem() {
    if (!canAdd) return;

    setLoading(true);
    setErrorMessage("");

    try {
      let imageUrl = null;

      if (fotoFile) {
        imageUrl = await uploadPhoto();
      }

      const payload = {
        titolo: titolo.trim(),
        visibilita,
        traffico,
        lunghezza,
        larghezza,
        grade,
        image_url: imageUrl,
      };

      const { data, error } = await supabase
        .from("segnalazioni")
        .insert([payload])
        .select();

      if (error) {
        throw error;
      }

      const savedItem = data?.[0];
      if (savedItem) {
        setItems((prev) => [savedItem, ...prev]);
      }

      setTitolo("");
      setVisibilita("");
      setTraffico("");
      setLunghezza("");
      setLarghezza("");
      setGrade("");
      setFotoFile(null);
      setFotoPreview("");

      const fileInput = document.getElementById("foto-upload");
      if (fileInput) fileInput.value = "";
    } catch (error) {
      console.error(error);
      setErrorMessage("Errore nel salvataggio dei dati o della foto.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 p-6 md:p-10">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[420px_1fr]">
        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900">ASSESSORATO URBANISTICA</h1>
            <h1 className="text-2xl font-bold text-slate-900">RAFFAELE DIEGO STEFANO</h1>
            <p className="mt-2 text-sm text-slate-600">
              Compila i campi, carica una foto e salva la scheda nel database.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Titolo</label>
              <input
                type="text"
                value={titolo}
                onChange={(e) => setTitolo(e.target.value)}
                placeholder="Inserisci la via che stai valutando"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Visibilità</label>
              <select
                value={visibilita}
                onChange={(e) => setVisibilita(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500"
              >
                <option value="">Seleziona visibilità</option>
                {visibilitaList.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Traffico</label>
              <select
                value={traffico}
                onChange={(e) => setTraffico(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500"
              >
                <option value="">Seleziona traffico</option>
                {trafficoList.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Lunghezza</label>
              <select
                value={lunghezza}
                onChange={(e) => setLunghezza(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500"
              >
                <option value="">Seleziona lunghezza</option>
                {lunghezzaList.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Larghezza</label>
              <select
                value={larghezza}
                onChange={(e) => setLarghezza(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500"
              >
                <option value="">Seleziona larghezza</option>
                {larghezzaList.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Grade</label>
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500"
              >
                <option value="">Seleziona grade</option>
                {gradeList.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Upload foto</label>
              <input
                id="foto-upload"
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="block w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700"
              />
            </div>

            {fotoPreview && (
              <div className="overflow-hidden rounded-2xl border border-slate-200">
                <img src={fotoPreview} alt="Anteprima upload" className="h-56 w-full object-cover" />
                <div className="border-t border-slate-200 px-4 py-3 text-sm text-slate-600">
                  {fotoFile?.name}
                </div>
              </div>
            )}

            {errorMessage && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {errorMessage}
              </div>
            )}

            <button
              onClick={addItem}
              disabled={!canAdd}
              className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {loading ? "Salvataggio..." : "Aggiungi alla lista"}
            </button>
          </div>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Lista inserimenti</h2>
              <p className="mt-1 text-sm text-slate-600">
                Dati e immagini letti da Supabase.
              </p>
            </div>
            <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700">
              Totale: {items.length}
            </div>
          </div>

          {loadingList ? (
            <div className="rounded-3xl border border-dashed border-slate-300 p-10 text-center text-slate-500">
              Caricamento dati...
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 p-10 text-center text-slate-500">
              Nessun elemento ancora. Compila il form qui a sinistra.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {items.map((item) => (
                <article key={item.id} className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-50">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.titolo} className="h-48 w-full object-cover" />
                  ) : (
                    <div className="flex h-48 items-center justify-center bg-slate-200 text-sm text-slate-500">
                      Nessuna foto salvata
                    </div>
                  )}

                  <div className="space-y-3 p-4">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">{item.titolo}</h3>
                      <p className="mt-1 text-xs text-slate-500">
                        Creato il {new Date(item.created_at).toLocaleString("it-IT")}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2 text-sm">
                      <span className="rounded-full bg-white px-3 py-1 ring-1 ring-slate-200">
                        Visibilità: {item.visibilita}
                      </span>
                      <span className="rounded-full bg-white px-3 py-1 ring-1 ring-slate-200">
                        Traffico: {item.traffico}
                      </span>
                      <span className="rounded-full bg-white px-3 py-1 ring-1 ring-slate-200">
                        Lunghezza: {item.lunghezza}
                      </span>
                      <span className="rounded-full bg-white px-3 py-1 ring-1 ring-slate-200">
                        Larghezza: {item.larghezza}
                      </span>
                      <span className="rounded-full bg-white px-3 py-1 ring-1 ring-slate-200">
                        Grade: {item.grade}
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}