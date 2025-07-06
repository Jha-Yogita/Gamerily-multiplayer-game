const Question = require("../data/import.js");
const { rooms, completedPlayers,finalizedResults } = require("../state");
const Result = require("../models/Result");


exports.submitResults = (req, res) => {
  const { roomId, username, score, totalTime } = req.body;
  
  // Basic validation
  if (!roomId || !username || score === undefined || totalTime === undefined) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  // Check room exists
  if (!rooms[roomId]) {
    return res.status(404).json({ error: "Room does not exist" });
  }

  // Store submission
  if (!completedPlayers[roomId]) completedPlayers[roomId] = {};
  completedPlayers[roomId][username] = { score, totalTime };

  return res.json({ success: true });
};
exports.checkResults = (req, res) => {
  const { roomId } = req.body;
  
  // Validate room exists
  if (!rooms[roomId] || !completedPlayers[roomId]) {
    return res.status(404).json({ error: "Room not found" });
  }

  const [p1, p2] = rooms[roomId].players;
  const p1Data = completedPlayers[roomId][p1.username];
  const p2Data = completedPlayers[roomId][p2.username];

  // Check if both players submitted
  if (!p1Data || !p2Data) {
    return res.json({ waiting: true });
  }

  // Calculate winner
  const winner = p1Data.score > p2Data.score ? p1.username :
                p2Data.score > p1Data.score ? p2.username :
                p1Data.totalTime < p2Data.totalTime ? p1.username : p2.username;

  // Prepare final result
  const result = {
    player1: { username: p1.username, ...p1Data },
    player2: { username: p2.username, ...p2Data },
    winner
  };

  // Clean up immediately
  delete completedPlayers[roomId];
  delete rooms[roomId];

  return res.json(result);
};


// Genres
exports.getGenres = (req, res) => {
  res.json([
    { id: 1, name: 'Anime' },
    { id: 2, name: 'Science' },
    { id: 3, name: 'Movies' },
    { id: 4, name: 'Series' },
    { id: 5, name: 'Sports' },
    { id: 6, name: 'Religion' },
    { id: 7, name: 'History' },
    { id: 8, name: 'Literature' },
    { id: 9, name: 'Music' },
    { id: 10, name: 'Memes' },
    { id: 11, name: 'Politics' }
  ]);
};

// Play by genre
exports.playGenre = async (req, res) => {
  try {
    const genre = req.params.genre.trim().toUpperCase();

    const questions = await Question.aggregate([
      { $match: { category: { $regex: `^${genre}$`, $options: 'i' } } },
      { $sample: { size: 5 } }
    ]);
    if (!questions.length) return res.status(404).json({ error: "No questions found" }); // Changed from "message" to "error"
    res.json(questions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch questions" }); // More specific error
  }
};
