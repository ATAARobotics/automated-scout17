var Stats = require('./stats.js');
var Matches = require('./matches.js')
var Event = require('./event.js')

function getPredictions(event_code) {
  if (event_code.startsWith("2017")) { event_code = event_code.substr(4); }

  function getRanks(pred) {
    pred = pred || {};
    return new Promise((resolve, reject) => {
      Stats.findStats(event_code).then(function(stats) {
        pred.stats = stats;

        Matches.findMatches(event_code).then(function(matches) {
          pred.matches = [];
          matches.list.forEach(function(match) {
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

            pred.matches.push({
              match: match,
              opr: {
                red: redOPR, blue: blueOPR
              },
              ccwm: {
                red: redCCWM, blue: blueCCWM
              }
            });
          });

          var opr_was_correct = 0,
              ccwm_was_correct = 0,
              total_matches = 0;
          pred.matches.filter((m) => m.match.hasOccured).forEach((match) => {
            total_matches++;
            if (match.match.winner === 'red') {
              if (match.opr.red > match.opr.blue) {
                opr_was_correct++;
              }
              if (match.ccwm.red > match.ccwm.blue) {
                ccwm_was_correct++;
              }
            } else if (match.match.winner === 'blue') {
              if (match.opr.blue > match.opr.red) {
                opr_was_correct++;
              }
              if (match.ccwm.blue > match.ccwm.red) {
                ccwm_was_correct++;
              }
            }
          });

          pred.opr_accuracy = opr_was_correct / total_matches;
          pred.ccwm_accuracy = ccwm_was_correct / total_matches;

          pred.rankpoints = {};
          for (var team in stats.rankpoints) {
            pred.rankpoints[team] = stats.rankpoints[team];
            pred.matches.filter((m) => !m.hasOccured).forEach((match) => {
            });
          }

          console.log(pred.rankpoints);
          resolve(pred);
        });
      }, function(err) { reject(err); });
    });
  }

  return getRanks();
}

module.exports = {getPredictions: getPredictions};
