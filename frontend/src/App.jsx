import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useState } from 'react'
import './App.css'
import Navbar from './components/Navbar.jsx'
import HomePage from './components/HomePage.jsx'
import Footer from './components/Footer.jsx'
import Genres from './components/Genres.jsx';
import Login from "./components/Login";
import Signup from "./components/Signup.jsx";
import Logout from './components/Logout.jsx'
import PlayScreen from './components/PlayScreen.jsx'
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ModeSelect from "./components/ModeSelect.jsx";
import Profile from './components/Profile.jsx'
import Result from './components/Result.jsx'

function App() {
  const [user, setUser] = useState(null);
  
  const handleLoginSuccess = (userData) => {
    setUser(userData); 
  }
  
  const handleSignupSuccess = () => {
    console.log("Signup succeeded");
  };
  
  const handleLogoutSuccess = () => {
    setUser(null);
    console.log("Logged out successfully");
  }
  
  const handleUpdateUser = (updatedUser) => {
    setUser(updatedUser); 
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };
  
  return (
    <>
      <Router>
        <Navbar currUser={user} />
        <ToastContainer />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/genres" element={<Genres />} />
          <Route path="/login" element={<Login onLoginSuccess={handleLoginSuccess}/>} />
          <Route path="/signup" element={<Signup onSignupSuccess={handleSignupSuccess}/>} />
          <Route path='/logout' element={<Logout onLogout={handleLogoutSuccess}/>} />
          <Route path="/play/:genre/:index" element={<PlayScreen />} />
          <Route path="/result" element={<Result />} />
          <Route path="/select/:genre" element={<ModeSelect user={user} />} />
          <Route 
            path="/myprofile" 
            element={
              <Profile 
                user={user} 
                onLogout={handleLogoutSuccess} 
                onUpdateUser={handleUpdateUser} 
              />
            } 
          />
        </Routes>
        <Footer />
      </Router>
    </>
  )
}

export default App