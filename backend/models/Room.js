const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
  username: { type: String, required: true },
  score: { type: Number, default: 0 },
  totalTime: { type: Number, default: 0 },
  finished: { type: Boolean, default: false },
});

const roomSchema = new mongoose.Schema({
  roomId: { type: String, required: true, unique: true },
  players: [playerSchema],
  createdAt: { type: Date, default: Date.now, expires: 3600 }, 
});

module.exports = mongoose.model('Room', roomSchema);
