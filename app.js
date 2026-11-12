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


app.get('/', async (req, res) => {
  try {
    const news = await News.find().sort({ createdAt: -1 }).limit(4);
    const topTeams = await Team.find().sort({ totalPoints: -1 }).limit(5);
    res.render('index', { news, topTeams });
  } catch (err) {
    res.send(err.message);
  }
});


app.get('/teams', async (req, res) => {
  try {
    const teams = await Team.find().sort({ totalPoints: -1 });
    res.render('teams', { teams });
  } catch (err) {
    res.send(err.message);
  }
});


app.get('/teams/:id', async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    const players = await Player.find({ teamId: team._id });
   
    const latestMatch = await Game.findOne({
      $or: [{ teamA: team._id }, { teamB: team._id }]
    }).sort({ createdAt: -1 }).populate('teamA').populate('teamB');


    res.render('detail-teams', { team, players, latestMatch });
  } catch (err) {
    res.send(err.message);
  }
});


app.get('/leaderboard', async (req, res) => {
  try {
    let standings = await Team.find().sort({ totalPoints: -1 }).lean();
   
    for (let i = 0; i < standings.length; i++) {
      const gamesCount = await Game.countDocuments({
        $or: [{ teamA: standings[i]._id }, { teamB: standings[i]._id }]
      });
      standings[i].gamesPlayed = gamesCount;
    }


    const allPlayers = await Player.find().populate('teamId');


    const getTopStats = (positions, statName) => {
      return allPlayers
        .filter(p => positions.includes(p.position))
        .sort((a, b) => b[statName] - a[statName])
        .slice(0, 3);
    };


    const topPoints = getTopStats(['Point Guard', 'Shooting Guard', 'Power Forward', 'Small Forward'], 'points');
    const topAssists = getTopStats(['Point Guard', 'Shooting Guard', 'Small Forward'], 'assists');
    const topRebounds = getTopStats(['Shooting Guard', 'Center', 'Power Forward', 'Small Forward'], 'rebounds');
    const topBlocks = getTopStats(['Center', 'Power Forward', 'Small Forward'], 'blocks');
    const topSteals = getTopStats(['Point Guard', 'Small Forward'], 'steals');


    res.render('leaderboard', { standings, topPoints, topAssists, topRebounds, topBlocks, topSteals });
  } catch (err) {
    res.send(err.message);
  }
});


app.get('/games', async (req, res) => {
  try {
    const games = await Game.find().sort({ createdAt: -1 }).populate('teamA').populate('teamB');
    res.render('games', { games });
  } catch (err) {
    res.send(err.message);
  }
});


app.get('/tickets', (req, res) => {
  res.render('tickets');
});


app.get('/admin-manage-data', async (req, res) => {
  try {
    const teams = await Team.find().sort({ totalPoints: -1 });
    const players = await Player.find().populate('teamId');
    const news = await News.find();
    const games = await Game.find().populate('teamA').populate('teamB');
    res.render('admin', { teams, players, news, games });
  } catch (err) {
    res.send(err.message);
  }
});


app.post('/admin/add-team', async (req, res) => {
  await Team.create(req.body);
  res.redirect('/admin-manage-data');
});


app.post('/admin/add-player', async (req, res) => {
  await Player.create(req.body);
  res.redirect('/admin-manage-data');
});


app.post('/admin/add-news', async (req, res) => {
  await News.create(req.body);
  res.redirect('/admin-manage-data');
});


app.post('/admin/add-game', async (req, res) => {
  try {
    const { teamA, teamB, scoreA, scoreB, date, location } = req.body;
   
    await Game.create({ teamA, teamB, scoreA, scoreB, date, location });


    if (Number(scoreA) > Number(scoreB)) {
      await Team.findByIdAndUpdate(teamA, { $inc: { totalPoints: 10 } });
    } else if (Number(scoreB) > Number(scoreA)) {
      await Team.findByIdAndUpdate(teamB, { $inc: { totalPoints: 10 } });
    }


    res.redirect('/admin-manage-data');
  } catch (err) {
    res.send(err.message);
  }
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
  try {
    const game = await Game.findById(req.params.id);
   
    if (game) {
      if (Number(game.scoreA) > Number(game.scoreB)) {
        await Team.findByIdAndUpdate(game.teamA, { $inc: { totalPoints: -10 } });
      } else if (Number(game.scoreB) > Number(game.scoreA)) {
        await Team.findByIdAndUpdate(game.teamB, { $inc: { totalPoints: -10 } });
      }
      await Game.findByIdAndDelete(req.params.id);
    }
    res.redirect('/admin-manage-data');
  } catch (err) {
    res.send(err.message);
  }
});


const PORT = process.env.PORT || 3000;
  if (require.main === module) {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  }
module.exports = app;