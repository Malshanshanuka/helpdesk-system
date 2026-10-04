import path from "path";
import { fileURLToPath } from "url";
import { protect } from "./middleware/authMiddleware.js";
import ticketRoutes from "./routes/ticketRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import "dotenv/config";
import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL }));
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Helpdesk API is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/tickets", ticketRoutes);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.get("/api/files/:filename", protect, (req, res) => {
  const safeName = path.basename(req.params.filename);
  res.sendFile(path.join(__dirname, "uploads", safeName), (err) => {
    if (err) res.status(404).json({ message: "File not found" });
  });
});

 app.use((err, req, res, next) => {
  if (err.name === "MulterError" || err.message?.startsWith("Only images")) {
    return res.status(400).json({ message: err.message });
  }
  console.error(err);
  res.status(500).json({ message: "Something went wrong on the server" });
});

const PORT = process.env.PORT || 5001;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});