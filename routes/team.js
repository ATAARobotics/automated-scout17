var express = require('express');
var router = express.Router();
var Team = require('../model/team.js');
var TeamEvent = require('../model/teamevent.js');

router.get('/:team', function(req, res, next) {
  var d = new Date();
  Team.findTeam(req.params.team, req.query.refresh).then(function(team) {
    if (req.query.raw) { return res.json(team); }
    res.render('team', team);
  }).catch((err) => { next(err) });
});

router.get('/:team/:event', function(req, res, next) {
  var d = new Date();
  TeamEvent.findTeamEvent(req.params.team, req.params.event, req.query.refresh)
  .then(function(teamevent) {
    if (req.query.raw) { return res.json(teamevent); }
    res.render('teamevent', teamevent);
  }).catch((err) => { next(err) });
});

module.exports = router;
