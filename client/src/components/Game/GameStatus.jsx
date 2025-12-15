// client/src/components/Game/GameStatus.jsx
export default function GameStatus({ currentPlayer, winner, gameOver }) {
  if (gameOver) {
    if (winner === "DRAW") {
      return (
        <div className="game-status game-over draw">
          <h2>It's a draw</h2>
        </div>
      );
    }
    return (
      <div className={`game-status game-over winner-${winner.toLowerCase()}`}>
        <h2>Player {winner} Wins!</h2>
      </div>
    );
  }
  return (
    <div className={`game-status active player-${currentPlayer.toLowerCase()}`}>
      <h2>Player {currentPlayer}'s Turn</h2>
    </div>
  );
}
