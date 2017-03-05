var Team = require('./team.js')
var Event = require('./event.js')
var Stats = require('./stats.js')
var NodeCache = require("node-cache");
var cache = new NodeCache({ stdTTL: 125 });

function getTeamEvent(team_number, event_code, refresh) {
  function getTeam(teamevent) {
    teamevent = teamevent || {};
    return new Promise((resolve, reject) => {
      Team.findTeam(team_number, refresh).then(function(team) {
        teamevent.team = team;
        resolve(teamevent);
      }, function(err) { reject(err); });
    });
  }

  function getEvent(teamevent) {
    teamevent = teamevent || {};
    return new Promise((resolve, reject) => {
      Event.findEvent(event_code, refresh).then(function(event) {
        teamevent.event = event;
        resolve(teamevent);
      }, function(err) { reject(err); });
    });
  }

  function getStats(teamevent) {
    teamevent = teamevent || {};
    return new Promise((resolve, reject) => {
      Stats.findStats(event_code, refresh).then(function(stats) {
        teamevent.stats = {};
        var team = 'frc' + team_number;
        teamevent.stats.opr = stats.opr.total[team] + 0;
        teamevent.stats.opr_rank = stats.ranks.opr.total.indexOf(team) + 1;
        teamevent.stats.teleop = stats.opr.teleop[team] + 0;
        teamevent.stats.teleop_rank = stats.ranks.opr.teleop.indexOf(team) + 1;
        teamevent.stats.auto = stats.opr.auto[team] + 0;
        teamevent.stats.auto_rank = stats.ranks.opr.auto.indexOf(team) + 1;
        teamevent.stats.dpr = stats.dpr[team] + 0;
        teamevent.stats.dpr_rank = stats.ranks.dpr.indexOf(team) + 1;
        teamevent.stats.ccwm = stats.ccwm[team] + 0;
        teamevent.stats.ccwm_rank = stats.ranks.ccwm.indexOf(team) + 1;
        teamevent.stats.foul = stats.opr.foul[team] + 0;
        teamevent.stats.foul_rank = stats.ranks.opr.foul.indexOf(team) + 1;
        teamevent.stats.climb = stats.opr.climb[team] + 0;
        teamevent.stats.climb_rank = stats.ranks.opr.climb.indexOf(team) + 1;
        teamevent.stats.mobility = stats.opr.mobility[team] + 0;
        teamevent.stats.mobility_rank = stats.ranks.opr.mobility.indexOf(team) + 1;
        teamevent.stats.rotor_auto = stats.opr.rotor.auto[team] + 0;
        teamevent.stats.rotor_auto_rank = stats.ranks.opr.rotor.auto.indexOf(team) + 1;
        teamevent.stats.rotor_teleop = stats.opr.rotor.teleop[team] + 0;
        teamevent.stats.rotor_teleop_rank = stats.ranks.opr.rotor.teleop.indexOf(team) + 1;
        teamevent.stats.fuel_auto = stats.opr.fuel.auto[team] + 0;
        teamevent.stats.fuel_auto_rank = stats.ranks.opr.fuel.auto.indexOf(team) + 1;
        teamevent.stats.fuel_teleop = stats.opr.fuel.teleop[team] + 0;
        teamevent.stats.fuel_teleop_rank = stats.ranks.opr.fuel.teleop.indexOf(team) + 1;
        // todo add more here
        resolve(teamevent);
      }, function(err) { reject(err); });
    });
  }

  return Promise.resolve()
    .then(getTeam, (err) => { throw err })
    .then(getEvent, (err) => { throw err })
    .then(getStats, (err) => { throw err });
}

function findTeamEvent(team_number, event_code, refresh) {
  return new Promise((resolve, reject) => {
    var cache_key = team_number + event_code;
    var data = cache.get(cache_key);
    if (data === undefined || refresh) {
      getTeamEvent(team_number, event_code, refresh).then(function(data) {
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

module.exports = {findTeamEvent: findTeamEvent};
