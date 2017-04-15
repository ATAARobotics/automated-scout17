var express = require('express');
var router = express.Router();
var Event = require('../model/event.js');
var Predict = require('../model/predict.js');
var Stats = require('../model/stats.js');
var Overview = require('../model/overview.js');

router.get('/:event', function(req, res, next) {
  Event.findEvent(req.params.event, req.query.refresh).then(function(event) {
    Predict.findPredictions(req.params.event, req.query.refresh).then(function(prediction) {
      var model = { event: event, prediction: prediction };
      if (req.query.raw) { return res.json(model); }
      res.render('event', model);
    }).catch((err) => { next(err) });
  }).catch((err) => { next(err) });
});

router.get('/:event/compare', function(req, res, next) {
  Predict.findPredictions(req.params.event, req.query.refresh).then(function(prediction) {
    if (req.query.raw) { return res.json(prediction); }
    res.render('compare', prediction);
  }).catch((err) => { next(err) });
});

router.get('/:event/analyze', function(req, res, next) {
  Stats.findStats(req.params.event, req.query.refresh).then(function(stats) {
    var model = { event_key: req.params.event, stats: stats, teams: ['frc' + req.query.team1, 'frc' + req.query.team2, 'frc' + req.query.team3]};
    if (req.query.raw) { return res.json(model); }
    res.render('analyze', model);
  });
});

router.get('/:event/overview', function(req, res, next) {
  Overview.findOverview(req.params.event, req.query.refresh).then(function(overview) {
    return res.json(overview);
  });
});

module.exports = router;
