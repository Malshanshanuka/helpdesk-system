import { useState } from "react";

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
        <h1 className="text-3xl font-bold text-blue-600">HelpDesk</h1>
        <p className="mt-2 text-slate-600">React and Tailwind are working</p>

        <button
          onClick={() => setCount(count + 1)}
          className="mt-6 rounded-lg bg-blue-600 px-5 py-2 text-white hover:bg-blue-700"
        >
          Clicked {count} times
        </button>
      </div>
    </div>
  );
}

export default App;