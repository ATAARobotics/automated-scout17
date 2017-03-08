var initTBA = require('thebluealliance');
var tba = new initTBA('node-thebluealliance','TBA v2 API','1.1.1');
var numeric = require('numeric');
var NodeCache = require('node-cache');
var cache = new NodeCache({ stdTTL: 125 });
var Matches = require('./matches.js');
var Event = require('./event.js');

function opr(teams, matches, component_cb) {
  matches = matches.list.filter((m) => m.hasOccured);
  teams = teams.filter(function(team) {
    for (var i = 0; i < matches.length; i++) {
      // filter teams that havent played matches
      if (matches[i].alliances.red.indexOf(team) !== -1
       || matches[i].alliances.blue.indexOf(team) !== -1) {
        return true;
      }
    }

    return false;
  });

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

  component_cb = component_cb || function(score) { return score.points.total; };

  var points = teams.map(function(team) {
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

  var solution = numeric.solve(played, points);

  var oprs = {};
  teams.forEach(function(team, i) {
    oprs[team] = solution[i];
  });
  return oprs;
}

function getStats(event_code, refresh) {
  if (event_code.startsWith("2017")) { event_code = event_code.substr(4); }

  function getOPRs(stats) {
    stats = stats || {};
    return new Promise((resolve, reject) => {
      let eventPromise = Event.findEvent(event_code, refresh);
      let matchPromise = Matches.findMatches(event_code, refresh);

      matchPromise.then(function(matches) {
        eventPromise.then(function(event) {
          stats.opr = {
            total: opr(event.teams, matches, (score) => score.points.total),
            teleop: opr(event.teams, matches, (score) => score.points.teleop_points),
            auto: opr(event.teams, matches, (score) => score.points.auto_points),
            foul: opr(event.teams, matches, (score) => score.points.foul_points),
            climb: opr(event.teams, matches, (score) => score.points.climb),
            mobility: opr(event.teams, matches, (score) => score.points.mobility),
            rotor: {
              auto: opr(event.teams, matches, (score) => score.points.rotor.auto),
              teleop: opr(event.teams, matches, (score) => score.points.rotor.teleop)
            },
            fuel: {
              auto: opr(event.teams, matches, (score) => score.points.fuel.auto),
              teleop: opr(event.teams, matches, (score) => score.points.fuel.teleop)
            }
          };

          resolve(stats);
        }, function(err) { reject(err); });
      }, function(err) { reject(err); });
    }).then(function(stats) {
      return new Promise((resolve, reject) => {
        function sort(oprs) {
          return Object.keys(oprs).sort((a, b) => oprs[b] - oprs[a]);
        }

        stats.ranks = stats.ranks || {};
        stats.ranks.opr = {
          total: sort(stats.opr.total),
          teleop: sort(stats.opr.teleop),
          auto: sort(stats.opr.auto),
          foul: sort(stats.opr.foul).reverse(),
          climb: sort(stats.opr.climb),
          mobility: sort(stats.opr.mobility),
          rotor: {
            auto: sort(stats.opr.rotor.auto),
            teleop: sort(stats.opr.rotor.teleop)
          },
          fuel: {
            auto: sort(stats.opr.fuel.auto),
            teleop: sort(stats.opr.fuel.teleop)
          }
        };

        resolve(stats);
      });
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
          stats.dpr['frc' + dpr] = data.dprs[dpr];
        }

        resolve(stats);
      });
    }).then(function(stats) {
      return new Promise((resolve, reject) => {
        function sort(stat) {
          return Object.keys(stat).sort((a, b) => stat[b] - stat[a]);
        }

        stats.ranks.dpr = sort(stats.dpr);
        stats.ranks.ccwm = sort(stats.ccwm);

        resolve(stats);
      });
    });
  }

  function getRankings(stats) {
    stats = stats || {};
    return new Promise((resolve, reject) => {
      Matches.findMatches(event_code, refresh).then(function(matches) {
        function sort(ranking) {
          return Object.keys(ranking).sort((a, b) => ranking[b] - ranking[a]);
        }

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

        var points = [];
        for (var team in team_rankpoints) {
          var rp = team_rankpoints[team];
          if (points.indexOf(rp) === -1) {
            points.push(rp);
          }
        }
        points = points.sort((a, b) => b - a);
        stats.ranking = {};
        for (var team in team_rankpoints) {
          stats.ranking[team] = points.indexOf(team_rankpoints[team]) + 1;
        }

        stats.rankpoints = team_rankpoints;
        resolve(stats);
      }, function(err) { reject(err); });
    });
  }

  return Promise.resolve()
    .then(getOPRs, (err) => { throw err })
    .then(getTBAStats, (err) => { throw err })
    .then(getRankings, (err) => { throw err });
}

function findStats(event_code, refresh) {
  return new Promise((resolve, reject) => {
    var data = cache.get(event_code);
    if (data === undefined || refresh) {
      getStats(event_code, refresh).then(function(data) {
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

module.exports = {findStats: findStats};
