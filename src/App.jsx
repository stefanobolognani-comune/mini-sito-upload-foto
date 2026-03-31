import { useMemo, useState } from "react";

export default function App() {
  const [categoria, setCategoria] = useState("");
  const [priorita, setPriorita] = useState("");
  const [stato, setStato] = useState("");
  const [titolo, setTitolo] = useState("");
  const [foto, setFoto] = useState(null);
  const [items, setItems] = useState([]);

  const categorie = ["Prodotto", "Macchina", "Segnalazione", "Altro"];
  const prioritaList = ["Bassa", "Media", "Alta", "Urgente"];
  const stati = ["Nuovo", "In verifica", "Approvato", "Chiuso"];

  const canAdd = useMemo(() => {
    return titolo.trim() && categoria && priorita && stato;
  }, [titolo, categoria, priorita, stato]);

  function handlePhotoChange(event) {
    const file = event.target.files?.[0];
    if (!file) {
      setFoto(null);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setFoto({
        name: file.name,
        type: file.type,
        preview: reader.result,
      });
    };
    reader.readAsDataURL(file);
  }

  function addItem() {
    if (!canAdd) return;

    const newItem = {
      id: crypto.randomUUID(),
      titolo: titolo.trim(),
      categoria,
      priorita,
      stato,
      foto,
      createdAt: new Date().toLocaleString("it-IT"),
    };

    setItems((prev) => [newItem, ...prev]);
    setTitolo("");
    setCategoria("");
    setPriorita("");
    setStato("");
    setFoto(null);

    const fileInput = document.getElementById("foto-upload");
    if (fileInput) fileInput.value = "";
  }

  function removeItem(id) {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  return (
    <div className="min-h-screen bg-slate-100 p-6 md:p-10">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[420px_1fr]">
        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900">ASSESSORATO URBANISTICA</h1>
            <h1 className="text-2xl font-bold text-slate-900">RAFFAELE DIEGO STEFANO</h1>
            <p className="mt-2 text-sm text-slate-600">
              Compila i campi, carica una foto e aggiungi la scheda alla lista.
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
              <label className="mb-1 block text-sm font-medium text-slate-700">Menu 1: Categoria</label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500"
              >
                <option value="">Seleziona categoria</option>
                {categorie.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Menu 2: Priorità</label>
              <select
                value={priorita}
                onChange={(e) => setPriorita(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500"
              >
                <option value="">Seleziona priorità</option>
                {prioritaList.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Menu 3: Stato</label>
              <select
                value={stato}
                onChange={(e) => setStato(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500"
              >
                <option value="">Seleziona stato</option>
                {stati.map((item) => (
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

            {foto?.preview && (
              <div className="overflow-hidden rounded-2xl border border-slate-200">
                <img src={foto.preview} alt="Anteprima upload" className="h-56 w-full object-cover" />
                <div className="border-t border-slate-200 px-4 py-3 text-sm text-slate-600">{foto.name}</div>
              </div>
            )}

            <button
              onClick={addItem}
              disabled={!canAdd}
              className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Aggiungi alla lista
            </button>
          </div>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Lista inserimenti</h2>
              <p className="mt-1 text-sm text-slate-600">Le schede restano solo nella sessione del browser.</p>
            </div>
            <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700">
              Totale: {items.length}
            </div>
          </div>

          {items.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 p-10 text-center text-slate-500">
              Nessun elemento ancora. Compila il form qui a sinistra.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {items.map((item) => (
                <article key={item.id} className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-50">
                  {item.foto?.preview ? (
                    <img src={item.foto.preview} alt={item.titolo} className="h-48 w-full object-cover" />
                  ) : (
                    <div className="flex h-48 items-center justify-center bg-slate-200 text-sm text-slate-500">
                      Nessuna foto
                    </div>
                  )}

                  <div className="space-y-3 p-4">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">{item.titolo}</h3>
                      <p className="mt-1 text-xs text-slate-500">Creato il {item.createdAt}</p>
                    </div>

                    <div className="flex flex-wrap gap-2 text-sm">
                      <span className="rounded-full bg-white px-3 py-1 ring-1 ring-slate-200">{item.categoria}</span>
                      <span className="rounded-full bg-white px-3 py-1 ring-1 ring-slate-200">{item.priorita}</span>
                      <span className="rounded-full bg-white px-3 py-1 ring-1 ring-slate-200">{item.stato}</span>
                    </div>

                    <button
                      onClick={() => removeItem(item.id)}
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                    >
                      Elimina
                    </button>
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
