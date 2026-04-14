import { useNavigate } from "react-router-dom";

export default function ThankYou() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="text-6xl mb-6">🎉</div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">
          Thank You!
        </h1>
        <p className="text-slate-500 text-sm mb-8">
          Your evaluation has been saved successfully.
          Your responses will help improve AI math tutoring for
          Grade 10 students in Nepal.
        </p>
        <button
          onClick={() => { localStorage.clear(); navigate("/"); }}
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white
                     rounded-xl font-semibold text-sm transition-all"
        >
          Back to Home
        </button>
      </div>
    </div>
  );
}
