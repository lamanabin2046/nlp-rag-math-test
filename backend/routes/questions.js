const express = require("express");
const router  = express.Router();
const path    = require("path");
const fs      = require("fs");

router.get("/", (req, res) => {
  const filePath = path.join(__dirname, "../data/human_eval_packet.json");
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({
      error: "human_eval_packet.json not found. Place it in backend/data/",
    });
  }
  const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  const safe = data.map((item) => ({
    item_id:      item.item_id,
    test_id:      item.test_id,
    question:     item.question,
    chapter_type: item.chapter_type,
    difficulty:   item.difficulty,
    setting:      item.setting,
    response:     item.response,
    figure_svg:   item.figure_svg || null,
  }));
  res.json(safe);
});

module.exports = router;
