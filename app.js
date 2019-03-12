var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var pricelistsRouter = require('./routes/pricelists');
var medicationsRouter = require('./routes/medications');
var pricesRouter = require('./routes/prices');
var shippingRouter = require('./routes/shipping');
var paymentRouter = require('./routes/payment');
var rxRouter = require('./routes/rx');
var orderRouter = require('./routes/order');
var inquiryRouter = require('./routes/inquiry');

var mysql = require('mysql');
var cors = require('cors')

var app = express();

app.use(cors());

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

const pool  = mysql.createPool({
  host: '35.203.43.168',
  user: 'admin',
  password: 'A88MiMM',
  database: 'cop_main'
});

//mysql database connection
app.use(function(req, res, next){
  res.locals.connection = pool;
  next();
});

app.use('/api/v1/pricelist', pricelistsRouter);
app.use('/api/v1/pricelist/search', pricelistsRouter);
app.use('/api/v1/medications', medicationsRouter);
app.use('/api/v1/prices', pricesRouter);
app.use('/api/v1/shipping', shippingRouter);
app.use('/api/v1/payment', paymentRouter);
app.use('/api/v1/rx', rxRouter);
app.use('/api/v1/order', orderRouter);
app.use('/api/v1/inquiry', inquiryRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
