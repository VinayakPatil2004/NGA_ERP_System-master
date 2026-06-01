import { useState } from "react";

const Announcements = () => {
  const [text, setText] = useState("");
  const [list, setList] = useState([]);

  const handlePost = () => {
    if (!text) return;
    setList([{ text, date: new Date() }, ...list]);
    setText("");
  };

  return (
    <div className="p-6">

      <h2 className="text-xl font-bold mb-6">Announcements</h2>

      <div className="bg-white p-6 rounded-2xl shadow space-y-3">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full border p-3 rounded"
          placeholder="Write announcement..."
        />
        <button onClick={handlePost} className="bg-blue-600 text-white px-4 py-2 rounded">
          Post
        </button>
      </div>

      <div className="mt-6 space-y-3">
        {list.map((a, i) => (
          <div key={i} className="bg-gray-100 p-3 rounded">
            <p>{a.text}</p>
            <small>{a.date.toLocaleString()}</small>
          </div>
        ))}
      </div>

    </div>
  );
};

export default Announcements;