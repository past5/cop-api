var express = require('express');
var router = express.Router();

router.get('/:id', function(req, res) {
  const productId = req.params.id;

  res.locals.connection.query('SELECT * from cop_medications INNER JOIN cop_generics ON cop_medications.generic_id = cop_generics.id ' +
    'WHERE cop_medications.id=' + productId, function (error, results, fields) {
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
