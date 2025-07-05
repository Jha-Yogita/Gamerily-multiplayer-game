require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoStore= require("connect-mongo");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const cookieParser = require("cookie-parser");
const flash = require("connect-flash");
const cors = require("cors");
const http = require("http");
const socketIO = require("socket.io");


const { rooms, completedPlayers } = require("./state");
const User = require("./models/User");

const authRoutes = require("./routes/authRoutes");
const gameRoutes = require("./routes/gameRoutes");
const userRoutes = require("./routes/userRoutes");
const notifyRoutes = require("./routes/notifyRoutes");

const app = express();
const server = http.createServer(app);
app.use(cors({
  origin:  "https://gamerily.vercel.app",
  credentials: true ,
  exposedHeaders: ["set-cookie"] 
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const io = socketIO(server, {
  cors: {
    origin:  "https://gamerily.vercel.app",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  socket.on("createRoom", ({ roomId, username, genre }) => {
    if (!roomId || !username || !genre) return socket.emit("error", "Missing fields");
    if (rooms[roomId]) return socket.emit("error", "Room exists");

    rooms[roomId] = {
      players: [{
        id: socket.id,
        username,
        score: 0,
        totalTime: 0,
        completed: false
      }],
      gameState: "waiting",
      genre,
      questions: []
    };

    socket.join(roomId);
    socket.emit("roomCreated", { roomId, players: [username], isHost: true });
  });

  socket.on("joinRoom", async ({ roomId, username }) => {
    const room = rooms[roomId];
    if (!room) return socket.emit("error", "Room not found");
    if (room.gameState !== "waiting") return socket.emit("error", "Game started");
    if (room.players.length >= 2) return socket.emit("error", "Room full");

    room.players.push({
      id: socket.id,
      username,
      score: 0,
      totalTime: 0,
      completed: false
    });

    socket.join(roomId);

    try {
      const genre = room.genre;
      const genreRegex = new RegExp(`^${genre.trim().toUpperCase()}$`, "i");
      const Question = require("./data/import.js");
      const questions = await Question.aggregate([
        { $match: { category: genreRegex } },
        { $sample: { size: 5 } }
      ]);
      room.questions = questions;
    } catch (err) {
      console.error("Error generating questions:", err);
      return socket.emit("error", "Failed to fetch questions");
    }

    io.to(roomId).emit("startMatch", {
      roomId,
      players: room.players.map(p => p.username),
      questions: room.questions,
      isHost: false
    });

    room.gameState = "playing";
  });

  socket.on("submitResults", ({ roomId, username, score, totalTime }) => {
    if (!rooms[roomId]) return;

    if (!completedPlayers[roomId]) {
      completedPlayers[roomId] = {};
    }

    completedPlayers[roomId][username] = { score, totalTime };
    socket.to(roomId).emit("opponentCompleted", { username, score });

    const players = rooms[roomId].players;
    if (players.every(p => completedPlayers[roomId][p.username] !== undefined)) {
      const [p1, p2] = players;
      const p1Data = completedPlayers[roomId][p1.username];
      const p2Data = completedPlayers[roomId][p2.username];

      let winner;
      if (p1Data.score > p2Data.score) winner = p1.username;
      else if (p2Data.score > p1Data.score) winner = p2.username;
      else winner = p1Data.totalTime < p2Data.totalTime ? p1.username : p2.username;

      io.to(roomId).emit("finalResults", {
        player1: { username: p1.username, ...p1Data },
        player2: { username: p2.username, ...p2Data },
        winner
      });

      delete completedPlayers[roomId];
      setTimeout(() => delete rooms[roomId], 30000);
    }
  });

  socket.on("disconnect", () => {
    Object.entries(rooms).forEach(([roomId, room]) => {
      const playerIndex = room.players.findIndex(p => p.id === socket.id);
      if (playerIndex !== -1) {
        socket.to(roomId).emit("playerDisconnected", {
          username: room.players[playerIndex].username
        });
        if (!room.players.every(p => p.completed)) {
          delete rooms[roomId];
        }
      }
    });
  });
});


mongoose.connect(process.env.MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  family: 4,
})
  .then(() => console.log("Connected to MongoDB"))
  .catch(console.error);



const store=MongoStore.create({
  mongoUrl:process.env.MONGO_URL,
  crypto: {
    secret:process.env.SESSION_SECRET,
  },
  touchAfter:24*3600,
})
store.on("error",()=> {
  console.log("Error in store");
})
app.use(session({
  store,
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', 
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', 
     
    domain: ".vercel.app",
  }
}));

app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Routes
app.use("/auth", authRoutes);
app.use("/api", gameRoutes);
app.use("/user", userRoutes);
app.use("/notify", notifyRoutes);

// Error Handling
app.use((err, req, res, next) => {
  const { status = 500, message = "Internal Server Error" } = err;
  res.status(status).json({ error: message });
});

// Server
const PORT = process.env.PORT;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
