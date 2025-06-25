# Multiplayer Quiz Game

A full-stack, real-time multiplayer quiz platform developed using React, Node.js, Express, MongoDB, and Socket.io.  
The application includes user authentication with Passport.js, solo and versus gameplay modes, and real-time updates via WebSockets.

## Features

### Implemented
- **User Authentication (Passport.js)**  
  Secure login, signup, and session management using Passport.js with local strategy and session cookies.

- **Solo Mode**  
  Users can select a category and difficulty level to play quizzes with a timer and scoring system.

- **Real-time Communication**  
  WebSocket-based gameplay using Socket.io, supporting multiplayer connections, real-time updates, and matchmaking logic.

- **Email Update Functionality**  
  Authenticated users can securely update their registered email address.

- **Responsive Interface**  
  The frontend is built with React and styled using Bootstrap to ensure compatibility across devices.

### In Progress
- **Versus Mode Logic**  
  Core matchmaking and communication infrastructure are implemented. Gameplay synchronization and UI logic are being finalized.

- **Leaderboard and Match History**  
  Planned as enhancements following the core feature set.

## Tech Stack

| Layer           | Technologies                        |
|-----------------|-------------------------------------|
| Frontend        | React, Bootstrap                    |
| Backend         | Node.js, Express.js                 |
| Real-time Layer | Socket.io (WebSockets)              |
| Database        | MongoDB with Mongoose ODM           |
| Authentication  | Passport.js (local strategy)        |
| Deployment      | Vercel (Frontend), Render (Backend) |



