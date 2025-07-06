const mongoose = require("mongoose");

const resultSchema = new mongoose.Schema({
  roomId: { type: String, required: true, unique: true },
  player1: {
    username: String,
    score: Number,
    totalTime: Number,
  },
  player2: {
    username: String,
    score: Number,
    totalTime: Number,
  },
  winner: String,
  createdAt: { type: Date, default: Date.now, expires: 120 } 
});

module.exports = mongoose.model("Result", resultSchema);
