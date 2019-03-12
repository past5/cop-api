var express = require('express');
var router = express.Router();

router.get('/', function(req, res) {
  res.locals.connection.query('SELECT * from cop_shipping_options', function (error, results, fields) {
    if (error) {
      res.status(500);
      res.send(JSON.stringify({"error": error, "response": null}));
      return;
    }

    res.status(200);
    res.send(JSON.stringify({"error": null, "response": results}));
  });
});



module.exports = router;
