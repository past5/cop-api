var express = require('express');
var router = express.Router();
const Promise = require('bluebird');

router.get('/', function(req, res) {
  res.locals.connection.query('SELECT * from cop_orders', function (error, results, fields) {
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
  let patient = req.body.patient;
  let order = req.body.order;
  let rx = req.body.rx;

  if (!patient) {
    res.status(500);
    res.send(JSON.stringify({"error": "no patient provided", "response": null}));
    return;
  }

  if (!order) {
    res.status(500);
    res.send(JSON.stringify({"error": "no order provided", "response": null}));
    return;
  }

  if (!rx) {
    res.status(500);
    res.send(JSON.stringify({"error": "no rx provided", "response": null}));
    return;
  }

  let patientId = -1, orderId = -1;

  startTransaction(res).then(function(result) {
    return insertPatient(patient, res);
  })
  .then(function(result) {
    patientId = result;
    return insertOrder(patientId, order, res);
  })
  .then(function(result) {
    orderId = result;
    return insertOrderItems(orderId, order, res);
  })
  .then(function(result) {
    return updateRxFile(orderId, rx, res);
  })
  .then(function(result) {
    return insertAllergies(patientId, rx, res);
  })
  .then(function(result) {
    return insertMedications(patientId, rx, res);
  })
  .then(function (result) {
    return commitTransaction(res).then(function(result) {
      res.status(200);
      res.send(JSON.stringify({"error": null, "response": {success: true}}));
    });
  }).catch((error) => {
    return rollbackTransaction(res).then(function(result) {
      res.status(500);
      res.send(JSON.stringify({"error": error, "response": {success: false}}));
    });
  })
});

startTransaction = function (res) {
  let promise = new Promise(function(resolve, reject) {
    res.locals.connection.beginTransaction(
      function (error) {
      if (error) {
        reject("error starting transaction");
      }
      resolve("success");
    });
  });

  return promise;
};

commitTransaction = function (res) {
  let promise = new Promise(function (resolve, reject) {
    res.locals.connection.commit(
      function (error) {
        if (error) {
          reject("error committing transaction");
        }
        resolve("success");
      });
  });

  return promise;
};

rollbackTransaction = function (res) {
  let promise = new Promise(function (resolve, reject) {
    res.locals.connection.rollback(
      function (error) {
        if (error) {
          reject("error rolling back transaction");
        }
        resolve("success");
      });
  });

  return promise;
};

insertPatient = function (patient, res) {
  let promise = new Promise(function(resolve, reject) {
    let dob = new Date(patient.patient_dob).toISOString().slice(0, 10);

    if (patient.id === undefined || patient.id === -1) {
      res.locals.connection.query('INSERT INTO cop_patients SET patient_firstname = "' + patient.patient_firstname + '",' +
        ' patient_lastname = "' + patient.patient_lastname + '",' +
        ' patient_middlename = "' + patient.patient_middlename + '",' +
        ' patient_gender = "' + patient.patient_gender + '",' +
        ' patient_street = "' + patient.patient_street + '",' +
        ' patient_street2 = "' + patient.patient_street2 + '",' +
        ' patient_city = "' + patient.patient_city + '",' +
        ' patient_state = "' + patient.patient_state + '",' +
        ' patient_zip = "' + patient.patient_zip + '",' +
        ' patient_cell = "' + patient.patient_cell + '",' +
        ' patient_phone = "' + patient.patient_phone + '",' +
        ' patient_email = "' + patient.patient_email + '",' +
        ' patient_dob = "' + dob + '",' +
        ' patient_phn = "' + patient.patient_phn + '"'
        , function (error, results) {
          if (error) {
            reject("error inserting patient");
          }
          resolve(results.insertId);
        });
      } else {
        resolve(patient.id);
      }
    });

    return promise;
  };

insertOrder = function (patientId, order, res) {
  let promise = new Promise(function(resolve, reject) {
    res.locals.connection.query('INSERT INTO cop_orders SET patient_id = ' + patientId +
      ', order_status = "' + order.order_status + '",' +
      ' order_shipping_amount = "' + order.order_shipping_amount + '",' +
      ' order_payment_type = "' + order.order_payment_type + '",' +
      ' order_patient_notes = "' + order.order_patient_notes + '"',
      function (error, results) {
        if (error) {
          reject("error inserting order");
        }

        resolve(results.insertId);
      });
    });

    return promise;
  };

insertOrderItems = function (orderId, order, res) {
  let itemCount = 0;
  let promise = new Promise(function(resolve, reject) {
    if (order.order_items.length === 0) {
      reject("no order items in order");
    }
    order.order_items.forEach((item) => {
      res.locals.connection.query('INSERT INTO cop_order_items SET order_id = ' + orderId +
        ', medication_id = ' + item.medication_id + ',' +
        ' medication_din = "' + item.medication_din + '",' +
        ' item_name = "' + item.item_name + '",' +
        ' item_total_quantity = "' + item.item_total_quantity + '",' +
        ' item_package_size = "' + item.item_package_size + '",' +
        ' item_total_price = "' + item.item_total_price + '",' +
        ' item_package_price = "' + item.item_package_price + '"',
        function (error) {
          if (error) {
            reject("error inserting order item");
          }
          itemCount++;
          if (itemCount === order.order_items.length) {
            resolve(itemCount);
          }
        });
    });
  });

  return promise;
};

updateRxFile = function (orderId, rx, res) {
  let promise = new Promise(function(resolve, reject) {
    res.locals.connection.query('UPDATE cop_rx SET order_id = ' + orderId +
      ' WHERE rx_original_file = "' + rx.rx_original_file + '"',
      function (error, results) {
        if (error) {
          reject("error updating rx file");
        }
        resolve("update successful");
      });
  });

  return promise;
};

insertAllergies = function (patientId, rx, res) {
  let allergyCount = 0;
  let promise = new Promise(function(resolve, reject) {
    if (rx.allergies.length === 0) {
      resolve(allergyCount);
    }
    rx.allergies.forEach((allergy) => {
      res.locals.connection.query('INSERT INTO cop_patient_allegies SET patient_id = ' + patientId +
        ', allergy_name = "' + allergy.allergy_name + '"',
        function (error, results) {
          if (error) {
            reject("error inserting patient allergy");
          }
          allergyCount++;
          if (allergyCount === rx.allergies.length) {
            resolve(allergyCount);
          }
        });
    });
  });

  return promise;
};

insertMedications = function (patientId, rx, res) {
  let medicationCount = 0;
  let promise = new Promise(function(resolve, reject) {
    if (rx.medications.length === 0) {
      resolve(medicationCount);
    }
    rx.medications.forEach((medication) => {
      res.locals.connection.query('INSERT INTO cop_patient_medications SET patient_id = ' + patientId +
        ', medication_name = "' + medication.medication_name + '"',
        function (error, results) {
          if (error) {
            reject("error inserting patient medication");
          }
          medicationCount++;
          if (medicationCount === rx.medications.length) {
            resolve(medicationCount);
          }
        });
    });
  });

  return promise;
};

module.exports = router;
