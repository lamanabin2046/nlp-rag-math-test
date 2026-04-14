import { useEffect, useState } from "react";
import { useNavigate }          from "react-router-dom";
import axios                    from "axios";
import ProgressBar              from "../components/ProgressBar";
import MathRenderer             from "../components/MathRenderer";

const RUBRIC = [
  { value: 0, label: "Incorrect",         desc: "Wrong approach or fundamental error",   color: "border-red-400 bg-red-50 text-red-700"            },
  { value: 1, label: "Partially Correct", desc: "Right approach but significant errors", color: "border-amber-400 bg-amber-50 text-amber-700"      },
  { value: 2, label: "Correct",           desc: "Right answer, steps could be clearer",  color: "border-blue-400 bg-blue-50 text-blue-700"         },
  { value: 3, label: "Fully Detailed",    desc: "All steps shown, exam-ready",            color: "border-emerald-400 bg-emerald-50 text-emerald-700" },
];

export default function TeacherEval() {
  const [pairs,     setPairs]     = useState([]);
  const [index,     setIndex]     = useState(0);
  const [ragScore,  setRagScore]  = useState(null);
  const [baseScore, setBaseScore] = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState("");
  const navigate = useNavigate();

  const evaluatorId = localStorage.getItem("evaluator_id") || "T_unknown";

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

  const handleNext = async () => {
    if (ragScore === null || baseScore === null) return;
    setSaving(true);
    try {
      await Promise.all([
        axios.post("/api/scores", {
          item_id: rag.item_id, test_id: rag.test_id,
          question: rag.question, chapter_type: rag.chapter_type,
          difficulty: rag.difficulty, setting: "RAG",
          evaluator_id: evaluatorId, evaluator_role: "teacher",
          teacher_rubric: ragScore,
        }),
        axios.post("/api/scores", {
          item_id: base.item_id, test_id: base.test_id,
          question: base.question, chapter_type: base.chapter_type,
          difficulty: base.difficulty, setting: "Baseline",
          evaluator_id: evaluatorId, evaluator_role: "teacher",
          teacher_rubric: baseScore,
        }),
      ]);
      setRagScore(null);
      setBaseScore(null);
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
            <h1 className="text-lg font-bold text-slate-800">Teacher Evaluation</h1>
            <p className="text-xs text-slate-400">Evaluator: {evaluatorId}</p>
          </div>
          <div className="flex gap-2">
            <Badge label={rag.chapter_type} color="indigo" />
            <Badge label={rag.difficulty}
              color={rag.difficulty==="hard"?"red":rag.difficulty==="medium"?"amber":"emerald"} />
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
              score: ragScore,  setScore: setRagScore,
              border: "border-indigo-200", badge: "bg-indigo-100 text-indigo-700" },
            { item: base, label: "Solution B", sublabel: "AI without textbook reference",
              score: baseScore, setScore: setBaseScore,
              border: "border-slate-200",  badge: "bg-slate-200 text-slate-600" },
          ].map(({ item, label, sublabel, score, setScore, border, badge }) => (
            <div key={label}
              className={`bg-white border-2 ${border} rounded-2xl shadow-sm flex flex-col`}>

              {/* Card header */}
              <div className="flex items-center gap-2 px-5 pt-4 pb-3 border-b border-slate-100">
                <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${badge}`}>{label}</span>
                <span className="text-xs text-slate-400">{sublabel}</span>
              </div>

              {/* Solution — large scrollable area */}
              <div className="overflow-y-auto px-5 py-4"
                style={{ minHeight: "380px", maxHeight: "480px" }}>
                <MathRenderer text={item.response || "No response generated."} />
              </div>

              {/* Grading section — pinned at bottom, same height on both cards */}
              <div className="px-5 pb-5 pt-4 border-t border-slate-100 mt-auto">
                <p className="text-xs font-semibold text-slate-600 mb-2">Grade {label}:</p>
                <div className="grid grid-cols-2 gap-2">
                  {RUBRIC.map((r) => (
                    <button key={r.value} onClick={() => setScore(r.value)}
                      className={`border-2 rounded-xl p-2.5 text-left transition-all
                        ${score === r.value
                          ? r.color + " ring-2 ring-offset-1 ring-indigo-300"
                          : "border-slate-200 bg-white hover:border-slate-300"}`}>
                      <div className="font-bold text-sm">{r.value} — {r.label}</div>
                      <div className="text-xs opacity-70 mt-0.5">{r.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

            </div>
          ))}
        </div>

        {(ragScore === null || baseScore === null) && (
          <p className="text-amber-600 text-xs mb-3">
            Please grade both Solution A and Solution B to continue.
          </p>
        )}
        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

        <button onClick={handleNext}
          disabled={ragScore === null || baseScore === null || saving}
          className="w-full py-3 rounded-xl font-semibold text-white transition-all
            bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed">
          {saving ? "Saving…" : index + 1 < pairs.length ? "Next Question →" : "Submit All"}
        </button>

      </div>
    </div>
  );
}

function Badge({ label, color }) {
  const colors = {
    indigo:  "bg-indigo-100 text-indigo-700",
    red:     "bg-red-100 text-red-700",
    amber:   "bg-amber-100 text-amber-700",
    emerald: "bg-emerald-100 text-emerald-700",
  };
  return (
    <span className={`text-xs px-3 py-1 rounded-full font-medium capitalize ${colors[color] || colors.indigo}`}>
      {label}
    </span>
  );
}

function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
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
