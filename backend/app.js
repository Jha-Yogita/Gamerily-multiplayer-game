const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const cookieParser = require("cookie-parser");
const flash = require("connect-flash");
const cors = require("cors");
const http = require("http");
const socketIO = require("socket.io");
const User = require("./models/User.js");
const Question = require("./data/import.js");
const nodemailer = require("nodemailer");

const app = express();
const server = http.createServer(app);


const io = socketIO(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true
  }
});


const rooms = {};

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // Create a new room
  socket.on('createRoom', ({ roomId, username }) => {
    console.log(`Creating room ${roomId} for ${username}`);
    
    // Input validation
    if (!roomId || !username) {
      return socket.emit('error', 'Missing roomId or username');
    }
    
    if (rooms[roomId]) {
      return socket.emit('error', 'Room already exists');
    }

    rooms[roomId] = {
      players: [{ 
        id: socket.id, 
        username, 
        score: 0,
        totalTime: 0,
        completed: false 
      }],
      gameState: 'waiting',
      cleanupTimer: null
    };

    socket.join(roomId);
    socket.emit('roomCreated', {
      roomId,
      players: [username],
      isHost: true,
    });
    console.log(`Room ${roomId} created by ${username}`);
  });

  // Join existing room
  socket.on('joinRoom', ({ roomId, username }) => {
    console.log(`${username} attempting to join room ${roomId}`);
    
    // Input validation
    if (!roomId || !username) {
      return socket.emit('error', 'Missing roomId or username');
    }

    const room = rooms[roomId];
    if (!room) {
      console.log(`Room ${roomId} not found`);
      return socket.emit('error', 'Room does not exist');
    }
    
    if (room.gameState !== 'waiting') {
      return socket.emit('error', 'Game already started');
    }
    
    if (room.players.length >= 2) {
      console.log(`Room ${roomId} is full`);
      return socket.emit('error', 'Room is full');
    }

    room.players.push({ 
      id: socket.id, 
      username, 
      score: 0,
      totalTime: 0,
      completed: false
    });
    socket.join(roomId);

    const playerNames = room.players.map((p) => p.username);
    io.to(roomId).emit('startMatch', {
      roomId,
      players: playerNames,
      isHost: false,
    });
    console.log(`${username} joined room ${roomId}`);
    room.gameState = 'playing';
  });

  // Handle quiz completion
  socket.on('quizCompleted', ({ roomId, username, score, totalTime }) => {
    console.log(`${username} completed quiz in room ${roomId} with score ${score}`);
    
    // Input validation
    if (!roomId || !username || score === undefined || !totalTime) {
      console.log('Invalid completion data:', { roomId, username, score, totalTime });
      return socket.emit('error', 'Invalid completion data');
    }

    const room = rooms[roomId];
    if (!room) {
      console.log(`Room ${roomId} not found for completion`);
      return socket.emit('error', 'Room not found');
    }

    const player = room.players.find((p) => p.username === username);
    if (!player) {
      console.log(`Player ${username} not found in room ${roomId}`);
      return socket.emit('error', 'Player not in room');
    }

    // Update player data
    player.score = score;
    player.totalTime = totalTime;
    player.completed = true;

    // Notify other player about completion
    socket.to(roomId).emit('opponentCompleted', {
      username,
      score
    });

    // Check if both players completed
    if (room.players.every(p => p.completed)) {
      console.log(`Both players completed in room ${roomId}, calculating results`);
      
      // Clear any pending cleanup timer
      if (room.cleanupTimer) {
        clearTimeout(room.cleanupTimer);
      }

      try {
        const [p1, p2] = room.players;
        if (!p1 || !p2) {
          throw new Error('Missing player data');
        }

        const winner = determineWinner(room.players);
        
        // Send results to all players
       io.to(roomId).emit('showResults', {
  player1: {
    username: p1.username,
    score: p1.score,
    totalTime: p1.totalTime
  },
  player2: {
    username: p2.username,
    score: p2.score,
    totalTime: p2.totalTime
  },
  winner: determineWinner(room.players) // Make sure this returns the username or 'tie'
});

        console.log(`Results sent for room ${roomId}, winner: ${winner}`);
        
        // Schedule room cleanup after 10 seconds (ensure clients receive results)
        room.cleanupTimer = setTimeout(() => {
          console.log(`Cleaning up room ${roomId}`);
          delete rooms[roomId];
        }, 10000); // 10 second delay

      } catch (err) {
        console.error('Error calculating results:', err);
        io.to(roomId).emit('gameError', 'Could not determine results');
        delete rooms[roomId]; // Immediate cleanup on error
      }
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    for (const roomId in rooms) {
      const room = rooms[roomId];
      const playerIndex = room.players.findIndex((p) => p.id === socket.id);

      if (playerIndex !== -1) {
        const disconnectedPlayer = room.players[playerIndex];
        console.log(`${disconnectedPlayer.username} disconnected from room ${roomId}`);

        // Notify remaining player
        socket.to(roomId).emit('playerDisconnected', {
          username: disconnectedPlayer.username,
        });

        // Immediate cleanup if game wasn't completed
        if (!room.players.every(p => p.completed)) {
          console.log(`Immediate cleanup for room ${roomId} due to disconnect`);
          if (room.cleanupTimer) {
            clearTimeout(room.cleanupTimer);
          }
          delete rooms[roomId];
        }
      }
    }
  });

  // Reconnection handler
  socket.on('rejoinRoom', ({ roomId, username }) => {
    const room = rooms[roomId];
    if (room) {
      const player = room.players.find(p => p.username === username);
      if (player) {
        player.id = socket.id; // Update socket ID
        socket.join(roomId);
        console.log(`${username} reconnected to room ${roomId}`);
      }
    }
  });

  // Winner determination logic
  function determineWinner(players) {
    if (!players || players.length !== 2) {
      console.error('Invalid players array:', players);
      return 'error';
    }

    const [p1, p2] = players;
    
    // Compare scores first
    if (p1.score > p2.score) return p1.username;
    if (p2.score > p1.score) return p2.username;
    
    // If scores are equal, player with less total time wins
    if (p1.totalTime < p2.totalTime) return p1.username;
    if (p2.totalTime < p1.totalTime) return p2.username;
    
    return 'tie';
  }
});


