var initTBA = require('thebluealliance');
var tba = new initTBA('node-thebluealliance','TBA v2 API','1.1.1');
var NodeCache = require("node-cache");
var cache = new NodeCache();
var Event = require('./event.js');
var Team = require('./team.js');
var TeamEvent = require('./teamevent.js');

function getWorlds(event_code) {
  if (event_code.startsWith("2017")) { event_code = event_code.substr(4); }

  function getEvent(worlds) {
    worlds = worlds || {};
    return new Promise((resolve, reject) => {
      Event.findEvent(event_code).then(function(event) {
        worlds.event = event;
        resolve(worlds);
      });
    });
  }

  function getPerformances(worlds) {
    worlds.teams = [];

    return worlds.event.teams.reduce(function(promise, team) {
      return promise.then(function() {
        return Team.findTeam(team).then(function(team) {
          worlds.teams[team.team_number] = { events: team.events.map((e) => e.key), stats: {} };
          return team.events.reduce(function(promise, event) {
            if (event.end_date > new Date()) {
              return promise;
            }

            return promise.then(function() {
              return TeamEvent.findTeamEvent(team.team_number, event.key).then(function(teamevent) {
                console.log(team.team_number + " for " + event.key + " stats saved");
                worlds.teams[team.team_number].stats[event.key] = teamevent.stats;
              });
            });
          }, Promise.resolve());
        });
      });
    }, Promise.resolve()).then(() => worlds);
  }

  return Promise.resolve()
    .then(getEvent, (err) => { throw err })
    .then(getPerformances, (err) => { throw err })
}

function findWorlds(event_code, refresh) {
  return new Promise((resolve, reject) => {
    var data = cache.get(event_code);
    if (data === undefined || refresh) {
      getWorlds(event_code).then(function(data) {
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

module.exports = {findWorlds: findWorlds};
