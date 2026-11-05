require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const methodOverride = require('method-override');
const path = require("path");

const Team = require('./models/Team');
const Player = require('./models/Player');
const News = require('./models/News');
const Game = require('./models/Game');

const app = express();

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err));

app.set('view engine', 'ejs');
app.set("views", path.join(__dirname, "views"));

app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));

// ==========================================
// ROUTES FRONTEND
// ==========================================
app.get('/', async (req, res) => {
  try {
    const news = await News.find().sort({ createdAt: -1 }).limit(4);
    
    const topTeams = await Team.find().sort({ totalPoints: -1 }).limit(5);
    
    res.render('index', { news, topTeams });
  } catch (err) { res.send(err.message); }
});

app.get('/teams', async (req, res) => {
  try {
    const teams = await Team.find();
    
    res.render('teams', { teams });
  } catch (err) { res.send(err.message); }
});

app.get('/teams/:id', async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    
    const players = await Player.find({ teamId: team._id });
    
    res.render('detail-teams', { team, players });
  } catch (err) { res.send(err.message); }
});

app.get('/leaderboard', async (req, res) => {
  try {
    const standings = await Team.find().sort({ totalPoints: -1 });
    
    const allPlayers = await Player.find().populate('teamId');
    
    const topPoints = allPlayers.sort((a, b) => b.points - a.points).slice(0, 3);
    
    res.render('leaderboard', { standings, topPoints });
  } catch (err) { res.send(err.message); }
});

app.get('/games', async (req, res) => {
  try {
    const games = await Game.find().populate('teamA').populate('teamB');
    
    res.render('games', { games });
  } catch (err) { res.send(err.message); }
});

app.get('/tickets', (req, res) => {
  res.render('tickets');
});

// ==========================================
// ROUTES ADMIN (HALAMAN & PROSES)
// ==========================================
app.get('/admin-manage-data', async (req, res) => {
  try {
    const teams = await Team.find();
    const players = await Player.find().populate('teamId');
    const news = await News.find();
    const games = await Game.find().populate('teamA').populate('teamB');
    
    res.render('admin', { teams, players, news, games });
  } catch (err) { res.send(err.message); }
});

app.post('/admin/add-team', async (req, res) => {
  try {
    await Team.create(req.body);
    
    res.redirect('/admin-manage-data');
  } catch (err) { res.send(err.message); }
});

app.post('/admin/add-player', async (req, res) => {
  try {
    await Player.create(req.body);
    
    res.redirect('/admin-manage-data');
  } catch (err) { res.send(err.message); }
});

app.post('/admin/add-game', async (req, res) => {
  try {
    const { teamA, teamB, scoreA, scoreB, date, location } = req.body;
    
    await Game.create({ teamA, teamB, scoreA, scoreB, date, location });

    if (Number(scoreA) > Number(scoreB)) { await Team.findByIdAndUpdate(teamA,
       { $inc: { totalPoints: 10 } }); }
    
    else if (Number(scoreB) > Number(scoreA)) { await Team.findByIdAndUpdate(teamB, { $inc: { totalPoints: 10 } }); }

    res.redirect('/admin-manage-data');
  } catch (err) { res.send(err.message); }
});

app.post('/admin/add-news', async (req, res) => {
  try {
    await News.create(req.body);
    
    res.redirect('/admin-manage-data');
  } catch (err) { res.send(err.message); }
});

app.delete('/admin/delete-team/:id', async (req, res) => {
  await Team.findByIdAndDelete(req.params.id);
  await Player.deleteMany({ teamId: req.params.id });
  await Game.deleteMany({ $or: [{ teamA: req.params.id }, { teamB: req.params.id }] });
  res.redirect('/admin-manage-data');
});
app.delete('/admin/delete-player/:id', async (req, res) => {
  await Player.findByIdAndDelete(req.params.id);
  res.redirect('/admin-manage-data');
});
app.delete('/admin/delete-news/:id', async (req, res) => {
  await News.findByIdAndDelete(req.params.id);
  res.redirect('/admin-manage-data');
});
app.delete('/admin/delete-game/:id', async (req, res) => {
  await Game.findByIdAndDelete(req.params.id);
  res.redirect('/admin-manage-data');
});

const PORT = process.env.PORT || 3000;
  if (require.main === module) {
    app._router(PORT), () => console.log(`Server running on port ${PORT}`);
  }
module.exports = app;