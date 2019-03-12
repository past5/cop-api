var express = require('express');
var router = express.Router();

router.get('/', function(req, res) {
  res.locals.connection.query('SELECT * from cop_inquiries', function (error, results, fields) {
    if (error) {
      res.status(500);
      res.send(JSON.stringify({"error": error, "response": null}));
      return;
    }

    res.status(200);
    res.send(JSON.stringify({"error": null, "response": results}));
  });
});

router.post('/', function(req, res) {
  let inquiry = req.body.inquiry;

  if (!inquiry) {
    res.status(500);
    res.send(JSON.stringify({"error": "no message provided", "response": null}));
    return;
  }

  insertInquiry(inquiry, res);
});

insertInquiry = function (inquiry, res) {
  res.locals.connection.query('INSERT INTO cop_inquiries SET inquiry_firstname = "' + inquiry.inquiry_firstname + '",' +
    ' inquiry_lastname = "' + inquiry.inquiry_lastname + '",' +
    ' inquiry_email = "' + inquiry.inquiry_email + '",' +
    ' inquiry_phone = "' + inquiry.inquiry_phone + '",' +
    ' inquiry_message = "' + inquiry.inquiry_message + '"'
    , function (error, results) {
      if (error) {
        res.status(500);
        res.send(JSON.stringify({"error": "could not insert inquiry into database", "response": {success: false}}));
        return;
      }
      res.status(200);
      res.send(JSON.stringify({"error": null, "response": {success: true}}));
    });
}

module.exports = router;
