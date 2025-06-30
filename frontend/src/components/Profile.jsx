import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Profile.css";
import { toast } from 'react-toastify';

function Profile({ user, onLogout, onUpdateUser }) {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: user.username,
    email: user.email
  });
  const [isDeleting, setIsDeleting] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    const res = await axios.put(`http://localhost:8080/user/${user._id}`, formData, {
      withCredentials: true
    });

    if (res.data?.user) {
      onUpdateUser(res.data.user);
      toast.success("Profile updated successfully!");
    } else {
      toast.success("Profile updated!"); // fallback success
    }

    setIsEditing(false);
  } catch (err) {
    console.error("Update failed:", err);
    toast.error(err.response?.data?.msg || "Update failed. Please try again.");
  }
};


  const handleDelete = async () => {
  if (!window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
    return;
  }

  setIsDeleting(true);
  try {
    const res = await axios.delete(`http://localhost:8080/user/${user._id}`, {
      withCredentials: true
    });

    toast.success(res.data?.msg || "Account deleted successfully");

    onLogout();
    navigate("/");
  } catch (err) {
    console.error("Delete failed:", err);
    toast.error(err.response?.data?.msg || "Delete failed. Please try again.");
    setIsDeleting(false);
  }
};


  return (
    <div className="profile-container">
      <div className="profile-card">
        <div className="profile-image">
          <div className="profile-image-placeholder">
            {user.username.charAt(0).toUpperCase()}
          </div>
        </div>
        <div className="profile-info">
          {isEditing ? (
            <form onSubmit={handleSubmit} className="profile-form">
              <div className="input-group">
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="profile-input"
                  required
                />
              </div>
              <div className="input-group">
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="profile-input"
                  required
                />
              </div>
              <div className="profile-actions">
                <button type="submit" className="profile-button primary">
                  Save Changes
                </button>
                <button 
                  type="button" 
                  className="profile-button secondary"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <>
              <h2>Welcome, {user.username}</h2>
              <p><strong>Email:</strong> {user.email}</p>
              <div className="profile-actions">
                <button 
                  onClick={() => setIsEditing(true)}
                  className="profile-button primary"
                >
                  Edit Profile
                </button>
                <button 
                  onClick={handleDelete}
                  className="profile-button danger"
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Deleting...' : 'Delete Account'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Profile;