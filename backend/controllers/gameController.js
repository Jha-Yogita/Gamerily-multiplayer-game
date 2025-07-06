const Question = require("../data/import.js");
const { rooms, completedPlayers } = require("../state");
const Result = require("../models/Result");

const finalizedResults = {};

socket.on("submitResults", async ({ roomId, username, score, totalTime }) => {
  console.log(`[submitResults] Called for roomId=${roomId}, username=${username}`);

  if (!rooms[roomId]) {
    console.warn(`[submitResults] Room not found: ${roomId}`);
    return;
  }

  if (!completedPlayers[roomId]) {
    completedPlayers[roomId] = {};
  }

  completedPlayers[roomId][username] = { score, totalTime };
  console.log(`[submitResults] Player ${username} submitted. Score=${score}, Time=${totalTime}`);

  socket.to(roomId).emit("opponentCompleted", { username, score });

  const players = rooms[roomId].players;
  if (players.every(p => completedPlayers[roomId][p.username] !== undefined)) {
    console.log(`[submitResults] Both players submitted for room ${roomId}`);

    const [p1, p2] = players;
    const p1Data = completedPlayers[roomId][p1.username];
    const p2Data = completedPlayers[roomId][p2.username];

    let winner;
    if (p1Data.score > p2Data.score) winner = p1.username;
    else if (p2Data.score > p1Data.score) winner = p2.username;
    else winner = p1Data.totalTime < p2Data.totalTime ? p1.username : p2.username;

    const resultPayload = {
      player1: { username: p1.username, ...p1Data },
      player2: { username: p2.username, ...p2Data },
      winner
    };

    finalizedResults[roomId] = resultPayload;

    // Save result to MongoDB
    try {
      console.log(`[submitResults] Saving result to DB for room ${roomId}`);
      const saved = await Result.create({
        roomId,
        player1: resultPayload.player1,
        player2: resultPayload.player2,
        winner: resultPayload.winner
      });
      console.log(`[submitResults] DB Save Success: ${saved._id}`);
    } catch (err) {
      console.error(`[submitResults] DB Save Failed:`, err);
    }

    io.to(roomId).emit("finalResults", resultPayload);

    setTimeout(() => {
      delete finalizedResults[roomId];
      delete completedPlayers[roomId];
      delete rooms[roomId];
    }, 120000);
  }
});


exports.checkResults = async (req, res) => {
  const { roomId } = req.body;
  console.log(`[checkResults] Called for roomId=${roomId}`);

  if (finalizedResults[roomId]) {
    console.log(`[checkResults] Cache hit for room ${roomId}`);
    return res.json(finalizedResults[roomId]);
  }

  console.log(`[checkResults] Cache miss. Checking MongoDB...`);
  try {
    const dbResult = await Result.findOne({ roomId });
    if (dbResult) {
      console.log(`[checkResults] Found result in DB for room ${roomId}`);
      return res.json(dbResult);
    } else {
      console.log(`[checkResults] No result in DB for room ${roomId}`);
    }
  } catch (err) {
    console.error(`[checkResults] DB lookup failed:`, err);
    return res.status(500).json({ error: "DB lookup failed" });
  }

  return res.status(404).json({ error: "Room not found" });
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
