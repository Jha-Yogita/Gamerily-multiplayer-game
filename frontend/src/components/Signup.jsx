import { useState, useEffect } from 'react';
import axios from "axios";
import { useNavigate } from "react-router-dom";
import './Signup.css';
import { toast } from 'react-toastify';

function Signup({ onSignupSuccess }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: "",
    password: "",
    email: ""
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    
    try {
      const res = await axios.post("http://localhost:8080/signup", form, {
        withCredentials: true
      });
      console.log("Signup successful", res.data);
      onSignupSuccess();
      toast.success("Signup successful!");
      navigate("/");
    } catch (err) {
      console.error("Signup failed:", err.response?.data?.msg || err.message);
      setError(err.response?.data?.msg || "Signup failed. Please try again.");
      toast.error(err.response?.data?.msg || "Signup failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

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

  return (
    <div className="signup-container">
      <div id="particles-js"></div>
      <div className="signup-card">
        <div className="signup-content">
          <h2 className="signup-title">Join Gamerily</h2>
          <p className="signup-subtitle">Create your account to start playing</p>
          
          <form onSubmit={handleSubmit} className="signup-form">
            {error && <div className="signup-error">{error}</div>}
            
            <div className="input-group">
              <input
                type="text"
                name="username"
                placeholder="Username"
                value={form.username}
                onChange={handleChange}
                required
                className="signup-input"
              />
            </div>
            
            <div className="input-group">
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={form.email}
                onChange={handleChange}
                required
                className="signup-input"
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
                className="signup-input"
              />
            </div>
            
            <button 
              type="submit" 
              className="signup-button"
              disabled={isLoading}
            >
              {isLoading ? 'Creating Account...' : 'Sign Up'}
            </button>
            
            <p className="login-link">
              Already have an account? <a href="/login">Log in</a>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Signup;