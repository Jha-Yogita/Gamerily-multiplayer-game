import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';
import { toast } from 'react-toastify';
import './PlayScreen.css';

const PlayScreen = () => {
  const { genre, index } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const socket = useRef(null);

  const parsedIndex = parseInt(index, 10);
  const solo = location.state?.solo || false;
  const roomId = location.state?.roomId || null;
  const players = location.state?.players || [];
  const currentUsername = localStorage.getItem('username') || 'Player';

  const opponentRef = useRef(null);
  const timerRef = useRef(null);
  const questionStartTime = useRef(null);
  const totalCorrectTime = useRef(0);

  const [question, setQuestion] = useState(null);
  const [userAns, setUserAns] = useState('');
  const [feedback, setFeedback] = useState('');
  const [feedbackType, setFeedbackType] = useState('');
  const [answered, setAnswered] = useState(false);
  const [myScore, setMyScore] = useState(0);
  const [timer, setTimer] = useState(10);
  const [waitingForOpponent, setWaitingForOpponent] = useState(false);
  const [opponentScore, setOpponentScore] = useState(0);
  const [opponentFinished, setOpponentFinished] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);

  // Initialize socket connection and event listeners
  useEffect(() => {
    console.log('Initializing socket connection...');
    
    // Set opponent if in multiplayer mode
    if (!solo && players.length > 0) {
      const opponent = players.find((p) => p !== currentUsername);
      if (opponent) {
        opponentRef.current = opponent;
        console.log(`Opponent set to: ${opponent}`);
      }
    }

    socket.current = io('http://localhost:8080', {
      withCredentials: true,
      transports: ['websocket'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    socket.current.on('connect', () => {
      console.log('Socket connected!');
      setSocketConnected(true);
    });

    socket.current.on('disconnect', () => {
      console.log('Socket disconnected');
      setSocketConnected(false);
    });

    socket.current.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
      toast.error('Connection problem. Trying to reconnect...');
    });

    // Event handlers
    const onOpponentCompleted = ({ username, score }) => {
      console.log(`Received opponentCompleted: ${username} scored ${score}`);
      if (username === opponentRef.current) {
        setOpponentScore(score);
        setOpponentFinished(true);
        toast.info(`${username} has finished the quiz!`);
      }
    };

    const onShowResults = (resultsData) => {
      console.log('SHOW RESULTS DATA RECEIVED:', resultsData);
      
      // Determine which player is the current user
      const isPlayer1 = resultsData.player1.username === currentUsername;
      const resultState = {
        solo: false,
        myScore: isPlayer1 ? resultsData.player1.score : resultsData.player2.score,
        oppScore: isPlayer1 ? resultsData.player2.score : resultsData.player1.score,
        myUsername: currentUsername,
        oppUsername: isPlayer1 ? resultsData.player2.username : resultsData.player1.username,
        winner: resultsData.winner,
        myTime: isPlayer1 ? resultsData.player1.totalTime : resultsData.player2.totalTime,
        oppTime: isPlayer1 ? resultsData.player2.totalTime : resultsData.player1.totalTime
      };

      // Store in sessionStorage as backup
      sessionStorage.setItem('quizResults', JSON.stringify(resultState));

      // Navigate to results page
      navigate('/result', {
        state: resultState,
        replace: true
      });
    };

    const onPlayerDisconnected = ({ username }) => {
      console.log(`Player disconnected: ${username}`);
      if (username === opponentRef.current) {
        toast.error(`${username} disconnected!`);
        navigate('/', { replace: true });
      }
    };

    const onReconnectAttempt = (attempt) => {
      console.log(`Reconnection attempt ${attempt}`);
    };

    // Attach event listeners
    socket.current.on('opponentCompleted', onOpponentCompleted);
    socket.current.on('showResults', onShowResults);
    socket.current.on('playerDisconnected', onPlayerDisconnected);
    socket.current.io.on('reconnect_attempt', onReconnectAttempt);

    return () => {
      console.log('Cleaning up socket connection');
      if (socket.current) {
        socket.current.off('opponentCompleted', onOpponentCompleted);
        socket.current.off('showResults', onShowResults);
        socket.current.off('playerDisconnected', onPlayerDisconnected);
        socket.current.io.off('reconnect_attempt', onReconnectAttempt);
        socket.current.disconnect();
      }
    };
  }, [solo, players, currentUsername, navigate]);

  // Fetch question and manage question state
  useEffect(() => {
    const fetchQuestion = async () => {
      try {
        const res = await axios.get(
          `http://localhost:8080/play/${genre.trim().toUpperCase()}/${parsedIndex}`
        );
        setQuestion(res.data);
        resetQuestionState();
        questionStartTime.current = Date.now();
        startTimer();
      } catch (err) {
        console.error('Question fetch error:', err);
        toast.error('Error loading question');
      }
    };

    const resetQuestionState = () => {
      setUserAns('');
      setFeedback('');
      setFeedbackType('');
      setAnswered(false);
      setTimer(10);
    };

    fetchQuestion();

    return () => {
      clearInterval(timerRef.current);
    };
  }, [genre, parsedIndex]);

  // Timer management
  const startTimer = () => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleTimeUp = () => {
    clearInterval(timerRef.current);
    if (!answered) {
      submitAnswer(false);
    }
  };

  // Answer handling
  const checkAnswerCorrectness = (userAnswer, correctAnswer) => {
    const sanitize = (str) => str.trim().toLowerCase().replace(/[^a-z0-9\s]/g, '');
    const userAns = sanitize(userAnswer);
    const correctAns = sanitize(correctAnswer);
    const correctWords = correctAns.split(/\s+/);

    return correctWords.some(word => userAns.includes(word)) || userAns === correctAns;
  };

  const submitAnswer = (isCorrect) => {
    setAnswered(true);
    clearInterval(timerRef.current);

    const timeTaken = (Date.now() - questionStartTime.current) / 1000;
    
    setFeedback(isCorrect ? `Correct! : ${question.answer}` : `Wrong! Correct answer: ${question.answer}`);
    setFeedbackType(isCorrect ? 'correct' : 'wrong');

    if (isCorrect) {
      const newScore = myScore + 1;
      setMyScore(newScore);
      totalCorrectTime.current += timeTaken;
    }
  };

  const checkAnswer = () => {
    if (!question || answered) return;
    const isCorrect = checkAnswerCorrectness(userAns, question.answer);
    submitAnswer(isCorrect);
  };

  // Quiz navigation
  const handleFinishQuiz = () => {
    if (!solo && socket.current && socketConnected) {
      console.log(`Emitting quizCompleted for room ${roomId}`);
      socket.current.emit('quizCompleted', {
        roomId,
        username: currentUsername,
        score: myScore,
        totalTime: totalCorrectTime.current
      });
      setWaitingForOpponent(true);
      toast.info('Waiting for opponent to finish...');
    } else {
      navigate('/result', {
        state: {
          solo: true,
          score: myScore,
          username: currentUsername,
          totalTime: totalCorrectTime.current
        },
        replace: true
      });
    }
  };

  const handleNextQuestion = () => {
    navigate(`/play/${genre}/${parsedIndex + 1}`, {
      state: { solo, roomId, players },
      replace: true
    });
  };

  return (
    <div className="play-container">
      {!solo && (
        <div className="versus-title">
          {currentUsername} <span className="vs">vs</span> {opponentRef.current}
          {!socketConnected && <span className="connection-badge">Connecting...</span>}
        </div>
      )}

      <div className="score-board">
        <div className="player-score you">
          {currentUsername}: {myScore}
        </div>
        {!solo && (
          <div className="player-score opponent">
            {opponentRef.current}: {opponentScore}
            {opponentFinished && <span className="finished-badge">Finished</span>}
          </div>
        )}
        <div className="timer">Time: {timer}s</div>
      </div>

      {question ? (
        <div className="play-card">
          <div className="play-content">
            <h2 className="play-title">{question.category}</h2>
            <p className="play-question">{question.question}</p>

            <input
              type="text"
              placeholder="Enter your answer..."
              value={userAns}
              onChange={(e) => setUserAns(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && checkAnswer()}
              disabled={answered}
              className="play-input"
              autoFocus
            />

            {feedback && (
              <div className={`feedback ${feedbackType}`}>{feedback}</div>
            )}

            <div className="play-actions">
              {!answered ? (
                <button
                  onClick={checkAnswer}
                  className="play-button primary"
                  disabled={!userAns.trim()}
                >
                  Submit Answer
                </button>
              ) : (
                <button 
                  onClick={parsedIndex + 1 >= 5 ? handleFinishQuiz : handleNextQuestion} 
                  className="play-button secondary"
                  disabled={waitingForOpponent && !opponentFinished}
                >
                  {parsedIndex + 1 >= 5 
                    ? (waitingForOpponent 
                        ? (opponentFinished ? 'Calculating results...' : 'Waiting for opponent...') 
                        : 'Finish Quiz') 
                    : 'Next Question'}
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="loading">Loading question...</div>
      )}
    </div>
  );
};

export default PlayScreen;