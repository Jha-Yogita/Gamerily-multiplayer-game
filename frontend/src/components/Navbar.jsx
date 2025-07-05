import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useEffect, useState } from 'react';
import './Navbar.css';

function Navbar() {
  const [currUser, setCurrUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const baseUrl = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();

  // Check auth status on load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await axios.get(`${baseUrl}/auth/current-user`, { 
          withCredentials: true 
        });
        setCurrUser(res.data.user || null);
      } catch {
        setCurrUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, [baseUrl]);

  const handleLogout = async () => {
    try {
      await axios.post(`${baseUrl}/auth/logout`, {}, { 
        withCredentials: true 
      });
      setCurrUser(null);
      navigate('/login');
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  if (isLoading) {
    return <div className="navbar-loading"></div>; // Simple loading state
  }

  return (
    <nav className="navbar navbar-expand-md gamerily-navbar">
      <div className="container-fluid">
        <Link className="navbar-brand" to="/">
          <span>Gamerily</span>
        </Link>

        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarContent">
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarContent">
          <div className="navbar-nav">
            <Link className="nav-link" to="/">Home</Link>
            <Link className="nav-link" to="/genres">Genres</Link>
          </div>

          <div className="navbar-nav ms-auto">
            {currUser ? (
              <div className="dropdown">
                <button className="btn dropdown-toggle" data-bs-toggle="dropdown">
                  {currUser.username}
                </button>
                <ul className="dropdown-menu dropdown-menu-end">
                  <li><Link className="dropdown-item" to="/profile">Profile</Link></li>
                  <li><hr className="dropdown-divider"/></li>
                  <li>
                    <button className="dropdown-item text-danger" onClick={handleLogout}>
                      Logout
                    </button>
                  </li>
                </ul>
              </div>
            ) : (
              <>
                <Link className="nav-link" to="/login">Login</Link>
                <Link className="nav-link" to="/signup">Signup</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;