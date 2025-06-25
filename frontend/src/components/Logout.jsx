import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import "./Logout.css";
import { toast } from 'react-toastify';

function Logout({ onLogout }) {
  const navigate = useNavigate();
  
  const handleLogout = async () => {
    try {
      await axios.post("http://localhost:8080/logout", {}, { withCredentials: true });
      console.log("Logged out successfully");
      onLogout(); 
      localStorage.removeItem("username");
      toast.success("Logged Out Successfully");
      navigate("/");
    } catch (err) {
      console.error("Logout failed", err);
      toast.error("Some Error Occurred, Logout not successful");
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
    <div className="logout-container">
      <div id="particles-js"></div>
      <div className="logout-card">
        <div className="logout-content">
          <h2 className="logout-title">Leaving So Soon?</h2>
          <p className="logout-subtitle">We'd love to have you back soon!</p>
          
          <div className="logout-buttons">
            <button 
              className="logout-button"
              onClick={handleLogout}
            >
              Logout
            </button>
            <button 
              className="logout-button secondary"
              onClick={() => navigate('/')}
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Logout;