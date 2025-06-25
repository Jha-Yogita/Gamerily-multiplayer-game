import { Link } from 'react-router-dom';
import "./HomePage.css";
import { Typewriter } from "react-simple-typewriter";

function HomePage() {
  const genres = [
    { name: 'Anime', video: 'Gojo_Satoru.mp4', color: '#ff6b6b' },
    { name: 'Science', video: 'earth.mp4', color: '#4ecdc4' },
    { name: 'Movies', video: 'tony.mp4', color: '#ffbe0b' }
  ];

  return (
    <div className="home-container">
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">Play Games</h1>
          <h2 className="hero-subtitle">
            Challenge your brain, outsmart your rivals, and climb the leaderboard in real-time multiplayer quiz duels.
          </h2>
        </div>
      </section>

      <section className="genre-section">
        <div className="typewriter-container">
          <Typewriter
            words={[
              `Choose your favorite genre—from Anime to Science—and dive into intense quiz matches. Compete against real players or face the clock solo. The faster you answer, the higher you score! Ready to play?`,
            ]}
            loop={Infinity}
            cursor
            cursorStyle="|"
            typeSpeed={20}
            deleteSpeed={10}
            delaySpeed={2000}
          />
        </div>

        <div className="genre-grid three-col">
          {genres.map((genre, index) => (
            <div className="genre-card" key={index} style={{ '--genre-color': genre.color }}>
              <div className="genre-card-content">
                <h3 className="genre-title">{genre.name}</h3>
                <p className="genre-description">Test your {genre.name} knowledge!</p>
                
                <div className="genre-media">
                  <video
                    src={genre.video}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="genre-video"
                  />
                </div>
                <div className="genre-btn-container">
                  <Link to={`/genres`} className="genre-play-btn">
                    Play Now
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        <Link to="/genres" className="cta-button explore-btn">
          Explore All Genres
        </Link>
      </section>

      <section className="info-section">
        <div className="info-content">
          <h2 className="info-title">Real-Time Quiz Battles</h2>
          <p className="info-text">
            Get matched instantly with players worldwide. Test your knowledge under pressure in head-to-head matches. 
            Answer faster than your opponent to win points. No opponents online? Try our challenging solo mode!
          </p>
          <div className="feature-highlights">
            <div className="feature">
              <span className="feature-icon">⚡</span>
              <h4>Fast-Paced Gameplay</h4>
              <p>10-second timer per question</p>
            </div>
            <div className="feature">
              <span className="feature-icon">🏆</span>
              <h4>Compete With Rivals</h4>
              <p>Versus Mode</p>
            </div>
            <div className="feature">
              <span className="feature-icon">🤖</span>
              <h4>Solo Practice</h4>
              <p>Improve at your own pace</p>
            </div>
          </div>
          <Link to="/signup" className="cta-button main-cta">
            Start Playing Now
          </Link>
        </div>
      </section>
    </div>
  );
}

export default HomePage;