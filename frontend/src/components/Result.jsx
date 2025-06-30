import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './Result.css';

const Result = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [results, setResults] = useState(null);
  const baseUrl = import.meta.env.VITE_API_URL;

  useEffect(() => {
    if (location.state) {
      setResults(processResults(location.state));
      return;
    }

   
    const savedResults = sessionStorage.getItem('quizResults');
    if (savedResults) {
      setResults(JSON.parse(savedResults));
    } else {
      navigate('/');
    }
  }, [location.state, navigate]);

  const processResults = (data) => {
  const isSolo = data.solo || !data.player2;

  const results = {
    solo: isSolo,
    player1: {
      username: data.player1?.username || data.myUsername || 'Player 1',
      score: data.player1?.score || data.myScore || 0,
      totalTime: data.player1?.totalTime || data.myTime || 0
    },
    player2: isSolo
      ? null
      : {
          username: data.player2?.username || data.oppUsername || 'Player 2',
          score: data.player2?.score || data.oppScore || 0,
          totalTime: data.player2?.totalTime || data.oppTime || 0
        },
    winner: data.winner || null
  };

  sessionStorage.setItem('quizResults', JSON.stringify(results));
  return results;
};


  if (!results) {
    return (
      <div className="result-container">
        <div className="result-card">
          <h1>Loading Results...</h1>
        </div>
      </div>
    );
  }

  
  return (
    <div className="result-container">
      <div className="result-card">
        <h1>Quiz Results</h1>
        <div className="score-display">
          <div className="player-result">
            <h3>{results.player1.username}</h3>
            <p>Score: {results.player1.score}</p>
            {!results.solo && <p>Time: {results.player1.totalTime.toFixed(2)}s</p>}
          </div>
          {!results.solo && (
            <>
              <div className="vs">vs</div>
              <div className="player-result">
                <h3>{results.player2.username}</h3>
                <p>Score: {results.player2.score}</p>
                <p>Time: {results.player2.totalTime.toFixed(2)}s</p>
              </div>
            </>
          )}
        </div>
        <div className="final-result">
 {results.solo ? (
  <h2 className="solo-score">Your Score: {results.player1.score}</h2>
) : results.winner === (localStorage.getItem('username') || 'Player') ? (
  <h2 className="win">🎉 You Won! 🎉</h2>
) : (
  <h2 className="lose">😢 You Lost</h2>
)}
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