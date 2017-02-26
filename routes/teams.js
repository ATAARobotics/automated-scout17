var express = require('express');
var router = express.Router();
var bluealliance = require('thebluealliance');
var tba = new bluealliance('node-thebluealliance','TBA v2 API','1.1.1');

router.get('/', function(req, res, next) {
  function teamList(err, teams) {
    if (err) {
      console.log(err);
      return next(err);
    }

    console.log(teams);
    res.render('teams', { title: 'Teams', teams: teams });
  }

  tba.getTeamList('casb', teamList);
});

module.exports = router;
