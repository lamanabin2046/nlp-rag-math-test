const mongoose = require("mongoose");

const ScoreSchema = new mongoose.Schema(
  {
    item_id:             { type: Number, required: true },
    test_id:             { type: Number },
    question:            { type: String },
    chapter_type:        { type: String },
    difficulty:          { type: String },
    setting:             { type: String },   // "RAG" | "Baseline"
    evaluator_id:        { type: String, required: true },
    evaluator_role:      { type: String, enum: ["teacher", "student"], required: true },

    // Teacher fields
    teacher_rubric:      { type: Number, min: 0, max: 3, default: null },

    // Student fields
    student_clarity:     { type: Number, min: 1, max: 5, default: null },
    student_alignment:   { type: Number, min: 1, max: 5, default: null },
    student_usefulness:  { type: Number, min: 1, max: 5, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Score", ScoreSchema);
