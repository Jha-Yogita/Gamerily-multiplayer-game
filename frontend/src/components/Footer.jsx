import { useState } from "react";
import "./Footer.css";

function Footer() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const baseUrl = import.meta.env.VITE_API_URL;

  const handleNotify = async () => {
    if (!email) {
      setMessage("Please enter a valid email.");
      return;
    }

    try {
      const res = await fetch(`${baseUrl}/notify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email })
      });
      if (res.status === 200) {
        setMessage("Subscribed successfully! Check your inbox.");
        setEmail("");
      }
    } catch (err) {
      console.error(err);
      setMessage("Subscription failed. Try again.");
    }
  };

  return (
    <footer className="gamerily-footer">
      <div className="footer-content">
        <div className="footer-main">
          <div className="footer-brand">
            <h3>Gamerily</h3>
            <p>Test your knowledge, climb the leaderboards, and become the ultimate quiz champion!</p>
          </div>

          <div className="footer-subscribe">
            <h4>Stay Updated</h4>
            <p>Get notified about new quizzes, features, and tournaments</p>
            <div className="subscribe-form">
              <input
                type="email"
                placeholder="Your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <button onClick={handleNotify} className="btn">Notify Me</button>
            </div>
            {message && <div className="subscribe-message">{message}</div>}
          </div>
        </div>

        <div className="footer-bottom">
          <div className="footer-copyright">
            © 2025 Gamerily. All rights reserved.
          </div>
          <div className="footer-social">
            <a href="#" aria-label="Instagram">
              <i className="fab fa-instagram"></i>
            </a>
            <a href="#" aria-label="Twitter">
              <i className="fab fa-twitter"></i>
            </a>
            <a href="#" aria-label="Discord">
              <i className="fab fa-discord"></i>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;