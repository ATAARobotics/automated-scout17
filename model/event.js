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
        event.key = info.key;
        event.name = info.name;
        event.start_date = info.start_date;
        event.end_date = info.end_date;
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

  return getEventInfo().then(getTeams);
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

module.exports = {getEvent: getEvent,
                  findEvent: findEvent};
