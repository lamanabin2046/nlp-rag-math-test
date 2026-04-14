const express = require("express");
const router  = express.Router();
const Score   = require("../models/Score");

// POST — save one score
router.post("/", async (req, res) => {
  try {
    const score = new Score(req.body);
    await score.save();
    res.status(201).json({ success: true, score });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// GET — all scores (for analysis / admin)
router.get("/", async (req, res) => {
  try {
    const scores = await Score.find().sort({ createdAt: -1 });
    res.json(scores);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET — export as JSON matching experiment4 format
router.get("/export", async (req, res) => {
  try {
    const scores = await Score.find().lean();
    const formatted = scores.map((s) => ({
      item_id:             s.item_id,
      teacher_rubric:      s.teacher_rubric    ?? null,
      student_clarity:     s.student_clarity   ?? null,
      student_alignment:   s.student_alignment ?? null,
      student_usefulness:  s.student_usefulness?? null,
      evaluator_id:        s.evaluator_id,
      evaluator_role:      s.evaluator_role,
    }));
    res.setHeader("Content-Disposition", "attachment; filename=human_eval_scores.json");
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET — summary stats per item
router.get("/summary", async (req, res) => {
  try {
    const scores = await Score.find().lean();

    const byItem = {};
    for (const s of scores) {
      if (!byItem[s.item_id]) byItem[s.item_id] = { teachers: [], students: [] };
      if (s.evaluator_role === "teacher") byItem[s.item_id].teachers.push(s);
      else                                byItem[s.item_id].students.push(s);
    }

    const avg = (arr) => arr.length ? (arr.reduce((a,b)=>a+b,0)/arr.length).toFixed(2) : null;

    const summary = Object.entries(byItem).map(([item_id, { teachers, students }]) => ({
      item_id:              Number(item_id),
      teacher_count:        teachers.length,
      avg_teacher_rubric:   avg(teachers.map(t=>t.teacher_rubric).filter(v=>v!=null)),
      student_count:        students.length,
      avg_clarity:          avg(students.map(s=>s.student_clarity).filter(v=>v!=null)),
      avg_alignment:        avg(students.map(s=>s.student_alignment).filter(v=>v!=null)),
      avg_usefulness:       avg(students.map(s=>s.student_usefulness).filter(v=>v!=null)),
    }));

    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
