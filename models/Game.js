const mongoose = require('mongoose');


const gameSchema = new mongoose.Schema({
  teamA: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
  teamB: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
  scoreA: { type: Number, required: true },
  scoreB: { type: Number, required: true },
  date: { type: String, required: true },
  location: { type: String, required: true }
}, { timestamps: true });


module.exports = mongoose.model('Game', gameSchema);