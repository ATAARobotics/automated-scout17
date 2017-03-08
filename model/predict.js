var NodeCache = require("node-cache");
var cache = new NodeCache({ stdTTL: 125 });
var Stats = require('./stats.js');
var Matches = require('./matches.js')
var Event = require('./event.js')

function getPredictions(event_code, refresh) {
  if (event_code.startsWith("2017")) { event_code = event_code.substr(4); }

  function getStats(pred) {
    pred = pred || {};
    return new Promise((resolve, reject) => {
      Stats.findStats(event_code, refresh).then(function(stats) {
        pred.stats = stats;
        pred.event_code = event_code;

        resolve(pred);
      }, function(err) { reject(err); });
    });
  }

  function getPredictions(pred) {
    pred = pred || {};
    return new Promise((resolve, reject) => {
      var statsPromise = Stats.findStats(event_code, refresh);
      var matchesPromise = Matches.findMatches(event_code, refresh);

      function getMatchStats(matches, stats) {
        var pred_matches = [];
        matches.forEach(function(match) {
          var redOPR = 0, blueOPR = 0
              redCCWM = 0, blueCCWM = 0;
          match.alliances.red.forEach((team) => {
            if (stats.opr.total[team]) {
              redOPR += stats.opr.total[team];
            }
            if (stats.ccwm[team]) {
              redCCWM += stats.ccwm[team];
            }
          });
          match.alliances.blue.forEach((team) => {
            if (stats.opr.total[team]) {
              blueOPR += stats.opr.total[team];
            }
            if (stats.ccwm[team]) {
              blueCCWM += stats.ccwm[team];
            }
          });

          pred_matches.push({
            info: match,
            opr: {
              red: redOPR, blue: blueOPR, winner: redOPR > blueOPR ? 'red': 'blue'
            },
            ccwm: {
              red: redCCWM, blue: blueCCWM, winner: redCCWM > blueCCWM ? 'red': 'blue'
            }
          });
        });

        return pred_matches;
      }
      statsPromise.then(function(stats) {
        matchesPromise.then(function(matches) {
          pred.matches = getMatchStats(matches.list, stats);

          var opr_was_correct = 0,
              ccwm_was_correct = 0,
              total_matches = 0;
          pred.matches.filter((m) => m.info.hasOccured).forEach((match) => {
            total_matches++;
            if (match.info.winner === 'red') {
              if (match.opr.red > match.opr.blue) {
                opr_was_correct++;
              }
              if (match.ccwm.red > match.ccwm.blue) {
                ccwm_was_correct++;
              }
            } else if (match.info.winner === 'blue') {
              if (match.opr.blue > match.opr.red) {
                opr_was_correct++;
              }
              if (match.ccwm.blue > match.ccwm.red) {
                ccwm_was_correct++;
              }
            }
          });

          pred.opr_accuracy = (100 * opr_was_correct / total_matches).toFixed(2);
          pred.ccwm_accuracy = (100 * ccwm_was_correct / total_matches).toFixed(2);
          pred.best_predictor = (pred.opr_accuracy > pred.ccwm_accuracy) ? "opr" : "ccwm";
          pred.accuracy = Math.max(pred.opr_accuracy, pred.ccwm_accuracy);

          pred.rankpoints = JSON.parse(JSON.stringify(stats.rankpoints));
          pred.matches.filter((m) => !m.info.hasOccured).forEach((match) => {
            if (pred.opr_accuracy > pred.ccwm_accuracy) {
              if (match.opr.red > match.opr.blue) {
                pred.rankpoints[match.info.alliances.red[0]] += 2;
                pred.rankpoints[match.info.alliances.red[1]] += 2;
                pred.rankpoints[match.info.alliances.red[2]] += 2;
              } else if (match.opr.blue > match.opr.red) {
                pred.rankpoints[match.info.alliances.blue[0]] += 2;
                pred.rankpoints[match.info.alliances.blue[1]] += 2;
                pred.rankpoints[match.info.alliances.blue[2]] += 2;
              }
            } else {
              if (match.ccwm.red > match.ccwm.blue) {
                pred.rankpoints[match.info.alliances.red[0]] += 2;
                pred.rankpoints[match.info.alliances.red[1]] += 2;
                pred.rankpoints[match.info.alliances.red[2]] += 2;
              } else if (match.ccwm.blue > match.ccwm.red) {
                pred.rankpoints[match.info.alliances.blue[0]] += 2;
                pred.rankpoints[match.info.alliances.blue[1]] += 2;
                pred.rankpoints[match.info.alliances.blue[2]] += 2;
              }
            }
          });

          resolve(pred);
        });
      }, function(err) { reject(err); });
    });
  }

  return Promise.resolve()
    .then(getStats, (err) => { throw err })
    .then(getPredictions, (err) => { throw err });
}

function findPredictions(event_code, refresh) {
  return new Promise((resolve, reject) => {
    var data = cache.get(event_code);
    if (data === undefined || refresh) {
      getPredictions(event_code, refresh).then(function(data) {
        cache.set(event_code, data);
        resolve(data);
      }, function(err) {
        reject(err);
      })
    } else {
      resolve(data);
    }
  });
}

module.exports = {findPredictions: findPredictions};
