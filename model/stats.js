var initTBA = require('thebluealliance');
var tba = new initTBA('node-thebluealliance','TBA v2 API','1.1.1');
var numeric = require('numeric');
var NodeCache = require('node-cache');
var cache = new NodeCache();
var Matches = require('./matches.js');
var Event = require('./event.js');

function opr(teams, matches, component_cb) {
  matches = matches.list.filter((m) => m.hasOccured);
  teams = teams.filter(function(team) {
    for (var i = 0; i < matches.length; i++) {
      if (matches[i].alliances.red.indexOf(team) !== -1
       || matches[i].alliances.blue.indexOf(team) !== -1) {
        return true;
      }
    }

    return false;
  });

  function played_arr(teams, matches) {
    var played = new Array(teams.length);
    for (var i = 0; i < teams.length; i++) {
        played[i] = new Array(teams.length);
        for (var x = 0; x < teams.length; x++) {
            played[i][x] = 0; // 2d matrix
        }
    }

    matches.forEach(function(match) {
      var red = match.alliances.red,
          blue = match.alliances.blue;
      for (var x = 0; x < red.length; x++) {
        for (var y = 0; y < red.length; y++) {
          played[teams.indexOf(red[x])][teams.indexOf(red[y])]++;
        }
      }
      for (var x = 0; x < blue.length; x++) {
        for (var y = 0; y < blue.length; y++) {
          played[teams.indexOf(blue[x])][teams.indexOf(blue[y])]++;
        }
      }
    });

    return played;
  }

  var played = played_arr(teams, matches);
  component_cb = component_cb || function(score) { return score.points.total; };

  var stat = teams.map(function(team) {
    return matches.reduce(function(sum, match) {
      if (match.alliances.red.indexOf(team) !== -1) {
        return sum + component_cb(match.score.red);
      } else if (match.alliances.blue.indexOf(team) !== -1) {
        return sum + component_cb(match.score.blue);
      } else {
        return sum;
      }
    }, 0);
  });

  var solution = numeric.solve(played, stat);

  var oprs = {};
  teams.forEach(function(team, i) {
    oprs[team] = solution[i];
  });
  return oprs;
}

function getStats(event_code) {
  if (event_code.startsWith("2017")) { event_code = event_code.substr(4); }

  function getOPRs(stats) {
    stats = stats || {};
    stats.opr = {};
    return new Promise((resolve, reject) => {
      let eventPromise = Event.findEvent(event_code);
      let matchPromise = Matches.findMatches(event_code);

      matchPromise.then(function(matches) {
        eventPromise.then(function(event) {
          stats.opr.total = opr(event.teams, matches, function(score) {
            return score.points.total;
          });
          stats.opr.teleop = opr(event.teams, matches, function(score) {
            return score.points.teleop_points;
          });
          stats.opr.auto = opr(event.teams, matches, function(score) {
            return score.points.auto_points;
          });
          stats.opr.foul = opr(event.teams, matches, function(score) {
            return score.points.foul_points;
          });
          stats.opr.mobility = opr(event.teams, matches, function(score) {
            return score.points.mobility;
          });
          stats.opr.climb = opr(event.teams, matches, function(score) {
            return score.points.climb;
          });
          stats.opr.rotor = {
            auto: opr(event.teams, matches, function(score) {
              return score.points.rotor.auto;
            }),
            telop: opr(event.teams, matches, function(score) {
              return score.points.rotor.teleop;
            })
          };
          stats.opr.fuel = {
            auto: opr(event.teams, matches, function(score) {
              return score.points.fuel.auto;
            }),
            telop: opr(event.teams, matches, function(score) {
              return score.points.fuel.teleop;
            })
          };

          resolve(stats);
        }, function(err) { reject(err); });
      }, function(err) { reject(err); });
    });
  }

  function getTBAStats(stats) {
    stats = stats || {};
    stats.dpr = {};
    stats.ccwm = {};
    return new Promise((resolve, reject) => {
      tba.getEventStats(event_code, 2017, function(err, data) {
        if (err) { reject(err); reject(err); }

        for (ccwm in data.ccwms) {
          stats.ccwm['frc' + ccwm] = data.ccwms[ccwm];
        }

        for (dpr in data.dprs) {
          stats.dpr['frc' + dpr] = data.ccwms[dpr];
        }

        resolve(stats);
      });
    });
  }

  function getRanks(stats) {
    stats = stats || {};
    return new Promise((resolve, reject) => {
      Matches.findMatches(event_code).then(function(matches) {
        var team_rankpoints = {};
        matches.list.filter((m) => m.hasOccured).forEach(function(match) {
          match.alliances.red.forEach(function(team) {
            team_rankpoints[team] = team_rankpoints[team] || 0;
            team_rankpoints[team] += match.score.red.rankpoints;
          });
          match.alliances.blue.forEach(function(team) {
            team_rankpoints[team] = team_rankpoints[team] || 0;
            team_rankpoints[team] += match.score.blue.rankpoints;
          });
        });

        stats.rankpoints = team_rankpoints;
        resolve(stats);
      }, function(err) { reject(err); });
    });
  }

  return getOPRs().then(getTBAStats).then(getRanks);
}

function findStats(event_code, refresh) {
  return new Promise((resolve, reject) => {
    var data = cache.get(event_code);
    if (data === undefined || refresh) {
      getStats(event_code).then(function(data) {
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

module.exports = {getStats: getStats,
                  findStats: findStats};
