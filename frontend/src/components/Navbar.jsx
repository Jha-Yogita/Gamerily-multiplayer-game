import { Link } from 'react-router-dom';
import "./Navbar.css";
import { useState } from 'react';

function Navbar({ currUser }) {
  return (
    <nav className="navbar navbar-expand-md gamerily-navbar sticky-top shadow-sm">
      <div className="container-fluid">
        <Link className="navbar-brand" to="/">
       
          <span className="brand-text">Gamerily</span>
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarNav">
          <div className="navbar-nav">
            <Link className="nav-link" to="/">Home</Link>
            <Link className="nav-link" to="/genres">Genres</Link>
            
          </div>

          <div className="navbar-nav ms-auto align-items-center">
            {currUser ? (
              <div className="btn-group">
                <button
                  className="btn btn-sm user-btn dropdown-toggle"
                  type="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <i className="fa-solid fa-user"></i>
                </button>
                <ul className="dropdown-menu dropdown-menu-end">
                  <li><Link className="dropdown-item" to="/myprofile">My Profile</Link></li>
                  <li><hr className="dropdown-divider" /></li>
                  <li><Link className="dropdown-item" to="/logout"><b>Logout</b></Link></li>
                </ul>
              </div>
            ) : (
              <>
                <Link className="nav-link auth-link" to="/signup"><b>Signup</b></Link>
                <Link className="nav-link auth-link" to="/login"><b>Login</b></Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;