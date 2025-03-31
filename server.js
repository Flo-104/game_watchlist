import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import path from "path";
import { fileURLToPath } from "url"; // Import für ES-Module
import userRoutes from "./routes/users.js";
import reviewRoutes from "./routes/review.js";
import gameRoutes from "./routes/games.js";
import watchlistRoutes from "./routes/watchlist.js";

// __dirname für ES-Module definieren
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(bodyParser.json());

// API-Routen
app.use("/users", userRoutes);
app.use("/games", gameRoutes);
app.use("/watchlist", watchlistRoutes);
app.use("/review", reviewRoutes);

// Frontend-Verknüpfung
const frontendPath = path.join(__dirname, "game-watchlist-frontend", "dist");
app.use(express.static(frontendPath));
app.get("*", (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

// Server starten
const PORT = 5000;
app.listen(PORT, () => console.log(`🚀 Server läuft auf Port ${PORT}`));