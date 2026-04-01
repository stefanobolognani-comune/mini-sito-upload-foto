import { useEffect, useMemo, useState } from "react";
import { supabase } from "./supabaseClient";

export default function App() {
  const [zona, setZona] = useState("");
  const [via, setVia] = useState("");

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

  const visibilitaList = ["ALTA", "MEDIA", "BASSA"];
  const trafficoList = ["ALTO", "MEDIO", "BASSO"];
  const lunghezzaList = ["CORTA", "MEDIA", "LUNGA"];
  const larghezzaList = ["STRETTA", "MEDIA", "LARGA"];
  const gradeList = ["Nuova", "Buona", "Discreta", "Scadente", "Pessima", "Critica"];

  const zoneList = useMemo(() => {
    return [...new Set(zoneVie.map((i) => i.zona))];
  }, [zoneVie]);

  const vieFiltrate = useMemo(() => {
    return zoneVie
      .filter((i) => i.zona === zona)
      .map((i) => i.via);
  }, [zoneVie, zona]);

  useEffect(() => {
    loadItems();
    loadZoneVie();
  }, []);

  async function loadItems() {
    const { data } = await supabase
      .from("segnalazioni")
      .select("*")
      .order("created_at", { ascending: false });

    setItems(data || []);
    setLoadingList(false);
  }

  async function loadZoneVie() {
    const { data } = await supabase
      .from("zone_vie")
      .select("*");

    setZoneVie(data || []);
    setLoadingZoneVie(false);
  }

  function handlePhotoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setFotoFile(file);

    const reader = new FileReader();
    reader.onload = () => setFotoPreview(reader.result);
    reader.readAsDataURL(file);
  }

  async function uploadPhoto() {
    if (!fotoFile) return null;

    const fileName = `${crypto.randomUUID()}.jpg`;

    await supabase.storage
      .from("foto-segnalazioni")
      .upload(fileName, fotoFile);

    const { data } = supabase.storage
      .from("foto-segnalazioni")
      .getPublicUrl(fileName);

    return data.publicUrl;
  }

  function getNumericScores() {
    return {
      score_visibilita: { ALTA: 1, MEDIA: 2, BASSA: 3 }[visibilita],
      score_traffico: { BASSO: 1, MEDIO: 2, ALTO: 3 }[traffico],
      score_lunghezza: { CORTA: 1, MEDIA: 2, LUNGA: 3 }[lunghezza],
      score_larghezza: { LARGA: 1, MEDIA: 2, STRETTA: 3 }[larghezza],
      score_grade: {
        Nuova: 1,
        Buona: 2,
        Discreta: 3,
        Scadente: 4,
        Pessima: 5,
        Critica: 6,
      }[grade],
    };
  }

  function calculateRating(s) {
    return (
      s.score_visibilita * 0.2 +
      s.score_traffico * 0.2 +
      s.score_lunghezza * 0.15 +
      s.score_larghezza * 0.15 +
      s.score_grade * 0.3
    ).toFixed(2);
  }

  async function addItem() {
    setLoading(true);

    const imageUrl = await uploadPhoto();
    const scores = getNumericScores();
    const rating = calculateRating(scores);

    await supabase.from("segnalazioni").insert([
      {
        zona,
        via,
        visibilita,
        traffico,
        lunghezza,
        larghezza,
        grade,
        note,
        image_url: imageUrl,
        ...scores,
        rating_totale: rating,
      },
    ]);

    setZona("");
    setVia("");
    setVisibilita("");
    setTraffico("");
    setLunghezza("");
    setLarghezza("");
    setGrade("");
    setNote("");
    setFotoFile(null);
    setFotoPreview("");

    loadItems();
    setLoading(false);
  }

  return (
    <div className="p-6">
      <div className="grid lg:grid-cols-2 gap-6">

        {/* FORM */}
        <div className="bg-white p-6 rounded-3xl shadow">
          <h2 className="text-xl font-bold mb-4">Inserimento</h2>

          <select value={zona} onChange={(e) => setZona(e.target.value)}>
            <option>Zona</option>
            {zoneList.map((z) => (
              <option key={z}>{z}</option>
            ))}
          </select>

          <select value={via} onChange={(e) => setVia(e.target.value)}>
            <option>Via</option>
            {vieFiltrate.map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>

          <select value={visibilita} onChange={(e) => setVisibilita(e.target.value)}>
            <option>Visibilità</option>
            {visibilitaList.map((v) => <option key={v}>{v}</option>)}
          </select>

          <select value={traffico} onChange={(e) => setTraffico(e.target.value)}>
            <option>Traffico</option>
            {trafficoList.map((v) => <option key={v}>{v}</option>)}
          </select>

          <select value={lunghezza} onChange={(e) => setLunghezza(e.target.value)}>
            <option>Lunghezza</option>
            {lunghezzaList.map((v) => <option key={v}>{v}</option>)}
          </select>

          <select value={larghezza} onChange={(e) => setLarghezza(e.target.value)}>
            <option>Larghezza</option>
            {larghezzaList.map((v) => <option key={v}>{v}</option>)}
          </select>

          <select value={grade} onChange={(e) => setGrade(e.target.value)}>
            <option>Grade</option>
            {gradeList.map((v) => <option key={v}>{v}</option>)}
          </select>

          {/* 🔥 NUOVO CAMPO NOTE */}
          <textarea
            placeholder="Note..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full mt-3 p-3 border rounded-xl"
          />

          <input type="file" onChange={handlePhotoChange} />

          <button
            onClick={addItem}
            className="mt-4 bg-black text-white px-4 py-2 rounded-xl"
          >
            Salva
          </button>
        </div>

        {/* LISTA */}
        <div>
          {items.map((item) => (
            <div key={item.id} className="bg-white p-4 rounded-xl mb-4">
              <h3 className="font-bold">{item.via}</h3>
              <p>{item.zona}</p>

              {/* 🔥 NOTE VISUALIZZATE */}
              {item.note && (
                <div className="mt-2 text-sm text-slate-600">
                  📝 {item.note}
                </div>
              )}

              <div className="font-bold mt-2">
                Rating: {item.rating_totale || "-"}
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}