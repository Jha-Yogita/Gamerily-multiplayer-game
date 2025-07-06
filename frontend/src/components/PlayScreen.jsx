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
  const pollIntervalIdRef = useRef(null);
  const pollingTimeoutIdRef = useRef(null);
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
            transports: ['websocket', 'polling'],
            reconnectionAttempts: 5,
            reconnectionDelay: 2000
          });

          socket.current.on('connect', () => setSocketConnected(true));
          socket.current.on('disconnect', () => setSocketConnected(false));
          socket.current.on('connect_error', () => toast.error('Socket connection failed.'));
          socket.current.on('opponentCompleted', ({ username }) => {
            if (username === opponentRef.current) {
              setOpponentFinished(true);
              toast.info(`${username} has finished!`);
            }
          });
          socket.current.on('playerDisconnected', ({ username }) => {
            if (username === opponentRef.current) {
              toast.error(`${username} disconnected`);
              navigate('/');
            }
          });
        }
      }, 3000);
    };

    connectWithDelay();

    return () => {
      clearInterval(pollIntervalIdRef.current);
      clearTimeout(pollingTimeoutIdRef.current);
      if (socket.current) socket.current.disconnect();
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
        } catch {
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
    const sanitize = str => str.trim().toLowerCase().replace(/[^a-z0-9\s]/g, '');
    const user = sanitize(userAnswer);
    const correct = sanitize(correctAnswer);
    const correctWords = correct.split(/\s+/);
    return correctWords.some(word => user.includes(word)) || user === correct;
  }, []);

  const submitAnswer = useCallback((isCorrect) => {
    setAnswered(true);
    clearInterval(timerRef.current);
    const timeTaken = (Date.now() - questionStartTime.current) / 1000;
    setFeedback(isCorrect ? `Correct! : ${question.answer}` : `Wrong! Correct: ${question.answer}`);
    setFeedbackType(isCorrect ? 'correct' : 'wrong');
    if (isCorrect) {
      setMyScore(prev => prev + 1);
      totalCorrectTime.current += timeTaken;
    }
  }, [question]);

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

      pollIntervalIdRef.current = setInterval(async () => {
        try {
          const response = await axios.post(`${baseUrl}/api/check-results`, { roomId });
          const data = response.data;

          if (data.player1 && data.player2 && data.winner) {
  console.log(" Got final result, navigating to /result", data);
  clearInterval(pollIntervalIdRef.current);
  clearTimeout(pollingTimeoutIdRef.current);

  const formatted = { ...data, solo: false };

  sessionStorage.setItem('quizResults', JSON.stringify(formatted));

 
  navigate('/result?refresh=' + Date.now(), { state: formatted, replace: true });
}

        } catch (err) {
          clearInterval(pollIntervalIdRef.current);
          clearTimeout(pollingTimeoutIdRef.current);
          toast.error("Error polling result.");
          navigate('/');
        }
      }, 2000);

      pollingTimeoutIdRef.current = setTimeout(() => {
        clearInterval(pollIntervalIdRef.current);
        toast.error("Opponent took too long to respond");
        navigate('/');
      }, 30000);

    } catch (err) {
      setWaitingForOpponent(false);
      toast.error(err.response?.data?.error || "Submission failed");
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
    const handleKeyDown = e => {
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
          <button onClick={() => navigate('/')}>Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div className="play-container">
      {!solo && (
        <div className="versus-title">
          {currentUsername} <span className="vs">vs</span> {opponentRef.current}
        </div>
      )}
      <div className="score-board">
        <div className="player-score you">{currentUsername}: {myScore}</div>
        <div className="timer">Time: {timer}s</div>
      </div>
      {question ? (
        <div className="play-card">
          <div className="play-content">
            <h2>{question.category}</h2>
            <p>{question.question}</p>
            <input
              type="text"
              value={userAns}
              onChange={(e) => setUserAns(e.target.value)}
              disabled={answered}
              placeholder="Enter your answer..."
              className="play-input"
              autoFocus
            />
            {feedback && <div className={`feedback ${feedbackType}`}>{feedback}</div>}
            <div className="play-actions">
  {!answered ? (
    <button
      className="play-button primary"
      onClick={checkAnswer}
      disabled={!userAns.trim()}
    >
      Submit Answer
    </button>
  ) : (
    <button
      className="play-button primary"
      onClick={handleNextQuestion}
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
