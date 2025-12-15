// client/src/components/Game/Board.jsx
import Cell from "./Cell";

export default function Board({ board, onCellClick, winningCombo }) {
  return (
    <div className="board">
      {board.map((value, index) => (
        <Cell
          value={value}
          position={index}
          key={index}
          onClick={() => onCellClick(index)}
          isWinning={winningCombo?.includes(index)}
        />
      ))}
    </div>
  );
}
