import { useState, useEffect } from "react";
import Game from "./Game/Game";
import Leaderboard from "./Leaderboard";

export default function GamePage() {
  const [refreshLeaderboard, setRefreshLeaderboard] = useState(0);

  const handleGameEnd = () => {
    setRefreshLeaderboard((prev) => prev + 1);
  };

  return (
    <div className="game-page">
      <div className="main-content">
        <Game onGameEnd={handleGameEnd} />
      </div>
      <aside className="sidebar">
        <Leaderboard key={refreshLeaderboard} />
      </aside>
    </div>
  );
}
