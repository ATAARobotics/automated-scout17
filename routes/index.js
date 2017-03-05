var express = require('express');
var router = express.Router();
var initTBA = require('thebluealliance');
var tba = new initTBA('node-thebluealliance','TBA v2 API','1.1.1');

router.get('/', function(req, res, next) {
  tba.getListOfEvents(function(err, data) {
    if (err) { next(err); }
    data.sort(function(a, b) {
      var s = Date.parse(a.start_date) - Date.parse(b.start_date);
      if (s == 0) {
        s = a.key.localeCompare(b.key);
      }
      return s;
    });

    var event_info = { now: [], future: [], past: [] };

    for (key in data) {
      var event = data[key];

      if (event.official) {
        var from = Date.parse(event.start_date);
        var to = new Date(Date.parse(event.end_date));
        to.setDate(to.getDate() + 1);
        if (Date.now() > from) {
          if (Date.now() <= to) {
            event_info.now.push(event);
          } else {
            event_info.past.push(event);
          }
        } else {
          event_info.future.push(event);
        }
      }
    }

    res.render('index', { title: 'Automated Scout', event_info: event_info });
  });
});

module.exports = router;
