import { useState, useEffect } from 'react';
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Login.css";
import { toast } from 'react-toastify';

function Login({ onLoginSuccess }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: "",
    password: ""
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/particles.js";
    script.onload = () => {
      if (window.particlesJS) {
        window.particlesJS.load('particles-js', '/particles.json', () => {
          console.log("Particles.js config loaded");
        });
      }
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    
    try {
      const res = await axios.post("http://localhost:8080/auth/login", form, {
        withCredentials: true
      });
      
      if (onLoginSuccess) onLoginSuccess(res.data.user);
localStorage.setItem("username", res.data.user.username); 
toast.success("Login successful!");
navigate("/");
    } catch (err) {
      setError(err.response?.data?.msg || "Login failed. Please try again.");
      toast.error(err.response?.data?.msg || "No Account Found");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div id="particles-js"></div>
      <div className="login-card">
        <div className="login-content">
          <h2 className="login-title">Welcome to Gamerily</h2>
          <p className="login-subtitle">Enter your credentials to start playing</p>
          
          <form onSubmit={handleSubmit} className="login-form">
            {error && <div className="error-message">{error}</div>}
            
            <div className="input-group">
              <input
                type="text"
                name="username"
                placeholder="Username"
                value={form.username}
                onChange={handleChange}
                required
                className="login-input"
              />
            </div>
            
            <div className="input-group">
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={form.password}
                onChange={handleChange}
                required
                className="login-input"
              />
            </div>
            
            <button 
              type="submit" 
              className="login-button"
              disabled={isLoading}
            >
              {isLoading ? 'Logging in...' : 'Log In'}
            </button>
            
            <p className="footer-text">
              Don't have an account? <span onClick={() => navigate("/signup")}>Sign up</span>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;