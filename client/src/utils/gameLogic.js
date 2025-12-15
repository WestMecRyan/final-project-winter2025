// client/src/utils/gameLogic.js
// Pure game logic - works in Node terminal AND React browser

export const WINNING_COMBINATIONS = [
  [0, 1, 2], // top row
  [3, 4, 5], // middle row
  [6, 7, 8], // bottom row
  [0, 3, 6], // left column
  [1, 4, 7], // middle column
  [2, 5, 8], // right column
  [0, 4, 8], // diagonal \
  [2, 4, 6], // diagonal /
];

/**
 * Check if there's a winner or draw
 * @param {Array} board - Array of 9 elements: ["X", "O", null, ...]
 * @returns {Object} { winner: "X"|"O"|"DRAW"|null, winningCombo: [0,1,2]|null }
 */
export function checkForWin(board) {
  // Check all winning combinations
  for (const combo of WINNING_COMBINATIONS) {
    const [a, b, c] = combo;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return {
        winner: board[a],
        winningCombo: combo,
      };
    }
  }

  // Check for draw (board full, no winner)
  if (board.every((cell) => cell !== null)) {
    return { winner: "DRAW", winningCombo: null };
  }

  // Game still active
  return { winner: null, winningCombo: null };
}
/**
 * Validate if a move is legal
 * @param {Array} board
 * @param {number} position - 0-8
 * @returns {Object} { valid: boolean, reason?: string }
 */
export function isValidMove(board, position) {
  if (position < 0 || position > 8) {
    return { valid: false, reason: "Position must be between 0-8" };
  }

  if (board[position] !== null) {
    return { valid: false, reason: "Position already occupied" };
  }

  return { valid: true };
}

/**
 * Apply a move to the board (returns NEW board, immutable)
 * @param {Array} board
 * @param {number} position
 * @param {string} player - "X" or "O"
 * @returns {Array} New board array
 */
export function applyMove(board, position, player) {
  const newBoard = [...board];
  newBoard[position] = player;
  return newBoard;
}

/**
 * Switch player turn
 * @param {string} currentPlayer
 * @returns {string} "X" or "O"
 */
export function switchPlayer(currentPlayer) {
  return currentPlayer === "X" ? "O" : "X";
}

/**
 * Create initial game state
 * @returns {Object}
 */
export function createInitialGameState() {
  return {
    board: Array(9).fill(null),
    currentPlayer: "X",
    gameOver: false,
    winner: null,
    winningCombo: null,
  };
}
