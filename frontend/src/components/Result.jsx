import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './result.css';
import io from 'socket.io-client';

const Result = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [results, setResults] = useState(null);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // First check location state
    if (location.state) {
      console.log('Results from navigation state:', location.state);
      setResults(location.state);
      return;
    }

    // Then check session storage
    const savedResults = sessionStorage.getItem('quizResults');
    if (savedResults) {
      console.log('Results from sessionStorage:', JSON.parse(savedResults));
      setResults(JSON.parse(savedResults));
      return;
    }

    // If no results found, set up socket to listen
    const newSocket = io('http://localhost:8080', {
      withCredentials: true,
      transports: ['websocket']
    });

    newSocket.on('showResults', (data) => {
      console.log('Received results via socket:', data);
      setResults({
        ...data,
        solo: false
      });
      sessionStorage.setItem('quizResults', JSON.stringify(data));
    });

    newSocket.on('connect_error', (err) => {
      console.error('Socket error in Results:', err);
    });

    setSocket(newSocket);

    return () => {
      if (newSocket) newSocket.disconnect();
    };
  }, [location]);

  if (!results) {
    return (
      <div className="result-container">
        <div className="result-card">
          <h1>Loading Results...</h1>
          <p>Please wait while we fetch your results</p>
          <p>If this takes too long, please return home and try again</p>
          <button onClick={() => navigate('/')}>Go Home</button>
        </div>
      </div>
    );
  }

  // Calculate winner if not provided
  const winner = results.winner || 
    (results.myScore > results.oppScore ? results.myUsername :
     results.oppScore > results.myScore ? results.oppUsername : 
     'tie');

  return (
    <div className="result-container">
      <div className="result-card">
        <h1>Quiz Results</h1>
        
        <div className="score-display">
          <div className="player-result">
            <h3>{results.myUsername}</h3>
            <p>Score: {results.myScore}</p>
            <p>Time: {results.myTime?.toFixed(2) || '0.00'}s</p>
          </div>

          <div className="vs">vs</div>

          <div className="player-result">
            <h3>{results.oppUsername}</h3>
            <p>Score: {results.oppScore}</p>
            <p>Time: {results.oppTime?.toFixed(2) || '0.00'}s</p>
          </div>
        </div>

        <div className="final-result">
          {winner === results.myUsername && <h2 className="win">🎉 You Won! 🎉</h2>}
          {winner === results.oppUsername && <h2 className="lose">😢 You Lost</h2>}
          {winner === 'tie' && <h2 className="tie">🤝 It's a Tie!</h2>}
        </div>

        <div className="action-buttons">
          <button onClick={() => navigate('/genres')}>Play Again</button>
          <button onClick={() => navigate('/')}>Go Home</button>
        </div>
      </div>
    </div>
  );
};

export default Result;