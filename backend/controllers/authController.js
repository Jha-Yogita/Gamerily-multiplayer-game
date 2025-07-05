const User = require("../models/User");
const passport = require("passport");

exports.signup = async (req, res, next) => {
  const { username, email, password } = req.body;
  try {
    const newUser = new User({ email, username });
    User.register(newUser, password, (err, user) => {
      if (err) return res.status(400).json({ msg: err.message });

      req.login(user, err => {
        if (err) return next(err);
        res.json({
          msg: "Signup & login successful",
          user: { _id: user._id, username: user.username },
          sessionId: req.sessionID
        });
      });
    });
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

exports.login = (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) return next(err);
    if (!user) return res.status(401).json({ msg: info?.message || "Invalid credentials" });
    req.login(user, err => {
      if (err) return next(err);
      return res.json({ user: req.user });
    });
  })(req, res, next);
};

exports.logout = (req, res, next) => {
  req.logout(err => {
    if (err) return next(err);
    res.json({ msg: "Logged out" });
  });
};

exports.currentUser = (req, res) => {
  if (req.user) {
    res.json({ 
      user: req.user,
      sessionId: req.sessionID  
    });
  } else {
    res.status(401).json({ 
      msg: "Not logged in",
      sessionId: req.sessionID  
    });
  }
};
