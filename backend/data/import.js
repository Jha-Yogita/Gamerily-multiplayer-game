const mongoose = require("mongoose");

const jeopardyQuestionSchema = new mongoose.Schema({
    showNumber: String,
    airDate: String,
    round: String,
    category: String,
    value: String,
    question: String,
    answer: String
});

module.exports = mongoose.model("JeopardyQuestion", jeopardyQuestionSchema);
