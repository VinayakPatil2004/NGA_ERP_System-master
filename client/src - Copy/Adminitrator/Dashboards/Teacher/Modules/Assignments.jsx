import { useState } from "react";

const Assignments = () => {
  const [title, setTitle] = useState("");
  const [list, setList] = useState([]);

  const add = () => {
    if (!title) return;
    setList([...list, { title }]);
    setTitle("");
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-6">Assignments</h2>

      <div className="bg-white p-6 rounded-2xl shadow mb-6">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border p-2 mb-3"
          placeholder="Assignment Title"
        />
        <button onClick={add} className="bg-blue-600 text-white px-4 py-2 rounded">
          Add
        </button>
      </div>

      {list.map((a, i) => (
        <div key={i} className="bg-gray-100 p-3 rounded mb-2">
          {a.title}
        </div>
      ))}
    </div>
  );
};

export default Assignments;