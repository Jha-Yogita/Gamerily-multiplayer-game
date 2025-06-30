import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import io from "socket.io-client";
import "./ModeSelect.css";

const socket = io("http://localhost:8080", {
  withCredentials: true,
});

const ModeSelect = ({ user }) => {
  const navigate = useNavigate();
  const { genre } = useParams();
  const [step, setStep] = useState(1);
  const [mode, setMode] = useState("");
  const [roomId, setRoomId] = useState("");
  const [error, setError] = useState("");
  const [players, setPlayers] = useState([]);
  const [waiting, setWaiting] = useState(false);

  useEffect(() => {
    if (!socket) return;

    socket.on("roomCreated", ({ roomId, players }) => {
      setRoomId(roomId);
      setPlayers(players);
      setWaiting(true);
    });

  
    socket.on("startMatch", ({ roomId, players, questions }) => {
      navigate(`/play/${genre.trim().toUpperCase()}`, {
        state: {
          solo: false,
          roomId,
          players,
          questions, 
        },
      });
    });

    socket.on("error", (msg) => {
      setError(msg);
      setWaiting(false);
      setRoomId("");
      setPlayers([]);
    });

    return () => {
      socket.off("roomCreated");
      socket.off("startMatch");
      socket.off("error");
    };
  }, [navigate, genre]);

  const handleSelectMode = (selectedMode) => {
    setMode(selectedMode);
    setError("");

    if (selectedMode === "solo") {
      navigate(`/play/${genre.trim().toUpperCase()}`, {
        state: { solo: true },
      });
    } else {
      setStep(2);
    }
  };

  const handleCreateRoom = () => {
    if (!user || !user.username) {
      setError("Please login to create a room");
      return;
    }

    const newRoomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    socket.emit("createRoom", {
      roomId: newRoomId,
      username: user.username,
      genre: genre.trim().toUpperCase(), 
    });
  };

  const handleJoinRoom = () => {
    if (!user || !user.username) {
      setError("Please login to join a room");
      return;
    }

    if (!roomId) {
      setError("Please enter a room ID");
      return;
    }

    socket.emit("joinRoom", {
      roomId: roomId.toUpperCase(),
      username: user.username,
    });
    setWaiting(true);
  };

  return (
    <div className="mode-select-container">
      <div className="mode-content">
        <div className="mode-header">
          <h1 className="mode-title">SELECT YOUR BATTLE MODE</h1>
          <p className="mode-subtitle">
            Challenge your brain, outsmart your rivals, and climb the leaderboard in real-time quiz duels
          </p>
        </div>

        {step === 1 && (
          <div className="mode-options">
            <div className="mode-card" onClick={() => handleSelectMode("solo")}>
              <div className="mode-icon">👑</div>
              <h2 className="mode-name">Solo Mode</h2>
              <p className="mode-desc">
                Test your knowledge against the clock. Perfect for sharpening your skills.
              </p>
            </div>
            <div className="mode-card" onClick={() => handleSelectMode("versus")}>
              <div className="mode-icon">⚔️</div>
              <h2 className="mode-name">Versus Mode</h2>
              <p className="mode-desc">
                Challenge real opponents in head-to-head quiz battles. Winner takes the glory!
              </p>
            </div>
          </div>
        )}

        {step === 2 && mode === "versus" && (
          <div className="room-panel">
            <h3 className="room-title">{waiting ? "WAITING FOR PLAYER" : "CREATE OR JOIN ROOM"}</h3>

            {!waiting ? (
              <>
                <button className="room-button" onClick={handleCreateRoom}>
                  CREATE NEW ROOM
                </button>

                <div className="input-group">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter Room ID"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value.trim())}
                    style={{
                      background: "rgba(255, 255, 255, 0.1)",
                      color: "white",
                      border: "1px solid rgba(110, 69, 226, 0.3)",
                      padding: "1rem",
                      borderRadius: "8px",
                      width: "100%",
                      marginBottom: "1rem",
                    }}
                  />
                  <button
                    className="room-button"
                    onClick={handleJoinRoom}
                    style={{
                      background: "linear-gradient(135deg, #4caf50, #81c784)",
                    }}
                  >
                    JOIN ROOM
                  </button>
                </div>

                {error && <p className="error-message">{error}</p>}
              </>
            ) : (
              <div className="waiting-room">
                <div className="waiting-icon">⏳</div>
                <p className="waiting-message">Waiting for opponent to join...</p>
                <div className="room-info">
                  <p className="room-id-display">
                    ROOM CODE: <span>{roomId}</span>
                  </p>
                  <p className="players-display">
                    Players ready: {players.join(", ")}
                  </p>
                </div>
                <button
                  className="room-button"
                  onClick={() => {
                    socket.emit("leaveRoom", { roomId });
                    setWaiting(false);
                    setRoomId("");
                  }}
                  style={{
                    background: "linear-gradient(135deg, #e24545, #d38888)",
                    marginTop: "2rem",
                  }}
                >
                  CANCEL
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ModeSelect;
