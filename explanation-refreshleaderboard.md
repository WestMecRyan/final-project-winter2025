
---

## **Solution 1: Lift Leaderboard State to Parent (Recommended)**

Move the leaderboard fetching logic to a **parent component** that contains both `Game` and `Leaderboard`, then trigger a refresh when the game ends.

### **Create a new parent component:**

**Create: `client/src/components/GamePage.jsx`**

```jsx
// client/src/components/GamePage.jsx
import { useState, useEffect } from 'react';
import Game from './Game/Game';
import Leaderboard from './Leaderboard';

export default function GamePage() {
  const [refreshLeaderboard, setRefreshLeaderboard] = useState(0);

  const handleGameEnd = () => {
    // Increment to trigger leaderboard refresh
    setRefreshLeaderboard(prev => prev + 1);
  };

  return (
    <div className="game-page">
      <Game onGameEnd={handleGameEnd} />
      <Leaderboard key={refreshLeaderboard} />
    </div>
  );
}
```

### **Update Game.jsx to call the callback:**

```jsx
// client/src/components/Game/Game.jsx
export default function Game({ onGameEnd }) { // ✅ Add prop
  // ... existing state

  useEffect(() => {
    if (!gameOver || !player || hasUpdatedStatsRef.current) {
      return;
    }

    const updateStats = async () => {
      hasUpdatedStatsRef.current = true;

      try {
        let result;
        if (winner === "DRAW") {
          result = "tie";
        } else if (winner === "X") {
          result = "win";
        } else {
          result = "loss";
        }

        const response = await fetch(
          `http://localhost:3000/api/players/${player.id}/stats`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ result }),
          },
        );

        if (response.ok) {
          const data = await response.json();
          setPlayer(data.player);
          console.log("Stats updated:", data.player);

          // ✅ Notify parent that game ended and stats updated
          if (onGameEnd) {
            onGameEnd();
          }
        }
      } catch (error) {
        console.error("Failed to update stats:", error);
        hasUpdatedStatsRef.current = false;
      }
    };

    updateStats();
  }, [gameOver, winner, player, onGameEnd]); // ✅ Add onGameEnd to deps

  // ... rest of component
}
```

### **Update your App.jsx to use GamePage:**

```jsx
// client/src/App.jsx
import GamePage from './components/GamePage';

function App() {
  return (
    <div className="app">
      <GamePage />
    </div>
  );
}

export default App;
```

**How it works:**
1. When game ends and stats are updated, `Game` calls `onGameEnd()`
2. `GamePage` increments `refreshLeaderboard`
3. React sees `key` prop changed on `Leaderboard`
4. React remounts `Leaderboard`, triggering fresh `useEffect` and new fetch

---

## **Solution 2: Pass fetchLeaderboard as Prop (Simpler)**

Pass the `fetchLeaderboard` function from `Leaderboard` up through props.

### **Update Leaderboard to expose refresh function:**

```jsx
// client/src/components/Leaderboard.jsx
import { useState, useEffect, useImperativeHandle, forwardRef } from "react";

