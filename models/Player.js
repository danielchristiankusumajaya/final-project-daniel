const mongoose = require('mongoose');


const playerSchema = new mongoose.Schema({
  teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
  name: { type: String, required: true },
  photo: String,
  height: String,
  weight: String,
  nationality: String,
  ig: String,
  position: {
    type: String,
    enum: ['Point Guard', 'Shooting Guard', 'Center', 'Power Forward', 'Small Forward']
  },
  points: { type: Number, default: 0 },
  assists: { type: Number, default: 0 },
  rebounds: { type: Number, default: 0 },
  blocks: { type: Number, default: 0 },
  steals: { type: Number, default: 0 }
});


module.exports = mongoose.model('Player', playerSchema);


