var initTBA = require('thebluealliance');
var tba = new initTBA('node-thebluealliance','TBA v2 API','1.1.1');
var NodeCache = require("node-cache");
var cache = new NodeCache();

function getEvent(event_code) {
  if (event_code.startsWith("2017")) { event_code = event_code.substr(4); }

  function getEventInfo(event) {
    event = event || {};
    return new Promise((resolve, reject) => {
      tba.getEvent(event_code, 2017, function(err, info) {
        if (err) { console.log(err); return reject(err); }
        event.key = info.key.substr(4);
        event.name = info.name;
        event.start_date = new Date(info.start_date);
        event.end_date = new Date(info.end_date);
        event.website = info.website;

        resolve(event);
      });
    });
  }

  function getTeams(event) {
    event = event || {};
    return new Promise((resolve, reject) => {
      tba.getTeamsAtEvent(event_code, 2017, function(err, info) {
        if (err) { console.log(err); return reject(err); }
        event.teams = info.map(function(team) {
          return team.key;
        });

        resolve(event);
      });
    });
  }

  return Promise.resolve()
    .then(getEventInfo, (err) => { throw err })
    .then(getTeams, (err) => { throw err });
}

function findEvent(event_code, refresh) {
  return new Promise((resolve, reject) => {
    var data = cache.get(event_code);
    if (data === undefined || refresh) {
      getEvent(event_code).then(function(data) {
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

module.exports = {findEvent: findEvent};
