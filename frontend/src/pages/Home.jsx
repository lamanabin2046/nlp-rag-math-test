import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const [name, setName]   = useState("");
  const [error, setError] = useState("");
  const navigate          = useNavigate();

  const go = (role) => {
    if (!name.trim()) {
      setError("Please enter your name or ID first.");
      return;
    }
    localStorage.setItem("evaluator_id",   name.trim());
    localStorage.setItem("evaluator_role", role);
    navigate(`/${role}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600 text-white text-2xl mb-4">
            📐
          </div>
          <h1 className="text-2xl font-bold text-slate-800">
            Nepal Grade 10 Math AI
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            Human Evaluation — Experiment 4
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Your Name / ID
          </label>
          <input
            type="text"
            placeholder="e.g. Teacher01 or Student05"
            value={name}
            onChange={(e) => { setName(e.target.value); setError(""); }}
            className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm
                       focus:outline-none focus:ring-2 focus:ring-indigo-400 mb-1"
          />
          {error && <p className="text-red-500 text-xs mb-3">{error}</p>}

          <p className="text-sm text-slate-500 mb-5 mt-3">
            Select your role to begin evaluation:
          </p>

          <div className="grid grid-cols-2 gap-3">
            {/* Teacher */}
            <button
              onClick={() => go("teacher")}
              className="flex flex-col items-center gap-2 border-2 border-indigo-200
                         hover:border-indigo-500 hover:bg-indigo-50 rounded-xl p-5
                         transition-all duration-150 group"
            >
              <span className="text-3xl">👩‍🏫</span>
              <span className="font-semibold text-slate-700 group-hover:text-indigo-700">
                Teacher
              </span>
              <span className="text-xs text-slate-400 text-center">
                Grade solutions 0–3
              </span>
            </button>

            {/* Student */}
            <button
              onClick={() => go("student")}
              className="flex flex-col items-center gap-2 border-2 border-emerald-200
                         hover:border-emerald-500 hover:bg-emerald-50 rounded-xl p-5
                         transition-all duration-150 group"
            >
              <span className="text-3xl">🎓</span>
              <span className="font-semibold text-slate-700 group-hover:text-emerald-700">
                Student
              </span>
              <span className="text-xs text-slate-400 text-center">
                Rate clarity & usefulness
              </span>
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          Nepal Mathematics AI Research Project — 2024
        </p>
      </div>
    </div>
  );
}
