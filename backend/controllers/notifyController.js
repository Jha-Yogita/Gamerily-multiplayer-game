const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

exports.sendNotification = async (req, res) => {
  const { email } = req.body;
  if (!email || !email.includes("@")) {
    return res.status(400).json({ message: "Invalid email address" });
  }

  const mailOptions = {
    from: "whythiscolaveri04@gmail.com",
    to: email,
    subject: "Subscription Confirmation",
    text: "You are now subscribed and will receive updates. Thanks for joining us!",
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).send("Confirmation email sent");
  } catch (err) {
    console.error("Email error:", err);
    res.status(500).send("Failed to send email");
  }
};
