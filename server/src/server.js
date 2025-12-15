// server/src/server.js
import express from "express";
import "dotenv/config";
import { createPlayer, getAllPlayers, getPlayer } from './services/playerService.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get("/", (req, res) => {
  res.status(200).send("Welcome Home!");
});

// NEW: Player routes
app.post("/api/players", (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const player = createPlayer(name.trim());

    if (player.error) {
      return res.status(player.status).json({ error: player.error });
    }

    res.status(201).json({ success: true, player });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/players", (req, res) => {
  const players = getAllPlayers();
  res.json({ success: true, players });
});

app.get("/api/players/:id", (req, res) => {
  const player = getPlayer(req.params.id);

  if (player.error) {
    return res.status(player.status).json({ error: player.error });
  }

  res.json({ success: true, player });
});

// NEW: Update player stats
app.post("/api/players/:id/stats", (req, res) => {
  try {
    const { result } = req.body; // 'win', 'loss', or 'tie'

    if (!result || !['win', 'loss', 'tie'].includes(result)) {
      return res.status(400).json({
        error: 'Result must be "win", "loss", or "tie"'
      });
    }

    const player = updatePlayerStats(req.params.id, result);

    if (player.error) {
      return res.status(player.status).json({ error: player.error });
    }

    res.json({ success: true, player });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// NEW: Get leaderboard
app.get("/api/leaderboard", (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const leaderboard = getLeaderboard(limit);
  res.json({ success: true, leaderboard });
});

// Error handlers (same as before)
app.use((req, res) => {
  res.status(404).send("The page you're looking for does not exist");
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: "Internal Server Error!",
    msg: err.message,
  });
});

app.listen(PORT, () => {
  console.log(`Server is listening on ${PORT}`);
});