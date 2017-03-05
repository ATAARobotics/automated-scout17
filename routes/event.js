var express = require('express');
var router = express.Router();
var Event = require('../model/event.js');
var Predict = require('../model/predict.js');

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

module.exports = router;
