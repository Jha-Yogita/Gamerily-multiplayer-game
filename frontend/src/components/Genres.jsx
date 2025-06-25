import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./Genres.css";

function Genres({ user }) {
  const [genres, setGenres] = useState([]);

  useEffect(() => {
    fetch("http://localhost:8080/genres")
      .then((res) => res.json())
      .then((data) => setGenres(data));
  }, [user]);

  const genreVideos = {
    Anime: "Gojo_Satoru.mp4",
    Movies: "tony.mp4",
    Science: "earth.mp4",
    Series: "sherlock.mp4",
    Sports: "sports.mp4",
    Religion: "religion.mp4",
    History: "history.mp4",
    Literature: "literature.mp4",
    Music: "music.mp4",
    Memes: "meme.mp4",
    Politics: "politics.mp4",
  };

  return (
    <div className="genres-container">
      <h1 className="genres-title">ALL GENRES</h1>
      
      <div className="genre-grid">
        {genres.map((genre) => (
          <div key={genre.id} className="genre-card" style={{ "--genre-color": getGenreColor(genre.name) }}>
            {genreVideos[genre.name] && (
              <div className="genre-media">
                <video
                  src={genreVideos[genre.name]}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="genre-video"
                />
              </div>
            )}
            <div className="genre-card-content">
              <h3 className="genre-title">{genre.name}</h3>
              <div className="genre-btn-container">
                <Link to={`/select/${genre.name}`} className="genre-play-btn">
                  Play Now
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function getGenreColor(genre) {
  const colors = {
    Anime: '#ff6b6b',
    Science: '#4ecdc4',
    Movies: '#ffbe76',
    Series: '#a55eea',
    Sports: '#45aaf2',
    Religion: '#f78fb3',
    History: '#e17055',
    Literature: '#00b894',
    Music: '#fd79a8',
    Memes: '#fdcb6e',
    Politics: '#636e72'
  };
  return colors[genre] || '#61dafb';
}

export default Genres;