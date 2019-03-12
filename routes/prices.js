var express = require('express');
var router = express.Router();

router.get('/:id', function(req, res) {
  const productId = req.params.id;

  res.locals.connection.query('SELECT * from cop_prices INNER JOIN cop_quantities ON cop_prices.quantity_id = cop_quantities.id ' +
    'WHERE cop_prices.medication_id=' + productId, function (error, results, fields) {
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