const Leaderboard = forwardRef((props, ref) => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        "http://localhost:3000/api/leaderboard?limit=10",
      );
      const data = await response.json();

      if (data.success) {
        setLeaderboard(data.leaderboard);
      } else {
        setError("Failed to load leaderboard");
      }
    } catch (error) {
      setError("Could not connect to server");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Expose refresh function to parent
  useImperativeHandle(ref, () => ({
    refresh: fetchLeaderboard
  }));

  // ... rest of component (same as before)

  if (loading) {
    return <div className="leaderboard loading">Loading leaderboard...</div>;
  }

  if (error) {
    return <div className="leaderboard error">{error}</div>;
  }

  return (
    <div className="leaderboard">
      <h2>Leaderboard</h2>
      {leaderboard.length === 0 ? (
        <p>No players yet. Be the first to play!</p>
      ) : (
        <table className="leaderboard-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Player</th>
              <th>Wins</th>
              <th>Losses</th>
              <th>Ties</th>
              <th>Total</th>
              <th>Win Rate</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((player, index) => (
              <tr key={player.id}>
                <td className="rank">{index + 1}</td>
                <td className="player-name">{player.name}</td>
                <td className="wins">{player.wins}</td>
                <td className="losses">{player.losses}</td>
                <td className="ties">{player.ties}</td>
                <td className="total">{player.totalGames}</td>
                <td className="win-rate">{player.winRate}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
});

export default Leaderboard;
```

### **Update GamePage to use ref:**

```jsx
// client/src/components/GamePage.jsx
import { useRef } from 'react';
import Game from './Game/Game';
import Leaderboard from './Leaderboard';

export default function GamePage() {
  const leaderboardRef = useRef();

  const handleGameEnd = () => {
    // Call the refresh method on Leaderboard
    leaderboardRef.current?.refresh();
  };

  return (
    <div className="game-page">
      <Game onGameEnd={handleGameEnd} />
      <Leaderboard ref={leaderboardRef} />
    </div>
  );
}
```

---

## **Solution 3: Custom Event (Advanced, but Clean)**

Use a custom event bus to broadcast game end events.

### **Create an event emitter:**

**Create: `client/src/utils/events.js`**

```javascript
// client/src/utils/events.js
class EventEmitter {
  constructor() {
    this.events = {};
  }

  on(event, callback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  }

  off(event, callback) {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter(cb => cb !== callback);
  }

  emit(event, data) {
    if (!this.events[event]) return;
    this.events[event].forEach(callback => callback(data));
  }
}

export const gameEvents = new EventEmitter();
```

### **Update Game.jsx to emit event:**

```jsx
// client/src/components/Game/Game.jsx
import { gameEvents } from '../../utils/events';

export default function Game() {
  // ... existing code

  useEffect(() => {
    if (!gameOver || !player || hasUpdatedStatsRef.current) {
      return;
    }

    const updateStats = async () => {
      hasUpdatedStatsRef.current = true;

      try {
        // ... existing stats update code

        if (response.ok) {
          const data = await response.json();
          setPlayer(data.player);
          console.log("Stats updated:", data.player);

          // ✅ Emit game end event
          gameEvents.emit('gameEnded', { winner, player: data.player });
        }
      } catch (error) {
        console.error("Failed to update stats:", error);
        hasUpdatedStatsRef.current = false;
      }
    };

    updateStats();
  }, [gameOver, winner, player]);

  // ... rest of component
}
```

### **Update Leaderboard to listen for event:**

```jsx
// client/src/components/Leaderboard.jsx
import { useState, useEffect } from "react";
import { gameEvents } from '../utils/events';

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchLeaderboard();

    // ✅ Listen for game end events
    const handleGameEnd = () => {
      console.log('Game ended, refreshing leaderboard...');
      fetchLeaderboard();
    };

    gameEvents.on('gameEnded', handleGameEnd);

    // Cleanup listener on unmount
    return () => {
      gameEvents.off('gameEnded', handleGameEnd);
    };
  }, []);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        "http://localhost:3000/api/leaderboard?limit=10",
      );
      const data = await response.json();

      if (data.success) {
        setLeaderboard(data.leaderboard);
      } else {
        setError("Failed to load leaderboard");
      }
    } catch (error) {
      setError("Could not connect to server");
    } finally {
      setLoading(false);
    }
  };

  // ... rest of component (same as before)
}
```

---

## **Solution 4: Context API (Most React-y)**

Use React Context to share game state globally.

**Create: `client/src/context/GameContext.jsx`**

```jsx
import { createContext, useContext, useState } from 'react';

const GameContext = createContext();

export function GameProvider({ children }) {
  const [gameEndedCounter, setGameEndedCounter] = useState(0);

  const notifyGameEnded = () => {
    setGameEndedCounter(prev => prev + 1);
  };

  return (
    <GameContext.Provider value={{ gameEndedCounter, notifyGameEnded }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGameContext() {
  return useContext(GameContext);
}
```

**Update App.jsx:**

```jsx
import { GameProvider } from './context/GameContext';
import GamePage from './components/GamePage';

function App() {
  return (
    <GameProvider>
      <div className="app">
        <GamePage />
      </div>
    </GameProvider>
  );
}

export default App;
```

**Update Game.jsx:**

```jsx
import { useGameContext } from '../../context/GameContext';

export default function Game() {
  const { notifyGameEnded } = useGameContext();

  useEffect(() => {
    // ... stats update code

    if (response.ok) {
      const data = await response.json();
      setPlayer(data.player);

      // ✅ Notify context
      notifyGameEnded();
    }
  }, [gameOver, winner, player]);
}
```

**Update Leaderboard.jsx:**

```jsx
import { useGameContext } from '../context/GameContext';

export default function Leaderboard() {
  const { gameEndedCounter } = useGameContext();

  useEffect(() => {
    fetchLeaderboard();
  }, [gameEndedCounter]); // ✅ Re-fetch when counter changes

  // ... rest of component
}
```

---

## **Comparison & Recommendation**

| Solution | Complexity | Best For | Pros | Cons |
|----------|-----------|----------|------|------|
| **1. Key Prop** | ⭐ Easy | **Teaching** | Simple, works instantly | Remounts component |
| **2. Ref/forwardRef** | ⭐⭐ Medium | Production | No remount, direct control | Requires ref knowledge |
| **3. Event Emitter** | ⭐⭐⭐ Medium-Hard | Decoupled systems | Very flexible | Not "React way" |
| **4. Context API** | ⭐⭐ Medium | Global state needs | Most React-idiomatic | Overkill for this |

---

## **My Recommendation for Your Students: Solution 1 (Key Prop)**

**Why:**
- ✅ Easiest to understand
- ✅ Only 3 small changes needed
- ✅ Teaches component composition
- ✅ Works immediately with minimal debugging

**The 3 changes:**

1. **Create GamePage.jsx** (parent wrapper)
2. **Add `onGameEnd` prop to Game.jsx** (call it after stats update)
3. **Use `key={refreshLeaderboard}` on Leaderboard** (forces refresh)

