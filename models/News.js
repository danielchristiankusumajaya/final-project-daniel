const mongoose = require('mongoose');


const newsSchema = new mongoose.Schema({
  date: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  image: { type: String, required: true }
}, { timestamps: true });


module.exports = mongoose.model('News', newsSchema);