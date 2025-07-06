import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useState,useEffect } from 'react'
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
import axios from "axios";
import { toast } from "react-toastify";


function App() {
  const [user, setUser] = useState(() => {
  const storedUser = localStorage.getItem("user");
  return storedUser ? JSON.parse(storedUser) : null;
});
  const baseUrl = import.meta.env.VITE_API_URL;
  
   useEffect(() => {
    const fetchCurrentUser = async () => {
  try {
    const res = await axios.get(`${baseUrl}/auth/current_user`,{ withCredentials: true });
    setUser(res.data.user);
  } catch (err) {
    console.error("Error checking user session:", err);
    setUser(null);
    toast.info("Session expired. Please log in again.");
  }
};

    fetchCurrentUser();
  }, []);
  
  const handleLoginSuccess = (userData) => {
    setUser(userData); 
  }
  
 const handleSignupSuccess = async () => {
  try {
    await new Promise(resolve => setTimeout(resolve, 500)); 
    const res = await axios.get(`${baseUrl}/auth/current_user`, { withCredentials: true });
    setUser(res.data.user);
    localStorage.setItem('user', JSON.stringify(res.data.user));
  } catch (err) {
    console.error("Error fetching user:", err);
  }
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
        <Navbar currUser={user} key={user?._id || "guest"} />

        <ToastContainer />
        <Routes>
          <Route path="/" element={<HomePage currUser={user}/>} />
          <Route path="/genres" element={<Genres />} />
          <Route path="/login" element={<Login onLoginSuccess={handleLoginSuccess}/>} />
          <Route path="/signup" element={<Signup onSignupSuccess={handleSignupSuccess}/>} />
          <Route path='/logout' element={<Logout onLogout={handleLogoutSuccess}/>} />
          <Route path="/play/:genre" element={<PlayScreen />} />
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