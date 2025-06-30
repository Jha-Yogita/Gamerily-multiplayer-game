const Question = require("../data/import.js");
const { rooms, completedPlayers } = require("../state");

// Submit results
exports.submitResults = (req, res) => {
  const { roomId, username, score, totalTime } = req.body;
  if (!roomId || !username) return res.status(400).json({ error: "Missing data" });

  if (!completedPlayers[roomId]) completedPlayers[roomId] = {};
  completedPlayers[roomId][username] = { score, totalTime };

  return res.json({ status: "saved" });
};

// Check if both players submitted
exports.checkResults = (req, res) => {
  const { roomId } = req.body;
  if (!rooms[roomId] || !completedPlayers[roomId]) return res.json({ waiting: true });

  const [p1, p2] = rooms[roomId].players;
  const p1Data = completedPlayers[roomId][p1.username];
  const p2Data = completedPlayers[roomId][p2.username];

  if (p1Data && p2Data) {
    let winner;
    if (p1Data.score > p2Data.score) winner = p1.username;
    else if (p2Data.score > p1Data.score) winner = p2.username;
    else winner = p1Data.totalTime < p2Data.totalTime ? p1.username : p2.username;

    setTimeout(() => {
      delete completedPlayers[roomId];
      delete rooms[roomId];
    }, 30000);

    return res.json({
      player1: { username: p1.username, ...p1Data },
      player2: { username: p2.username, ...p2Data },
      winner
    });
  }

  return res.json({ waiting: true });
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
    const genreRegex = new RegExp(`^${genre}$`, 'i');
    const questions = await Question.aggregate([
      { $match: { category: genreRegex } },
      { $sample: { size: 5 } }
    ]);
    if (!questions.length) return res.status(404).json({ message: "No questions found" });
    res.json(questions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};
