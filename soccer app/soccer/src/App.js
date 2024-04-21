import React, { useState } from "react";

// -----------------------------------------------------------------------------
// 1) Configuration
// -----------------------------------------------------------------------------

// Store your API key in an environment variable (set in .env file):
const API_KEY = process.env.REACT_APP_FOOTBALL_DATA_API_KEY;
const BASE_URL = "https://api.football-data.org/v4";

// The three teams (rows) in our 3×3 grid mapped to known IDs. 
// (IDs may differ in the latest API or plan.)
const TEAM_IDS = {
  "Manchester United": 66,
  "Real Madrid": 86,
  "Bayern Munich": 5
};

// The columns in our 3×3 grid:
const COUNTRIES = ["England", "Spain", "Germany"];

// The rows in our 3×3 grid:
const TEAMS = Object.keys(TEAM_IDS);

// -----------------------------------------------------------------------------
// 2) Helper: Fetch and Filter Players
// -----------------------------------------------------------------------------

async function fetchRandomPlayer(teamName, nationality) {
  const teamId = TEAM_IDS[teamName];
  const url = `${BASE_URL}/teams/${teamId}`;

  try {
    // Make the request with the API key in headers
    const response = await fetch(url, {
      headers: { "X-Auth-Token": API_KEY },
    });
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    // The "squad" property should contain the player list if your plan includes it
    const squad = data.squad || [];

    // Filter by the selected nationality
    const filteredPlayers = squad
      .filter((player) => player.nationality === nationality)
      .map((player) => player.name);

    if (filteredPlayers.length === 0) {
      return null; // no players match
    }
    // Return one name at random
    const randomIndex = Math.floor(Math.random() * filteredPlayers.length);
    return filteredPlayers[randomIndex];
  } catch (err) {
    console.error("Error fetching player:", err.message);
    return null;
  }
}

// -----------------------------------------------------------------------------
// 3) The Main Game Component
// -----------------------------------------------------------------------------

export default function SoccerGame() {
  // States for the game
  const [chosenTeam, setChosenTeam] = useState("");
  const [chosenCountry, setChosenCountry] = useState("");
  const [randomPlayer, setRandomPlayer] = useState(null);

  const [guess, setGuess] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [gameMessage, setGameMessage] = useState("");
  
  // ---------------------------------------------------------------------------
  // Handle Cell Click: user picks a grid cell (row & column)
  // ---------------------------------------------------------------------------
  const handleCellClick = async (teamIndex, countryIndex) => {
    const teamName = TEAMS[teamIndex];
    const country = COUNTRIES[countryIndex];

    // Reset states for a new round
    setChosenTeam(teamName);
    setChosenCountry(country);
    setGuess("");
    setAttempts(0);
    setRevealed(false);
    setGameMessage("Fetching a random player...");

    // Fetch a random player from that team/country
    const player = await fetchRandomPlayer(teamName, country);

    if (!player) {
      setRandomPlayer(null);
      setGameMessage(`No players found for ${teamName} / ${country}, or data unavailable.`);
    } else {
      setRandomPlayer(player);
      setGameMessage(
        `A player from ${teamName} who is from ${country} has been chosen. Good luck!`
      );
    }
  };

  // ---------------------------------------------------------------------------
  // Handle Guess Submission
  // ---------------------------------------------------------------------------
  const handleGuess = () => {
    if (!randomPlayer) return; // no player to guess
    if (revealed) return;      // we've already revealed

    // Increment attempts
    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);

    if (guess.trim().toLowerCase() === randomPlayer.toLowerCase()) {
      // Correct guess
      setGameMessage("Congratulations! You guessed correctly!");
      setRevealed(true);
    } else {
      // Wrong guess
      if (nextAttempts >= 3) {
        // Reveal the name
        setGameMessage(`Sorry, you've used all attempts. The player was: ${randomPlayer}`);
        setRevealed(true);
      } else {
        setGameMessage(`Incorrect guess. Try again! (Attempt ${nextAttempts}/3)`);
      }
    }
    setGuess("");
  };

  // ---------------------------------------------------------------------------
  // Render the 3×3 Grid and Game UI
  // ---------------------------------------------------------------------------
  return (
    <div style={styles.container}>
      <h1>Soccer Guessing Game</h1>
      <p>Select a row (team) and a column (country) from the grid.</p>

      {/* 3×3 Grid */}
      <table style={styles.grid}>
        <thead>
          <tr>
            <th></th>
            {COUNTRIES.map((country) => (
              <th key={country} style={styles.cell}>
                {country}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {TEAMS.map((team, rowIndex) => (
            <tr key={team}>
              {/* Left label for the row (team) */}
              <th style={styles.cell}>{team}</th>
              {COUNTRIES.map((_, colIndex) => (
                <td
                  key={`${rowIndex}-${colIndex}`}
                  style={styles.clickableCell}
                  onClick={() => handleCellClick(rowIndex, colIndex)}
                >
                  [{rowIndex + 1},{colIndex + 1}]
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Display info about the current selection */}
      {chosenTeam && chosenCountry && (
        <div style={styles.gameInfo}>
          <p>
            Selected: <strong>{chosenTeam}</strong> / <strong>{chosenCountry}</strong>
          </p>
          <p>{gameMessage}</p>
        </div>
      )}

      {/* Guess Section (only if we have a random player) */}
      {randomPlayer && !revealed && (
        <div style={styles.guessBox}>
          <label style={{ marginRight: "8px" }}>Your Guess:</label>
          <input
            style={styles.input}
            value={guess}
            onChange={(e) => setGuess(e.target.value)}
            placeholder="Enter player name"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleGuess();
            }}
          />
          <button style={styles.button} onClick={handleGuess}>
            Submit
          </button>
          <p style={{ marginTop: "10px" }}>
            Attempts: {attempts} / 3
          </p>
        </div>
      )}

      {/* If the name is revealed, show the "Play Again" button to pick a new cell */}
      {revealed && randomPlayer && (
        <div style={styles.revealBox}>
          <button style={styles.button} onClick={() => {
            // Clear states to let user pick a new cell in the grid
            setChosenTeam("");
            setChosenCountry("");
            setRandomPlayer(null);
            setGuess("");
            setAttempts(0);
            setRevealed(false);
            setGameMessage("");
          }}>
            Play Again
          </button>
        </div>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// 4) Basic Styling (inline for simplicity)
// -----------------------------------------------------------------------------
const styles = {
  container: {
    fontFamily: "Arial, sans-serif",
    margin: "20px auto",
    maxWidth: "600px",
    textAlign: "center",
  },
  grid: {
    margin: "0 auto",
    borderCollapse: "collapse",
  },
  cell: {
    border: "1px solid #ccc",
    padding: "10px",
    textAlign: "center",
    background: "#f2f2f2",
    fontWeight: "bold",
  },
  clickableCell: {
    border: "1px solid #ccc",
    padding: "10px",
    textAlign: "center",
    cursor: "pointer",
  },
  gameInfo: {
    marginTop: "20px",
    fontSize: "1rem",
  },
  guessBox: {
    marginTop: "20px",
  },
  revealBox: {
    marginTop: "20px",
  },
  button: {
    marginLeft: "8px",
    padding: "6px 12px",
    cursor: "pointer",
  },
  input: {
    padding: "6px",
    fontSize: "1rem",
    width: "200px",
  },
};
