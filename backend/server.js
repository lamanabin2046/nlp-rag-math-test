const express    = require("express");
const mongoose   = require("mongoose");
const cors       = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/scores",    require("./routes/scores"));
app.use("/api/questions", require("./routes/questions"));

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(process.env.PORT || 5000, () =>
      console.log(`Server running on port ${process.env.PORT || 5000}`)
    );

    // Keep MongoDB connection alive
    setInterval(() => {
      mongoose.connection.db.admin().ping().catch(() => {});
    }, 30000);
  })
  .catch((err) => console.error("MongoDB connection error:", err));