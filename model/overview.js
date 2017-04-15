var initTBA = require('thebluealliance');
var tba = new initTBA('node-thebluealliance','TBA v2 API','1.1.1');
var NodeCache = require("node-cache");
var cache = new NodeCache();
var Event = require('./event.js');
var Team = require('./team.js');
var TeamEvent = require('./teamevent.js');

function getOverview(event_code) {
  if (event_code.startsWith("2017")) { event_code = event_code.substr(4); }

  function getEvent(overview) {
    overview = overview || {};
    return new Promise((resolve, reject) => {
      Event.findEvent(event_code).then(function(event) {
        overview.event = event;
        resolve(overview);
      });
    });
  }

  function getPerformances(overview) {
    overview.teams = [];
    var teamPromises = [];

    overview.event.teams.forEach(function(team) {
      teamPromises.push(new Promise(function(resolve, reject) {
        Team.findTeam(team).then(function(team) {
          var team_info = {
            team_number: team.team_number,
            events: []
          };

          var eventPromises = [];
          team.events.filter((event) => event.end_date < new Date()).forEach(function(event) {
            eventPromises.push(new Promise(function(resolve, reject) {
              TeamEvent.findTeamEvent(team.team_number, event.key).then(function(teamevent) {
                team_info.events.push({
                  key: event.key,
                  stats: teamevent.stats
                });
                resolve();
              });
            }));
          });

          Promise.all(eventPromises).then(function() {
            var max = {};
            var avg = {};

            team_info.events.forEach(function(event) {
              for (var component in event.stats) {
                if (component.endsWith('_rank')) { continue; }
                max[component] = Math.max(max[component] || 0, event.stats[component]);
                avg[component] = (avg[component] || 0) + event.stats[component];
              }
            });

            for (var component in avg) {
              avg[component] /= team_info.events.length;
            }

            team_info.max = max;
            team_info.avg = avg;
            resolve(team_info);
          }, (err) => reject(err));
        }, (err) => reject(err));
      }));
    });

    return Promise.all(teamPromises);
  }

  return Promise.resolve()
    .then(getEvent, (err) => { throw err })
    .then(getPerformances, (err) => { throw err })
}

function findOverview(event_code, refresh) {
  return new Promise((resolve, reject) => {
    var data = cache.get(event_code);
    if (data === undefined || refresh) {
      getOverview(event_code).then(function(data) {
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

module.exports = {findOverview: findOverview};
