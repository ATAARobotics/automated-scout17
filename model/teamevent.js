var Team = require('./team.js')
var Event = require('./event.js')
var Stats = require('./stats.js')
var NodeCache = require("node-cache");
var cache = new NodeCache();

function getTeamEvent(team_number, event_code) {
  function getTeam(teamevent) {
    teamevent = teamevent || {};
    return new Promise((resolve, reject) => {
      Team.findTeam(team_number).then(function(team) {
        teamevent.team = team;
        resolve(teamevent);
      }, function(err) { reject(err); });
    });
  }

  function getEvent(teamevent) {
    teamevent = teamevent || {};
    return new Promise((resolve, reject) => {
      Event.findEvent(event_code).then(function(event) {
        teamevent.event = event;
        resolve(teamevent);
      }, function(err) { reject(err); });
    });
  }

  function getStats(teamevent) {
    teamevent = teamevent || {};
    return new Promise((resolve, reject) => {
      Stats.findStats(event_code).then(function(stats) {
        teamevent.stats = {};
        var team = 'frc' + team_number;
        teamevent.stats.opr = stats.opr.total[team];
        teamevent.stats.telop = stats.opr.teleop[team];
        teamevent.stats.auto = stats.opr.auto[team];
        teamevent.stats.dpr = stats.dpr[team];
        teamevent.stats.ccwm = stats.ccwm[team];
        // todo add more here
        resolve(teamevent);
      }, function(err) { reject(err); });
    });
  }

  return getTeam().then(getEvent).then(getStats);
}

function findTeamEvent(team_number, event_code, refresh) {
  return new Promise((resolve, reject) => {
    var cache_key = team_number + event_code;
    var data = cache.get(cache_key);
    if (data === undefined || refresh) {
      getTeamEvent(team_number, event_code).then(function(data) {
        cache.set(cache_key, data);
        resolve(data);
      }, function(err) {
        reject(err);
      });
    } else {
      resolve(data);
    }
  });
}

module.exports = {getTeamEvent: getTeamEvent,
                  findTeamEvent: findTeamEvent};
