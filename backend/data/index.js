const fs = require("fs");
const csv = require("csv-parser");
const mongoose = require("mongoose");
const JeopardyQuestion = require("./import.js");

mongoose.connect("mongodb://127.0.0.1:27017/Game");

fs.createReadStream("JEOPARDY_CSV.csv")
  .pipe(csv())
  .on("data", async (row) => {
    const cleanRow = {
      showNumber: row["Show Number"],
      airDate: row[" Air Date"],
      round: row[" Round"],
      category: row[" Category"].trim(),
      value: row[" Value"],
      question: row[" Question"],
      answer: row[" Answer"]
    };

    try {
      await JeopardyQuestion.create(cleanRow);
    } catch (e) {
      console.error("Insert error:", e.message);
    }
  })
  .on("end", () => {
    console.log("CSV import completed");
    mongoose.disconnect();
  });
