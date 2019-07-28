const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
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

});

// Check connection
db.once('open', function(){
    console.log('Connected to MongoDB');
});

// Check for DB errors
db.on('error', function(err){
    console.log(err);
});

const app = express('8000');

// bring in models
let MedicalRecords = require('./models/medical_records');
let User = require('./models/user');

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(expressValidator());
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: false}));

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

function getFromLocalStorage(storagePath, id) {
    let localStorage;
    if (typeof localStorage === "undefined" || localStorage === null) {
        let LocalStorage = require('node-localstorage').LocalStorage;
        localStorage = new LocalStorage(storagePath);
    }
    return localStorage.getItem(id);
}

app.get('/', function (request, response) {

    let userID = getFromLocalStorage('./scratch', 'currentUserID');

    if (userID == null){
        response.redirect('/login');
        return;
    }
    User.find({
        "_id": userID
    }, {
        "fullname": 1
    }, function (error, users) {
        if (error) {
            console.log(error);
            return;
        }
        response.render('index', {
            title: 'Article',
            fullName: users[0].fullname
        });
    });
});

app.get('/input_data', function (request, response) {
    response.render('data_input_views/data_input', {
        title: 'add articles'
    });
});

// Add submit POST Route
app.post('/input_data', function (request, response) {
    let dataType = request.body.newDataType;
    let data = request.body.newData;
    console.log(dataType);
    console.log(data);

    let medicalRecords = new MedicalRecords();
    if (dataType.includes('Temperature')) {
        medicalRecords.temperature = (Array.isArray(data)) ? data[dataType.indexOf('Temperature')] : data;
    }
    if (dataType.includes('Blood Pressure')) {
        let bloodPressure = (Array.isArray(data)) ? data[dataType.indexOf('Blood Pressure')] : data;
        bloodPressure = bloodPressure.split('/');
        medicalRecords.systolic = bloodPressure[0];
        medicalRecords.diastolic = bloodPressure[1];
    }
    if (dataType.includes('Heartbeats Rate')) {
        medicalRecords.heartbeats_rate = (Array.isArray(data)) ? data[dataType.indexOf('Heartbeats Rate')] : data;
    }
    if (dataType.indexOf('Oxygen Level') > -1) {
        medicalRecords.oxygen_level = (Array.isArray(data)) ? data[dataType.indexOf('Oxygen Level')] : data;
    }
    if (dataType.includes('Weight')) {

        medicalRecords.weight = (Array.isArray(data)) ? data[dataType.indexOf('Weight')] : data;
    }
    medicalRecords.created_date = new Date();
    medicalRecords.created_day = medicalRecords.created_date.toLocaleDateString();
    medicalRecords.userID = getFromLocalStorage('./scratch', 'currentUserID');
    console.log(medicalRecords);
    medicalRecords.save(function (error) {
        if (error) {
            console.log(error);
        }
        response.render('result_views/result', {
            isSaved: 1,
            medicalRecords: medicalRecords
        });
    });
});

app.get('/report', function (request, response) {
    let userID = getFromLocalStorage('./scratch', 'currentUserID');
    MedicalRecords.find({"userID": userID}, function (error, medicalRecords) {
        if (error) {
            console.log(error);
            return;
        }

        response.render('report_views/report', {
            medicalRecords: medicalRecords
        });

    });
});

app.get('/report/download', function (request, response) {
    let userID = getFromLocalStorage('./scratch', 'currentUserID');
    MedicalRecords.find({"userID": userID}, function (error, medicalRecords) {
        if (error) {
            console.log(error);
            return;
        }

        const csvWriter = createCsvWriter({
            path: 'medicalRecords.csv',
            header: [
                {id: 'temperature', title: 'Temperature'},
                {id: 'systolic', title: 'Blood Pressure (systolic)'},
                {id: 'diastolic', title: 'Blood Pressure (diastolic)'},
                {id: 'heartbeats_rate', title: 'Heartbeats Rate'},
                {id: 'oxygen_level', title: 'Blood Oxygen Level'},
                {id: 'weight', title: 'Weight'},
                {id: 'created_date', title: 'Input Date'},
            ]
        });

        csvWriter
            .writeRecords(medicalRecords)
            .then(()=> console.log('The CSV file was written successfully'));

        response.redirect('/report');

        // fs.createReadStream('data.csv')
        //     .pipe(csv())
        //     .on('data', (medicalRecords) => {
        //         console.log(medicalRecords);
        //     })
        //     .on('end', () => {
        //         console.log('CSV file successfully processed');
        //     });
    });
});



app.get('/register', function (request, response) {
    response.render('register');
});
app.get('/login', function (request, response) {
    response.render('login');
});

// logout
app.get('/logout', function(req, res){
    req.logout();
    let localStorage;
    if (typeof localStorage === "undefined" || localStorage === null) {
        let LocalStorage = require('node-localstorage').LocalStorage;
        localStorage = new LocalStorage('./scratch');
    }
    localStorage.removeItem('currentUserID');
    localStorage.removeItem('currentUserName');
    res.redirect('/login');
});


app.listen(8000, function () {
    console.log('server started in port 8000')
});

// Routes Files

let users=require(('./routes/users'));
app.use('/users',users);
