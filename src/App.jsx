import { useState } from "react";

export default function App() {
  const [titolo, setTitolo] = useState("");
  const [visibilita, setVisibilita] = useState("");
  const [traffico, setTraffico] = useState("");
  const [lunghezza, setLunghezza] = useState("");
  const [larghezza, setLarghezza] = useState("");
  const [grade, setGrade] = useState("");
  const [foto, setFoto] = useState(null);
  const [items, setItems] = useState([]);

  const canAdd = titolo && visibilita && traffico && lunghezza && larghezza && grade;

  function handlePhotoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setFoto({ preview: reader.result, name: file.name });
    };
    reader.readAsDataURL(file);
  }

  function addItem() {
    if (!canAdd) return;

    const newItem = {
      id: crypto.randomUUID(),
      titolo,
      visibilita,
      traffico,
      lunghezza,
      larghezza,
      grade,
      foto,
    };

    setItems([newItem, ...items]);
    setTitolo("");
    setVisibilita("");
    setTraffico("");
    setLunghezza("");
    setLarghezza("");
    setGrade("");
    setFoto(null);
  }

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Mini sito</h1>

      <div className="space-y-3 mb-6">
        <input
          placeholder="Titolo"
          value={titolo}
          onChange={(e) => setTitolo(e.target.value)}
          className="border p-2 w-full"
        />

        <select value={visibilita} onChange={(e) => setVisibilita(e.target.value)} className="border p-2 w-full">
          <option value="">Visibilità</option>
          <option>ALTA</option>
          <option>MEDIA</option>
          <option>BASSA</option>
        </select>

        <select value={traffico} onChange={(e) => setTraffico(e.target.value)} className="border p-2 w-full">
          <option value="">Traffico</option>
          <option>ALTO</option>
          <option>MEDIO</option>
          <option>BASSO</option>
        </select>

        <select value={lunghezza} onChange={(e) => setLunghezza(e.target.value)} className="border p-2 w-full">
          <option value="">Lunghezza</option>
          <option>CORTA</option>
          <option>MEDIA</option>
          <option>LUNGA</option>
        </select>

        <select value={larghezza} onChange={(e) => setLarghezza(e.target.value)} className="border p-2 w-full">
          <option value="">Larghezza</option>
          <option>STRETTA</option>
          <option>MEDIA</option>
          <option>LARGA</option>
        </select>

        <select value={grade} onChange={(e) => setGrade(e.target.value)} className="border p-2 w-full">
          <option value="">Grade</option>
          <option>Nuova</option>
          <option>Buona</option>
          <option>Discreta</option>
          <option>Scadente</option>
          <option>Pessima</option>
          <option>Critica</option>
        </select>

        <input type="file" accept="image/*" onChange={handlePhotoChange} />

        <button onClick={addItem} className="bg-black text-white px-4 py-2">
          Aggiungi
        </button>
      </div>

      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.id} className="border p-3">
            <h2 className="font-bold">{item.titolo}</h2>
            <p>{item.visibilita} | {item.traffico}</p>
            <p>{item.lunghezza} | {item.larghezza}</p>
            <p>{item.grade}</p>
            {item.foto && <img src={item.foto.preview} className="w-40 mt-2" />}
          </div>
        ))}
      </div>
    </div>
  );
}
