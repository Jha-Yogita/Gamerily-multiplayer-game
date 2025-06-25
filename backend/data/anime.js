const mongoose = require('mongoose');
const fs = require('fs');

mongoose.connect('mongodb://localhost:27017/Game', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const jeopardyQuestionSchema = new mongoose.Schema({
  showNumber: String,
  airDate: String,
  round: String,
  category: String,
  value: String,
  question: String,
  answer: String,
});

const JeopardyQuestion = mongoose.model('jeopardyquestions', jeopardyQuestionSchema);

async function insertHinduismQuestions() {
  try {
    const data = fs.readFileSync('./religion.json', 'utf-8');
    const questions = JSON.parse(data);
    await JeopardyQuestion.insertMany(questions);
    console.log(`Inserted ${questions.length} Hinduism questions.`);
    mongoose.disconnect();
  } catch (error) {
    console.error('Error inserting questions:', error.message);
    mongoose.disconnect();
  }
}

insertHinduismQuestions();