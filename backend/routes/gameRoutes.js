const express = require("express");
const router = express.Router();
const gameController = require("../controllers/gameController");

router.get("/genres", gameController.getGenres);
router.get("/play/:genre", gameController.playGenre);
router.post("/submit-results", gameController.submitResults);
router.post("/check-results", gameController.checkResults);

module.exports = router;
