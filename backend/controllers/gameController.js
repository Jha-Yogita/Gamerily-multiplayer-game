const Question = require("../data/import.js");
const { rooms, completedPlayers } = require("../state");
const Result = require("../models/Result");

const finalizedResults = {};

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


exports.checkResults = async (req, res) => {
  const { roomId } = req.body;
  
  // 1. Check memory cache first
  if (finalizedResults[roomId]) {
    return res.json({
      status: 'complete',
      data: finalizedResults[roomId]
    });
  }

  // 2. Check if both players have submitted (but not yet processed)
  const room = rooms[roomId];
  if (room && completedPlayers[roomId]) {
    const allSubmitted = room.players.every(p => completedPlayers[roomId][p.username]);
    if (allSubmitted) {
      return res.json({
        status: 'processing',
        message: 'Results being calculated'
      });
    }
  }

  // 3. Check database as last resort
  try {
    const dbResult = await Result.findOne({ roomId }).lean();
    if (dbResult) {
      return res.json({
        status: 'complete',
        data: dbResult
      });
    }
  } catch (err) {
    console.error('Database error:', err);
  }

  // 4. Default response
  return res.json({
    status: 'pending',
    message: 'Waiting for opponent'
  });
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
