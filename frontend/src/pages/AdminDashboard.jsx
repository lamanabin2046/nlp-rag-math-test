import { useEffect, useState } from "react";
import axios from "axios";

export default function AdminDashboard() {
  const [scores,  setScores]  = useState([]);
  const [summary, setSummary] = useState([]);
  const [tab,     setTab]     = useState("overview");
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  useEffect(() => {
    Promise.all([axios.get("/api/scores"), axios.get("/api/scores/summary")])
      .then(([r, s]) => { setScores(r.data); setSummary(s.data); setLoading(false); })
      .catch(() => { setError("Could not load data."); setLoading(false); });
  }, []);

  const handleDownload = async () => {
    try {
      const res = await axios.get("/api/scores/export", { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a   = document.createElement("a");
      a.href    = url;
      a.download = "human_eval_scores.json";
      a.click();
      window.URL.revokeObjectURL(url);
    } catch { alert("Download failed."); }
  };

  if (loading) return <Spinner />;
  if (error)   return <ErrorMsg msg={error} />;

  const teachers    = scores.filter((s) => s.evaluator_role === "teacher");
  const students    = scores.filter((s) => s.evaluator_role === "student");
  const uniqueEvals = new Set(scores.map((s) => s.evaluator_id)).size;

  const ragTeacher  = avg(teachers.filter((s) => s.setting === "RAG")     .map((s) => s.teacher_rubric));
  const baseTeacher = avg(teachers.filter((s) => s.setting === "Baseline").map((s) => s.teacher_rubric));
  const ragClarity  = avg(students.filter((s) => s.setting === "RAG")     .map((s) => s.student_clarity));
  const baseClarity = avg(students.filter((s) => s.setting === "Baseline").map((s) => s.student_clarity));
  const ragAlign    = avg(students.filter((s) => s.setting === "RAG")     .map((s) => s.student_alignment));
  const ragUseful   = avg(students.filter((s) => s.setting === "RAG")     .map((s) => s.student_usefulness));

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Navbar */}
      <div className="bg-white border-b border-slate-200 px-6 py-4
                      flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center
                          justify-center text-white text-sm font-bold">A</div>
          <div>
            <h1 className="text-base font-bold text-slate-800 leading-tight">Admin Dashboard</h1>
            <p className="text-xs text-slate-400">Experiment 4 — Live Results</p>
          </div>
        </div>
        <button onClick={handleDownload}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700
                     text-white text-sm font-semibold rounded-xl transition-all">
          ↓ Download Scores
        </button>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* Stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Responses" value={scores.length}   color="indigo"  icon="📋" />
          <StatCard label="Evaluators"      value={uniqueEvals}      color="purple"  icon="👥" />
          <StatCard label="Teacher Reviews" value={teachers.length}  color="blue"    icon="👩‍🏫" />
          <StatCard label="Student Reviews" value={students.length}  color="emerald" icon="🎓" />
        </div>

        {/* RAG vs Baseline bars */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-6 shadow-sm">
          <h2 className="text-sm font-bold text-slate-700 mb-4">RAG vs Baseline Comparison</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <CompareBar label="Teacher Rubric (0–3)"  rag={ragTeacher} base={baseTeacher} max={3} />
            <CompareBar label="Student Clarity (1–5)" rag={ragClarity} base={baseClarity} max={5} />
            <CompareBar label="Avg Student Ratings"
              rag={avg([ragClarity, ragAlign, ragUseful])}
              base={avg([
                avg(students.filter(s => s.setting === "Baseline").map(s => s.student_clarity)),
                avg(students.filter(s => s.setting === "Baseline").map(s => s.student_alignment)),
                avg(students.filter(s => s.setting === "Baseline").map(s => s.student_usefulness)),
              ])}
              max={5}
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          {[
            { key: "overview", label: "📊 Overview" },
            { key: "teacher",  label: "👩‍🏫 Teacher"  },
            { key: "student",  label: "🎓 Student"   },
          ].map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all
                ${tab === t.key
                  ? "bg-indigo-600 text-white"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === "overview" && <OverviewTable summary={summary} />}
        {tab === "teacher"  && <CollapsibleEvaluatorList rows={teachers} role="teacher" />}
        {tab === "student"  && <CollapsibleEvaluatorList rows={students} role="student" />}

      </div>
    </div>
  );
}

// ── Collapsible evaluator list ─────────────────────────────────────────
// Groups rows by evaluator_id, each evaluator is a collapsible card
function CollapsibleEvaluatorList({ rows, role }) {
  const [openIds, setOpenIds] = useState({});

  if (!rows.length) return <Empty />;

  // Group by evaluator_id
  const grouped = {};
  for (const r of rows) {
    if (!grouped[r.evaluator_id]) grouped[r.evaluator_id] = [];
    grouped[r.evaluator_id].push(r);
  }

  const toggle = (id) =>
    setOpenIds((prev) => ({ ...prev, [id]: !prev[id] }));

  const expandAll   = () => {
    const all = {};
    Object.keys(grouped).forEach((id) => (all[id] = true));
    setOpenIds(all);
  };
  const collapseAll = () => setOpenIds({});

  return (
    <div>
      {/* Expand / Collapse all buttons */}
      <div className="flex gap-2 mb-3">
        <button onClick={expandAll}
          className="text-xs px-3 py-1.5 bg-white border border-slate-200
                     rounded-lg text-slate-600 hover:bg-slate-50 transition-all">
          Expand All
        </button>
        <button onClick={collapseAll}
          className="text-xs px-3 py-1.5 bg-white border border-slate-200
                     rounded-lg text-slate-600 hover:bg-slate-50 transition-all">
          Collapse All
        </button>
        <span className="text-xs text-slate-400 self-center ml-1">
          {Object.keys(grouped).length} evaluator{Object.keys(grouped).length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="space-y-3">
        {Object.entries(grouped).map(([evalId, evalRows]) => {
          const isOpen = !!openIds[evalId];
          const ragRows  = evalRows.filter((r) => r.setting === "RAG");
          const baseRows = evalRows.filter((r) => r.setting === "Baseline");

          // Quick summary for the collapsed header
          const summary = role === "teacher"
            ? {
                ragAvg:  avg(ragRows.map((r)  => r.teacher_rubric)),
                baseAvg: avg(baseRows.map((r) => r.teacher_rubric)),
                count:   evalRows.length,
              }
            : {
                ragAvg:  avg(ragRows.map((r)  => r.student_clarity)),
                baseAvg: avg(baseRows.map((r) => r.student_clarity)),
                count:   evalRows.length,
              };

          return (
            <div key={evalId}
              className="bg-white border border-slate-200 rounded-2xl
                         shadow-sm overflow-hidden">

              {/* ── Collapsed header (always visible) ── */}
              <button
                onClick={() => toggle(evalId)}
                className="w-full flex items-center justify-between
                           px-5 py-4 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center
                                   text-sm font-bold
                                   ${role === "teacher"
                                     ? "bg-indigo-100 text-indigo-700"
                                     : "bg-emerald-100 text-emerald-700"}`}>
                    {evalId.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-slate-800">{evalId}</p>
                    <p className="text-xs text-slate-400 capitalize">{role} · {summary.count} responses</p>
                  </div>
                </div>

                {/* Quick stats in header */}
                <div className="flex items-center gap-4">
                  <div className="hidden sm:flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-indigo-400 inline-block" />
                      <span className="text-slate-500">RAG:</span>
                      <span className="font-semibold text-slate-700">{summary.ragAvg ?? "—"}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-slate-400 inline-block" />
                      <span className="text-slate-500">Base:</span>
                      <span className="font-semibold text-slate-700">{summary.baseAvg ?? "—"}</span>
                    </span>
                  </div>
                  {/* Chevron */}
                  <span className={`text-slate-400 text-lg transition-transform duration-200
                                    ${isOpen ? "rotate-180" : "rotate-0"}`}>
                    ▾
                  </span>
                </div>
              </button>

              {/* ── Expanded detail ── */}
              {isOpen && (
                <div className="border-t border-slate-100 px-5 py-4">
                  {role === "teacher"
                    ? <TeacherDetail rows={evalRows} />
                    : <StudentDetail rows={evalRows} />}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Teacher detail rows ────────────────────────────────────────────────
function TeacherDetail({ rows }) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-xs text-slate-400 uppercase">
          <th className="text-left pb-2 pr-4">Item</th>
          <th className="text-left pb-2 pr-4">Chapter</th>
          <th className="text-left pb-2 pr-4">Difficulty</th>
          <th className="text-left pb-2 pr-4">Setting</th>
          <th className="text-left pb-2 pr-4">Rubric</th>
          <th className="text-left pb-2">Time</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {rows.map((r) => (
          <tr key={r._id} className="hover:bg-slate-50">
            <td className="py-2 pr-4 font-mono text-xs text-slate-500">{r.item_id}</td>
            <td className="py-2 pr-4 capitalize text-xs text-slate-600">{r.chapter_type}</td>
            <td className="py-2 pr-4"><DiffBadge diff={r.difficulty} /></td>
            <td className="py-2 pr-4"><SettingBadge setting={r.setting} /></td>
            <td className="py-2 pr-4"><RubricBadge value={r.teacher_rubric} /></td>
            <td className="py-2 text-xs text-slate-400">{formatTime(r.createdAt)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ── Student detail rows ────────────────────────────────────────────────
function StudentDetail({ rows }) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-xs text-slate-400 uppercase">
          <th className="text-left pb-2 pr-4">Item</th>
          <th className="text-left pb-2 pr-4">Chapter</th>
          <th className="text-left pb-2 pr-4">Setting</th>
          <th className="text-left pb-2 pr-4">Clarity</th>
          <th className="text-left pb-2 pr-4">Alignment</th>
          <th className="text-left pb-2 pr-4">Usefulness</th>
          <th className="text-left pb-2">Time</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {rows.map((r) => (
          <tr key={r._id} className="hover:bg-slate-50">
            <td className="py-2 pr-4 font-mono text-xs text-slate-500">{r.item_id}</td>
            <td className="py-2 pr-4 capitalize text-xs text-slate-600">{r.chapter_type}</td>
            <td className="py-2 pr-4"><SettingBadge setting={r.setting} /></td>
            <td className="py-2 pr-4"><Stars value={r.student_clarity} /></td>
            <td className="py-2 pr-4"><Stars value={r.student_alignment} /></td>
            <td className="py-2 pr-4"><Stars value={r.student_usefulness} /></td>
            <td className="py-2 text-xs text-slate-400">{formatTime(r.createdAt)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ── Overview table ─────────────────────────────────────────────────────
function OverviewTable({ summary }) {
  if (!summary.length) return <Empty />;
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      <table className="w-full text-sm table-fixed">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            {["Item", "Chapter", "Setting", "Teachers", "Avg Rubric",
              "Students", "Clarity", "Alignment", "Usefulness"].map((h) => (
              <th key={h} className="px-3 py-3 text-left text-xs font-semibold
                                     text-slate-500 uppercase tracking-wide">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {summary.map((row, i) => (
            <tr key={row.item_id} className={i % 2 === 0 ? "bg-white" : "bg-slate-50/60"}>
              <td className="px-3 py-3 font-mono text-xs text-slate-500">{row.item_id}</td>
              <td className="px-3 py-3 capitalize text-xs text-slate-600">{row.chapter_type || "—"}</td>
              <td className="px-3 py-3"><SettingBadge setting={row.setting} /></td>
              <td className="px-3 py-3 text-center text-xs text-slate-600">{row.teacher_count}</td>
              <td className="px-3 py-3 text-center"><ScorePill value={row.avg_teacher_rubric} max={3} /></td>
              <td className="px-3 py-3 text-center text-xs text-slate-600">{row.student_count}</td>
              <td className="px-3 py-3 text-center"><ScorePill value={row.avg_clarity}    max={5} /></td>
              <td className="px-3 py-3 text-center"><ScorePill value={row.avg_alignment}  max={5} /></td>
              <td className="px-3 py-3 text-center"><ScorePill value={row.avg_usefulness} max={5} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Small reusable components ──────────────────────────────────────────

function StatCard({ label, value, color, icon }) {
  const colors = {
    indigo:  "bg-indigo-50  text-indigo-700",
    purple:  "bg-purple-50  text-purple-700",
    blue:    "bg-blue-50    text-blue-700",
    emerald: "bg-emerald-50 text-emerald-700",
  };
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-slate-500 font-medium">{label}</p>
        <span className="text-xl">{icon}</span>
      </div>
      <p className={`text-3xl font-bold rounded-lg px-2 py-0.5 inline-block ${colors[color]}`}>
        {value ?? 0}
      </p>
    </div>
  );
}

function CompareBar({ label, rag, base, max }) {
  const ragPct  = rag  ? Math.round((parseFloat(rag)  / max) * 100) : 0;
  const basePct = base ? Math.round((parseFloat(base) / max) * 100) : 0;
  const ragWins = rag && base && parseFloat(rag) > parseFloat(base);
  return (
    <div className="bg-slate-50 rounded-xl p-4">
      <p className="text-xs font-semibold text-slate-600 mb-3">{label}</p>
      <div className="space-y-2">
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-indigo-600 font-medium">Solution A (RAG)</span>
            <span className={`font-bold ${ragWins ? "text-indigo-700" : "text-slate-500"}`}>
              {rag ?? "—"}{ragWins ? " ▲" : ""}
            </span>
          </div>
          <div className="h-2.5 bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 rounded-full transition-all duration-500"
              style={{ width: `${ragPct}%` }} />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-500 font-medium">Solution B (Baseline)</span>
            <span className={`font-bold ${!ragWins && base ? "text-slate-700" : "text-slate-400"}`}>
              {base ?? "—"}{!ragWins && rag && base ? " ▲" : ""}
            </span>
          </div>
          <div className="h-2.5 bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full bg-slate-400 rounded-full transition-all duration-500"
              style={{ width: `${basePct}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingBadge({ setting }) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium
      ${setting === "RAG"
        ? "bg-indigo-100 text-indigo-700"
        : "bg-slate-200 text-slate-600"}`}>
      {setting === "RAG" ? "RAG" : "Baseline"}
    </span>
  );
}

function DiffBadge({ diff }) {
  const map = {
    easy:   "bg-emerald-100 text-emerald-700",
    medium: "bg-amber-100 text-amber-700",
    hard:   "bg-red-100 text-red-700",
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize
      ${map[diff] || "bg-slate-100 text-slate-500"}`}>{diff}</span>
  );
}

function RubricBadge({ value }) {
  const map    = { 0: "bg-red-100 text-red-700", 1: "bg-amber-100 text-amber-700",
                   2: "bg-blue-100 text-blue-700", 3: "bg-emerald-100 text-emerald-700" };
  const labels = { 0: "Incorrect", 1: "Partial", 2: "Correct", 3: "Detailed" };
  if (value == null) return <span className="text-slate-300 text-xs">—</span>;
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium
      ${map[value] || "bg-slate-100 text-slate-500"}`}>
      {value} — {labels[value]}
    </span>
  );
}

function ScorePill({ value, max }) {
  if (!value) return <span className="text-slate-300 text-xs">—</span>;
  const n = parseFloat(value), pct = n / max;
  const color = pct >= 0.8 ? "text-emerald-600" : pct >= 0.6 ? "text-blue-600" : "text-amber-600";
  return <span className={`font-bold text-sm ${color}`}>{value}</span>;
}

function Stars({ value }) {
  if (!value) return <span className="text-slate-300 text-xs">—</span>;
  return (
    <span className="text-sm">
      <span className="text-amber-400">{"★".repeat(value)}</span>
      <span className="text-slate-200">{"★".repeat(5 - value)}</span>
    </span>
  );
}

function Empty() {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
      <p className="text-slate-400 text-sm">No data yet.</p>
    </div>
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

// ── Helpers ────────────────────────────────────────────────────────────
function avg(arr) {
  const valid = (arr || []).filter((v) => v != null && !isNaN(v));
  if (!valid.length) return null;
  return (valid.reduce((a, b) => a + Number(b), 0) / valid.length).toFixed(2);
}

function formatTime(ts) {
  if (!ts) return "—";
  const d = new Date(ts);
  return d.toLocaleDateString() + " " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
