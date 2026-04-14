import { useEffect, useState } from "react";
import { useNavigate }          from "react-router-dom";
import axios                    from "axios";
import ProgressBar              from "../components/ProgressBar";
import MathRenderer             from "../components/MathRenderer";

const DIMS = [
  { key: "student_clarity",    label: "Clarity",    desc: "Is the explanation easy to understand?",       icon: "💡" },
  { key: "student_alignment",  label: "Alignment",  desc: "Does it match how you were taught in school?", icon: "📚" },
  { key: "student_usefulness", label: "Usefulness", desc: "Would this help you prepare for the exam?",    icon: "🎯" },
];

const emptyRatings = () => ({
  student_clarity: 0, student_alignment: 0, student_usefulness: 0,
});

function StarRating({ value, onChange }) {
  const [hovered, setHovered] = useState(0);
  const labels = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"];
  return (
    <div className="flex flex-col items-start gap-1">
      <div className="flex gap-0.5">
        {[1,2,3,4,5].map((star) => (
          <button key={star} onClick={() => onChange(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            className="text-2xl transition-transform hover:scale-110 focus:outline-none">
            <span className={(hovered || value) >= star ? "text-amber-400" : "text-slate-300"}>★</span>
          </button>
        ))}
      </div>
      {(hovered || value) > 0 && (
        <span className="text-xs text-slate-500">{labels[hovered || value]}</span>
      )}
    </div>
  );
}

export default function StudentEval() {
  const [pairs,      setPairs]      = useState([]);
  const [index,      setIndex]      = useState(0);
  const [ragRatings, setRagRatings] = useState(emptyRatings());
  const [baseRatings,setBaseRatings]= useState(emptyRatings());
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState("");
  const navigate = useNavigate();

  const evaluatorId = localStorage.getItem("evaluator_id") || "S_unknown";

  useEffect(() => {
    axios.get("/api/questions").then((res) => {
      const grouped = {};
      for (const item of res.data) {
        if (!grouped[item.test_id]) grouped[item.test_id] = {};
        grouped[item.test_id][item.setting] = item;
      }
      setPairs(Object.values(grouped).filter((g) => g.RAG && g.Baseline));
      setLoading(false);
    }).catch(() => { setError("Could not load questions."); setLoading(false); });
  }, []);

  if (loading) return <Spinner />;
  if (error)   return <ErrorMsg msg={error} />;
  if (!pairs.length) return <ErrorMsg msg="No questions found." />;

  const { RAG: rag, Baseline: base } = pairs[index];
  const ragDone  = DIMS.every((d) => ragRatings[d.key]  > 0);
  const baseDone = DIMS.every((d) => baseRatings[d.key] > 0);

  const handleNext = async () => {
    if (!ragDone || !baseDone) return;
    setSaving(true);
    try {
      await Promise.all([
        axios.post("/api/scores", {
          item_id: rag.item_id,  test_id: rag.test_id,
          question: rag.question, chapter_type: rag.chapter_type,
          difficulty: rag.difficulty, setting: "RAG",
          evaluator_id: evaluatorId, evaluator_role: "student",
          ...ragRatings,
        }),
        axios.post("/api/scores", {
          item_id: base.item_id,  test_id: base.test_id,
          question: base.question, chapter_type: base.chapter_type,
          difficulty: base.difficulty, setting: "Baseline",
          evaluator_id: evaluatorId, evaluator_role: "student",
          ...baseRatings,
        }),
      ]);
      setRagRatings(emptyRatings());
      setBaseRatings(emptyRatings());
      if (index + 1 < pairs.length) setIndex(index + 1);
      else navigate("/thankyou");
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-6 px-4">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-1.5 text-sm text-slate-500
                       hover:text-slate-800 transition-colors group"
          >
            <span className="text-lg leading-none group-hover:-translate-x-0.5 transition-transform">←</span>
            <span>Back</span>
          </button>
          <div className="h-4 w-px bg-slate-300" />
          <div className="flex-1">
            <h1 className="text-lg font-bold text-slate-800">Student Evaluation</h1>
            <p className="text-xs text-slate-400">Evaluator: {evaluatorId}</p>
          </div>
          <div className="flex gap-2">
            <span className="text-xs px-3 py-1 rounded-full font-medium capitalize bg-indigo-100 text-indigo-700">
              {rag.chapter_type}
            </span>
            <span className={`text-xs px-3 py-1 rounded-full font-medium capitalize
              ${rag.difficulty==="hard"?"bg-red-100 text-red-700"
              :rag.difficulty==="medium"?"bg-amber-100 text-amber-700"
              :"bg-emerald-100 text-emerald-700"}`}>
              {rag.difficulty}
            </span>
          </div>
        </div>

        <ProgressBar current={index + 1} total={pairs.length} />

        {/* Question */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Question</p>
          <p className="text-slate-800 text-sm leading-relaxed">{rag.question}</p>
        </div>

        {/* Side by side — equal height cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4 items-start">
          {[
            { item: rag,  label: "Solution A", sublabel: "AI with textbook reference",
              ratings: ragRatings,  setRatings: setRagRatings,
              border: "border-emerald-200", badge: "bg-emerald-100 text-emerald-700" },
            { item: base, label: "Solution B", sublabel: "AI without textbook reference",
              ratings: baseRatings, setRatings: setBaseRatings,
              border: "border-slate-200",   badge: "bg-slate-200 text-slate-600" },
          ].map(({ item, label, sublabel, ratings, setRatings, border, badge }) => (
            <div key={label}
              className={`bg-white border-2 ${border} rounded-2xl shadow-sm flex flex-col`}>

              {/* Card header */}
              <div className="flex items-center gap-2 px-5 pt-4 pb-3 border-b border-slate-100">
                <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${badge}`}>{label}</span>
                <span className="text-xs text-slate-400">{sublabel}</span>
              </div>

              {/* Solution — large scrollable area */}
              <div className="overflow-y-auto px-5 py-4"
                style={{ minHeight: "320px", maxHeight: "420px" }}>
                <MathRenderer text={item.response || "No response generated."} />
              </div>

              {/* Star ratings — pinned at bottom */}
              <div className="px-5 pb-5 pt-4 border-t border-slate-100 mt-auto">
                <p className="text-xs font-semibold text-slate-600 mb-3">Rate {label}:</p>
                <div className="space-y-3">
                  {DIMS.map((d) => (
                    <div key={d.key} className="flex items-center justify-between gap-3">
                      {/* Label left */}
                      <div className="flex items-center gap-1.5 min-w-[100px]">
                        <span className="text-base">{d.icon}</span>
                        <div>
                          <p className="text-xs font-semibold text-slate-700 leading-tight">{d.label}</p>
                          <p className="text-xs text-slate-400 leading-tight">{d.desc}</p>
                        </div>
                      </div>
                      {/* Stars right */}
                      <StarRating
                        value={ratings[d.key]}
                        onChange={(v) => setRatings((prev) => ({ ...prev, [d.key]: v }))}
                      />
                    </div>
                  ))}
                </div>
              </div>

            </div>
          ))}
        </div>

        {(!ragDone || !baseDone) && (
          <p className="text-amber-600 text-xs mb-3">
            Please rate all dimensions for both Solution A and Solution B.
          </p>
        )}
        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

        <button onClick={handleNext}
          disabled={!ragDone || !baseDone || saving}
          className="w-full py-3 rounded-xl font-semibold text-white transition-all
            bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed">
          {saving ? "Saving…" : index + 1 < pairs.length ? "Next Question →" : "Submit All"}
        </button>

      </div>
    </div>
  );
}

function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function ErrorMsg({ msg }) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-red-500">{msg}</p>
    </div>
  );
}
