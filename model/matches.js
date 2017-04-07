var initTBA = require('thebluealliance');
var tba = new initTBA('node-thebluealliance','TBA v2 API','1.1.1');
var NodeCache = require("node-cache");
var cache = new NodeCache({ stdTTL: 125 });

function getMatches(event_code) {
  if (event_code.startsWith("2017")) { event_code = event_code.substr(4); }

  function getMatchList(matches) {
    matches = matches || {};
    return new Promise((resolve, reject) => {
      tba.getMatchesAtEvent(event_code, 2017, function(err, info) {
        if (err) { console.log(err); return reject(err); }
        function map_score(breakdown, fouls, rps) {
          if (!breakdown) { return undefined; }

          auto_gears = (breakdown.rotor1Auto ? 1 : 0) + (breakdown.rotor2Auto ? 2 : 0);
          teleop_gears = (breakdown.rotor1Engaged ? 1 : 0) +
                         (breakdown.rotor2Engaged ? 2 : 0) +
                         (breakdown.rotor3Engaged ? 4 : 0) +
                         (breakdown.rotor4Engaged ? 6 : 0)
            - (auto_gears)

          return {
            points: {
              total: breakdown.totalPoints,
              teleop_points: breakdown.teleopPoints,
              auto_points: breakdown.autoPoints,
              foul_points: fouls,

              mobility: breakdown.autoMobilityPoints,
              climb: breakdown.teleopTakeoffPoints,
              rotor: {
                auto: breakdown.autoRotorPoints,
                teleop: breakdown.teleopRotorPoints
              },
              gear: {
                auto: auto_gears,
                teleop: teleop_gears
              },
              fuel: {
                auto: breakdown.autoFuelPoints,
                teleop: breakdown.teleopFuelPoints
              }
            },
            rankpoints: (breakdown.rotorRankingPointAchieved ? 1 : 0) +
                        (breakdown.kPaRankingPointAchieved ? 1 : 0) +
                        (rps)
          };
        }

        matches.list = info.filter((m) => {
          return m.comp_level === 'qm';
        }).map((m) => {
          if (!m.score_breakdown) {
            return {
              hasOccured: false,
              key: m.key,
              match_num: m.match_number,
              alliances: {
                red: [m.alliances.red.teams[0], m.alliances.red.teams[1], m.alliances.red.teams[2]],
                blue: [m.alliances.blue.teams[0], m.alliances.blue.teams[1], m.alliances.blue.teams[2]]
              }
            };
          } else {
            return {
              hasOccured: true,
              key: m.key,
              match_num: m.match_number,
              winner: (m.score_breakdown.blue.totalPoints > m.score_breakdown.red.totalPoints) ? 'blue' : ((m.score_breakdown.red.totalPoints > m.score_breakdown.blue.totalPoints) ? 'red' : 'tie'),
              alliances: {
                red: [m.alliances.red.teams[0], m.alliances.red.teams[1], m.alliances.red.teams[2]],
                blue: [m.alliances.blue.teams[0], m.alliances.blue.teams[1], m.alliances.blue.teams[2]]
              },
              score: {
                red: map_score(m.score_breakdown.red, m.score_breakdown.blue.foulPoints, (m.score_breakdown.blue.totalPoints > m.score_breakdown.red.totalPoints) ? 0 : ((m.score_breakdown.red.totalPoints > m.score_breakdown.blue.totalPoints) ? 2 : 1)),
                blue: map_score(m.score_breakdown.blue, m.score_breakdown.red.foulPoints, (m.score_breakdown.blue.totalPoints > m.score_breakdown.red.totalPoints) ? 2 : ((m.score_breakdown.red.totalPoints > m.score_breakdown.blue.totalPoints) ? 0 : 1))
              }
            };
          }
        });

        resolve(matches);
      })
    });
  }

  return Promise.resolve()
    .then(getMatchList, (err) => { throw err });
}

function findMatches(event_code, refresh) {
  return new Promise((resolve, reject) => {
    var data = cache.get(event_code);
    if (data === undefined || refresh) {
      getMatches(event_code).then(function(data) {
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

module.exports = {findMatches: findMatches};
