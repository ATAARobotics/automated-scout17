var initTBA = require('thebluealliance');
var tba = new initTBA('node-thebluealliance','TBA v2 API','1.1.1');
var Event = require('./event.js')
var NodeCache = require("node-cache");
var cache = new NodeCache();

function getTeam(team_number, refresh) {
  if (team_number.startsWith("frc")) { team_number = team_number.substr(3); }

  function getTeamInfo(team) {
    team = team || {};
    return new Promise((resolve, reject) => {
      tba.getTeam(team_number, function(err, info) {
        if (err) { console.log(err); return reject(err); }
        team.team_number = team_number,
        team.name = info.nickname,
        team.location = info.location,
        team.website = info.website,
        team.motto = info.motto

        resolve(team);
      });
    });
  }

  function getTeamEvents(team) {
    team = team || {};
    return new Promise((resolve, reject) => {
      tba.getEventsForTeam(team_number, 2017, function(err, events) {
        if (err) { console.log(err); return reject(err); }

        team.events = [];
        events.reduce(function(promise, info) {
          if (info.official) {
            return promise.then(function() {
              return Event.findEvent(info.key, refresh).then(function(event) {
                team.events.push(event);
              }, function(err) { reject(err); });
            }, function(err) { reject(err); });
          } else { return promise; }
        }, Promise.resolve()).then(function() {
          resolve(team);
        }, function(err) { reject(err); });
      });
    });
  }

  function getTeamMedia(team) {
    team = team || {};
    return new Promise((resolve, reject) => {
      tba.getTeamMedia(team_number, 2017, function(err, info) {
        if (err) { console.log(err); reject(err); }

        info.forEach(function(media) {
          if (media.type == 'imgur') {
            team.image_url = 'https://i.imgur.com/' + media.foreign_key + '.png';
            resolve(team);
          }
        });

        resolve(team);
      });
    });
  }

  return Promise.resolve()
    .then(getTeamInfo, (err) => { throw err })
    .then(getTeamEvents, (err) => { throw err })
    .then(getTeamMedia, (err) => { throw err });
}

function findTeam(team_number, refresh) {
  return new Promise((resolve, reject) => {
    var data = cache.get(team_number);
    if (data === undefined || refresh) {
      getTeam(team_number, refresh).then(function(data) {
        cache.set(team_number, data);
        resolve(data);
      }, function(err) {
        reject(err);
      });
    } else {
      resolve(data);
    }
  });
}

module.exports = {findTeam: findTeam};
