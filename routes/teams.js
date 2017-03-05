var express = require('express');
var router = express.Router();
var bluealliance = require('thebluealliance');
var tba = new bluealliance('node-thebluealliance','TBA v2 API','1.1.1');
var Team = require('../model/team.js');

router.get('/:team', function(req, res, next) {
  Team.findTeam(req.params.team).then(function(team) {
    res.render('teams', { title: team.name, team: team });
  });
});

module.exports = router;
