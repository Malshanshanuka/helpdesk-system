import "dotenv/config";
import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";

const app = express();


app.use(cors({ origin: process.env.CLIENT_URL }));
app.use(express.json()); 


app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Helpdesk API is running" });
});

const PORT = process.env.PORT || 5001;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});