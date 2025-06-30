const express = require("express");
const router = express.Router();
const notifyController = require("../controllers/notifyController");


router.post("/", notifyController.sendNotification);

module.exports = router;
