const Question = require("../data/import.js");
const { rooms, completedPlayers } = require("../state");

// Submit results
exports.submitResults = (req, res) => {
  const { roomId, username, score, totalTime } = req.body;
  if (!roomId || !username || score === undefined || totalTime === undefined) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  if (!rooms[roomId]) {
    return res.status(404).json({ error: "Room does not exist" });
  }

  if (!completedPlayers[roomId]) completedPlayers[roomId] = {};
  completedPlayers[roomId][username] = { score, totalTime };

  return res.json({ status: "saved" });
};

// Check if both players submitted
exports.checkResults = (req, res) => {
  const { roomId } = req.body;

  if (finalizedResults[roomId]) {
    return res.json(finalizedResults[roomId]);
  }

  if (!rooms[roomId] || !completedPlayers[roomId]) {
    return res.status(404).json({ error: "Room not found" });
  }

  const [p1, p2] = rooms[roomId].players;
  const p1Data = completedPlayers[roomId][p1.username];
  const p2Data = completedPlayers[roomId][p2.username];

  if (!p1Data || !p2Data) {
    return res.json({ waiting: true });
  }

  return res.json({ waiting: true }); // Wait until result is finalized
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
