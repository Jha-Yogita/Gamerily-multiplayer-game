import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';
import { toast } from 'react-toastify';
import './PlayScreen.css';

const PlayScreen = () => {
  const { genre } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const socket = useRef(null);
  const solo = location.state?.solo || false;
  const roomId = location.state?.roomId || null;
  const players = location.state?.players || [];
  const currentUsername = localStorage.getItem('username') || 'Player';
  const opponentRef = useRef(null);
  const timerRef = useRef(null);
  const baseUrl = import.meta.env.VITE_API_URL;
  const questionStartTime = useRef(null);
  const totalCorrectTime = useRef(0);

  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAns, setUserAns] = useState('');
  const [feedback, setFeedback] = useState('');
  const [feedbackType, setFeedbackType] = useState('');
  const [answered, setAnswered] = useState(false);
  const [myScore, setMyScore] = useState(0);
  const [timer, setTimer] = useState(10);
  const [waitingForOpponent, setWaitingForOpponent] = useState(false);
  const [opponentFinished, setOpponentFinished] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  const question = questions[currentIndex];

  useEffect(() => {
    if (!solo && players.length > 0) {
      const opponent = players.find(p => p !== currentUsername);
      if (opponent) opponentRef.current = opponent;
    }

    const connectWithDelay = () => {
      setTimeout(() => {
        if (!socket.current || !socket.current.connected) {
          socket.current = io(`${baseUrl}`, {
            withCredentials: true,
            transports: ['websocket','polling'],
            reconnectionAttempts: 5,
            reconnectionDelay: 2000
          });

          socket.current.on('connect', () => {
            console.log("✅ Socket connected");
            setSocketConnected(true);
          });

          socket.current.on('disconnect', () => {
            console.log("❌ Socket disconnected");
            setSocketConnected(false);
          });

          socket.current.on('connect_error', (err) => {
            toast.error('Connection failed. Please try again.');
          });

          socket.current.on('opponentCompleted', ({ username, score }) => {
            if (username === opponentRef.current) {
              setOpponentFinished(true);
              toast.info(`${username} has finished!`);
            }
          });

          socket.current.on('finalResults', (resultsData) => {
            const formatted = {
              player1: resultsData.player1,
              player2: resultsData.player2,
              winner: resultsData.winner,
              solo: false
            };
            sessionStorage.setItem('quizResults', JSON.stringify(formatted));
            navigate('/result', { state: formatted, replace: true });
          });

          socket.current.on('playerDisconnected', ({ username }) => {
            if (username === opponentRef.current) {
              toast.error(`${username} disconnected`);
              navigate('/', { replace: true });
            }
          });
        }
      }, 4000); 
    };

    connectWithDelay();

    return () => {
      if (socket.current) {
        socket.current.off('finalResults');
        socket.current.off('opponentCompleted');
        if (solo) {
          socket.current.disconnect();
        }
      }
    };
  }, [solo, players, currentUsername, navigate]);

  useEffect(() => {
    const sharedQuestions = location.state?.questions;

    if (!solo && sharedQuestions) {
      setQuestions(sharedQuestions);
      setCurrentIndex(0);
      resetQuestionState();
      questionStartTime.current = Date.now();
      startTimer();
    } else {
      const fetchQuestions = async () => {
        try {
          const res = await axios.get(`${baseUrl}/api/play/${genre.trim().toUpperCase()}`);
          setQuestions(res.data);
          setCurrentIndex(0);
          resetQuestionState();
          questionStartTime.current = Date.now();
          startTimer();
        } catch (err) {
          toast.error('Error loading questions');
        }
      };

      fetchQuestions();
    }

    return () => clearInterval(timerRef.current);
  }, [solo, genre, location.state?.questions]);

  const resetQuestionState = () => {
    setUserAns('');
    setFeedback('');
    setFeedbackType('');
    setAnswered(false);
    setTimer(10);
  };

  const startTimer = () => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimer(prev => {
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
    if (!answered) submitAnswer(false);
  };

  const checkAnswerCorrectness = useCallback((userAnswer, correctAnswer) => {
    const sanitize = (str) => str.trim().toLowerCase().replace(/[^a-z0-9\s]/g, '');
    const userAns = sanitize(userAnswer);
    const correctAns = sanitize(correctAnswer);
    const correctWords = correctAns.split(/\s+/);
    return correctWords.some(word => userAns.includes(word)) || userAns === correctAns;
  }, []);

  const submitAnswer = useCallback((isCorrect) => {
    setAnswered(true);
    clearInterval(timerRef.current);
    const timeTaken = (Date.now() - questionStartTime.current) / 1000;
    setFeedback(isCorrect ? `Correct! : ${question.answer}` : `Wrong! Correct answer: ${question.answer}`);
    setFeedbackType(isCorrect ? 'correct' : 'wrong');
    if (isCorrect) {
      setMyScore(myScore + 1);
      totalCorrectTime.current += timeTaken;
    }
  }, [question, myScore]);

  const checkAnswer = useCallback(() => {
    if (!question || answered) return;
    const isCorrect = checkAnswerCorrectness(userAns, question.answer);
    submitAnswer(isCorrect);
  }, [question, answered, userAns, checkAnswerCorrectness, submitAnswer]);

  const handleFinishQuiz = async () => {
    if (solo) {
      const soloResults = {
        solo: true,
        player1: {
          username: currentUsername,
          score: myScore,
          totalTime: totalCorrectTime.current
        }
      };
      sessionStorage.setItem('quizResults', JSON.stringify(soloResults));
      navigate('/result', { state: soloResults });
      return;
    }

    setWaitingForOpponent(true);

    try {
      await axios.post(`${baseUrl}/api/submit-results`, {
        roomId,
        username: currentUsername,
        score: myScore,
        totalTime: totalCorrectTime.current
      });

      const pollInterval = setInterval(async () => {
  try {
    const response = await axios.post(`${baseUrl}/api/check-results`, { roomId });
    if (response.data.player1 && response.data.player2) {
      clearInterval(pollInterval);
      clearTimeout(pollingTimeout);
      sessionStorage.setItem('quizResults', JSON.stringify(response.data));
      navigate('/result', { state: response.data });
    }
  } catch (err) {
    clearInterval(pollInterval);
    clearTimeout(pollingTimeout);
    toast.error("Failed to fetch results.");
    navigate('/');
  }
}, 2000);


const pollingTimeout = setTimeout(() => {
  clearInterval(pollInterval);
  toast.error("Opponent took too long to respond.");
  navigate('/');
}, 30000);

    } catch (err) {
      toast.error("Submission failed");
      setWaitingForOpponent(false);
    }
  };

  const handleNextQuestion = () => {
    if (currentIndex + 1 >= questions.length) {
      handleFinishQuiz();
    } else {
      setCurrentIndex(currentIndex + 1);
      resetQuestionState();
      questionStartTime.current = Date.now();
      startTimer();
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Enter' && !answered) checkAnswer();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [checkAnswer, answered]);

  if (waitingForOpponent) {
    return (
      <div className="play-container">
        <div className="waiting-screen">
          <h2>Waiting for opponent to finish...</h2>
          <div className="spinner"></div>
          <div className="waiting-scores">
            <p>Your Score: {myScore}</p>
            <p>Status: {opponentFinished ? 'Finished' : 'Playing...'}</p>
          </div>
          <button
            className="cancel-button"
            onClick={() => {
              toast.dismiss('waiting-toast');
              navigate('/');
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="play-container">
      {!solo && (
        <div className="versus-title">
          {currentUsername} <span className="vs">vs</span> {opponentRef.current}
          {!socketConnected && (
            <span className="connection-badge">
              {reconnectAttempts > 0 ? `Reconnecting (${reconnectAttempts})` : 'Connecting...'}
            </span>
          )}
        </div>
      )}
      <div className="score-board">
        <div className="player-score you">
          {currentUsername}: {myScore}
        </div>
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
                  onClick={handleNextQuestion}
                  className="play-button secondary"
                >
                  {currentIndex + 1 >= questions.length ? 'Finish Quiz' : 'Next Question'}
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="loading">Loading questions...</div>
      )}
    </div>
  );
};

export default PlayScreen;