mongoose.connect("mongodb://127.0.0.1:27017/Game")
  .then(() => console.log("Connected to MongoDB"))
  .catch(console.error);

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: "defaultsecret",
  resave: false,
  saveUninitialized: true,
  cookie: {
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true
  }
}));

app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "whythiscolaveri04@gmail.com",
    pass: "tyeu gxki rjbo espf",
  }
});

app.post("/signup", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const newUser = new User({ email, username });
    const registeredUser = await User.register(newUser, password);
    req.login(registeredUser, err => {
      if (err) return res.status(500).json({ msg: "Login after signup failed" });
      res.json({ msg: "Signup successful", user: registeredUser });
    });
  } catch (err) {
    res.status(400).json({ msg: "Signup failed", error: err.message });
  }
});

app.post("/login", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) return next(err);
    if (!user) return res.status(401).json({ msg: info?.message || "Invalid credentials" });
    req.login(user, err => {
      if (err) return next(err);
      return res.json({ user: req.user });
    });
  })(req, res, next);
});

app.post("/logout", (req, res, next) => {
  req.logout(err => {
    if (err) return next(err);
    res.json({ msg: "Logged out" });
  });
});

app.get("/user", async (req, res) => {
  if (!req.user) return res.status(401).json({ msg: "Not authenticated" });
  const data = await User.findById(req.user._id);
  res.json({ data });
});

app.get("/genres", (req, res) => {
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
});

app.get("/play/:genre/:index", async (req, res) => {
  try {
    const genre = req.params.genre.trim().toUpperCase();
    const index = parseInt(req.params.index, 10);
    const genreRegex = new RegExp(`^${genre}$`, 'i');
    const total = await Question.countDocuments({ category: genreRegex });
    if (index >= total) return res.status(404).json({ message: 'No more questions' });
    const question = await Question.find({ category: genreRegex }).skip(index).limit(1);
    if (!question || question.length === 0) return res.status(404).json({ message: 'Question not found' });
    res.json(question[0]);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/notify", async (req, res) => {
  const { email } = req.body;
  if (!email || !email.includes("@")) {
    return res.status(400).json({ message: "Invalid email address" });
  }
  const mailOptions = {
    from: 'whythiscolaveri04@gmail.com',
    to: email,
    subject: 'Subscription Confirmation',
    text: 'You are now subscribed and will receive updates. Thanks for joining us!'
  };
  try {
    await transporter.sendMail(mailOptions);
    res.status(200).send('Confirmation email sent');
  } catch (err) {
    res.status(500).send('Failed to send email');
  }
});

app.use((err, req, res, next) => {
  const { status = 500, message = "Internal Server Error" } = err;
  res.status(status).json({ error: message });
});

const PORT = 8080;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
