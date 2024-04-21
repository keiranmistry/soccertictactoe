// index.js
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = 5000; // You can choose any available port

// Middleware
app.use(cors());
app.use(express.json());

// Replace with your actual API key
const API_KEY = '37e59d32ed0a4f2a93b33ab6e2012566';

// Endpoint to fetch players based on country and team
app.post('/api/get-player', async (req, res) => {
  const { country, team } = req.body;

  if (!country || !team) {
    return res.status(400).json({ error: 'Country and team are required.' });
  }

  try {
    // Step 1: Fetch team details to get team ID
    const teamResponse = await fetch(
      `https://api.football-data.org/v2/teams?name=${encodeURIComponent(team)}`,
      {
        headers: { 'X-Auth-Token': API_KEY },
      }
    );

    if (!teamResponse.ok) {
      return res.status(500).json({ error: 'Failed to fetch team details.' });
    }

    const teamData = await teamResponse.json();
    if (!teamData.teams || teamData.teams.length === 0) {
      return res.status(404).json({ error: 'Team not found.' });
    }

    const teamId = teamData.teams[0].id;

    // Step 2: Fetch squad (players) for the team
    const squadResponse = await fetch(`https://api.football-data.org/v2/teams/${teamId}`, {
      headers: { 'X-Auth-Token': API_KEY },
    });

    if (!squadResponse.ok) {
      return res.status(500).json({ error: 'Failed to fetch squad data.' });
    }

    const squadData = await squadResponse.json();
    const squad = squadData.squad;

    if (!squad || squad.length === 0) {
      return res.status(404).json({ error: 'No players found for this team.' });
    }

    // Step 3: Filter players by nationality
    const filteredPlayers = squad.filter(
      (player) => player.nationality.toLowerCase() === country.toLowerCase()
    );

    if (filteredPlayers.length === 0) {
      return res
        .status(404)
        .json({ error: `No players from ${country} found in team ${team}.` });
    }

    // Step 4: Select a random player
    const randomPlayer =
      filteredPlayers[Math.floor(Math.random() * filteredPlayers.length)];

    return res.json({ player: randomPlayer });
  } catch (error) {
    console.error('Error fetching player:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Backend server is running on port ${PORT}`);
});
