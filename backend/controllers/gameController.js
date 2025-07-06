const Question = require("../data/import.js");
const { rooms, completedPlayers,finalizedResults } = require("../state");
const Result = require("../models/Result");


exports.submitResults = async (req, res) => {  // Make this async
  const { roomId, username, score, totalTime } = req.body;
  
  // Input validation
  if (!roomId || !username || score === undefined || totalTime === undefined) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    // 1. Save to memory
    if (!completedPlayers[roomId]) completedPlayers[roomId] = {};
    completedPlayers[roomId][username] = { score, totalTime };

    // 2. Check if both players submitted
    const room = rooms[roomId];
    if (room && room.players.every(p => completedPlayers[roomId]?.[p.username])) {
      const [p1, p2] = room.players;
      const p1Data = completedPlayers[roomId][p1.username];
      const p2Data = completedPlayers[roomId][p2.username];

      // Calculate winner
      let winner;
      if (p1Data.score > p2Data.score) winner = p1.username;
      else if (p2Data.score > p1Data.score) winner = p2.username;
      else winner = p1Data.totalTime < p2Data.totalTime ? p1.username : p2.username;

      // Create final payload
      const resultPayload = {
        player1: { username: p1.username, ...p1Data },
        player2: { username: p2.username, ...p2Data },
        winner
      };

      // 3. Save to database
      await Result.create(resultPayload);
      
      // 4. Store in memory cache
      finalizedResults[roomId] = resultPayload;

      return res.json({ status: "complete", data: resultPayload });
    }

    res.json({ status: "pending" });
  } catch (err) {
    console.error("Submission error:", err);
    res.status(500).json({ error: "Failed to process results" });
  }
};

exports.checkResults = async (req, res) => {
  const { roomId } = req.body;
  
  // 1. Check memory cache
  if (finalizedResults[roomId]) {
    return res.json({ status: "complete", data: finalizedResults[roomId] });
  }

  // 2. Check database
  try {
    const dbResult = await Result.findOne({ roomId }).lean();
    if (dbResult) {
      return res.json({ status: "complete", data: dbResult });
    }
  } catch (err) {
    console.error("Database error:", err);
  }

  // 3. Check submission progress
  if (completedPlayers[roomId]) {
    const room = rooms[roomId];
    if (room) {
      const submittedCount = room.players.filter(
        p => completedPlayers[roomId][p.username]
      ).length;
      return res.json({ 
        status: "pending", 
        progress: `${submittedCount}/2 players submitted`
      });
    }
  }

  res.json({ status: "waiting", message: "No submissions yet" });
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
