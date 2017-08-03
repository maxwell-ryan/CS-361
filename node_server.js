var express = require('express');
var app = express();

var handlebars = require('express-handlebars').create({defaultLayout:'main'});

var request = require('request');
var mysql = require('mysql');
var session = require('express-session');
var bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(express.static('public'));
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');
app.set('port', 8666);

var pool = mysql.createPool({
  connectionLimit: 10,
  host: 'mysql.eecs.oregonstate.edu',
  user: 'cs340_',
  password: '',
  database: 'cs340_',
  dateStrings: 'date'
});
