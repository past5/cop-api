var express = require('express');
var router = express.Router();

router.get('/:id', function(req, res) {
  const productId = req.params.id;

  res.locals.connection.query('SELECT * from cop_medications WHERE medication_id=' + productId, function (error, results, fields) {
    if (error) {
      res.status(500);
      res.send(JSON.stringify({"error": error, "response": null}));
      return;
    }

    res.status(200);
    res.send(JSON.stringify({"error": null, "response": results}));
  });
});

router.get('/', function(req, res) {
  res.locals.connection.query('SELECT * from cop_pricelists', function (error, results, fields) {
    if (error) {
      res.status(500);
      res.send(JSON.stringify({"error": error, "response": null}));
      return;
    }

    res.status(200);
    res.send(JSON.stringify({"error": null, "response": results}));
  });
});

router.post('/search', function(req, res) {
  let searchString = req.body.searchString;

  if (!searchString) {
    res.status(500);
    res.send(JSON.stringify({"error": "no search string provided", "response": null}));
    return;
  }

  res.locals.connection.query('SELECT * from cop_pricelists WHERE LOWER(medication_name) LIKE LOWER("' + searchString + '%")', function (error, results, fields) {
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
