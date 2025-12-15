// client/src/components/PlayerSetup.jsx
import { useState } from 'react';

export default function PlayerSetup({ onPlayerSet }) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:3001/api/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() })
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('playerId', data.player.id);
        localStorage.setItem('playerName', data.player.name);
        onPlayerSet(data.player);
      } else {
        setError(data.error || 'Failed to create player');
      }
    } catch (err) {
      setError('Could not connect to server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="player-setup">
      <h2>Welcome to Tic-Tac-Toe!</h2>
      <p>Enter your name to start playing</p>

      {error && <p className="error">{error}</p>}

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Player X name..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={loading}
          className="player-input"
        />
        <button type="submit" disabled={loading} className="btn btn-primary">
          {loading ? 'Saving...' : 'Start Game'}
        </button>
      </form>
    </div>
  );
}