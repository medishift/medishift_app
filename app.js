const express = require('express');

const path = require('path');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const passport = require('passport');
const config = require('./config/database');
const expressValidator = require('express-validator');
const session = require('express-session');

const cookieParser = require('cookie-parser');
//const session      = require('express-session');

mongoose.connect(config.database);
let db=mongoose.connection;

mongoose.connection.once('open',function () {
    console.log('Connection has been made....');

}).on('error',function (error) {
    console.log('Connection error:', error);

})


//const flash = require('connect-flash');






// Check connection
db.once('open', function(){
    console.log('Connected to MongoDB');
});

// Check for DB errors
db.on('error', function(err){
    console.log(err);
});


//const app = express();


const app = express('8000');
//app.use(flash());
// const popupS = require('popups');
// app.use(popupS());


app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(expressValidator());
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

// Set public folder
app.use(express.static(path.join(__dirname, 'public')));
app.use('/bootstrap',express.static(__dirname + 'public/bower_components/bootstrap/dist/css'));

// Express Session Middleware
app.use(session({
    secret: 'keyboard cat',
    resave: true,
    saveUninitialized: true
}));

// // Express Messages Middleware
// app.use(require('connect-flash')());
//  app.use(function (req, res, next) {
//      res.locals.messages = require('express-messages')(req, res);
//      next();
//  });

// Express Validator Middleware
app.use(expressValidator({
    errorFormatter: function(param, msg, value) {
        var namespace = param.split('.')
            , root    = namespace.shift()
            , formParam = root;

        while(namespace.length) {
            formParam += '[' + namespace.shift() + ']';
        }
        return {
            param : formParam,
            msg   : msg,
            value : value
        };
    }
}));

// Passport Config
require('./config/passport')(passport);
// Passport Middleware
app.use(passport.initialize());
app.use(passport.session());

app.get('/', function (request, response) {
    response.render('index');
});

app.get('/register', function (request, response) {
    response.render('register');
});
app.get('/login', function (request, response) {
    response.render('login');
});


app.listen(8000, function () {
    console.log('server started in port 8000')
});

// Routes Files

let users=require(('./routes/users'));
app.use('/users',users);
