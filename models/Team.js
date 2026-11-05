const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  name: { type: String, required: true },
  logo: { type: String, required: true },
  description: String,
  homebase: String,
  ig: String,
  web: String,
  email: String,
  totalPoints: { type: Number, default: 0 },
  headCoach: String,
  assistantCoach: String,
  manager: String
}, { timestamps: true });

module.exports = mongoose.model('Team', teamSchema);