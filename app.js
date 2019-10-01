const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const passport = require('passport');
const config = require('./config/database');
const expressValidator = require('express-validator');
const session = require('express-session');
const Algorithmia = require("algorithmia");


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

function translateGender(medicalRecords) {
    return medicalRecords.gender === "Male" ? 1 : 0;
}

function translateChestPain(medicalRecords) {
    if (medicalRecords.chest_pain === "typical angina") {
        return 1;
    }
    if (medicalRecords.chest_pain === "atypical angina") {
        return 2;
    }
    if (medicalRecords.chest_pain === "non-anginal pain") {
        return 3;
    }
    if (medicalRecords.chest_pain === "asymptomatic") {
        return 4;
    }
    return 0;
}

function translateFastingBloodSugar(medicalRecords) {
    return medicalRecords.fasting_blood_sugar > 120 ? 1 : 0;
}

function translateExersiceAngina(medicalRecords) {
    return medicalRecords.exercise_induced_angina ? 1 : 0;
}

function translateSlope(medicalRecords) {
    if (medicalRecords.slope === "Up Sloping"){
        return 1;
    }
    if (medicalRecords.slope === "Flat"){
        return 2;
    }
    if (medicalRecords.slope === "Down Sloping"){
        return 3;
    }
    return 0;
}

function translateThalliumStressTest(medicalRecords) {
    if (medicalRecords.thallium_stress_test === "Normal") {
        return 3;
    }
    if (medicalRecords.thallium_stress_test === "Fixed Defect") {
        return 6;
    }
    if (medicalRecords.thallium_stress_test === "Reversible Defect") {
        return 7;
    }
    return 0;
}

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
    if (dataType.includes('Age')) {
        medicalRecords.age = (Array.isArray(data)) ? data[dataType.indexOf('Age')] : data;
    }
    if (dataType.includes('Gender')) {
        medicalRecords.gender = (Array.isArray(data)) ? data[dataType.indexOf('Gender')] : data;
    }
    if (dataType.includes('Fasting Blood Sugar')) {
        medicalRecords.fasting_blood_sugar = (Array.isArray(data)) ? data[dataType.indexOf('Fasting Blood Sugar')] : data;
    }
    if (dataType.includes('Chest Pain Type')) {
        medicalRecords.chest_pain = (Array.isArray(data)) ? data[dataType.indexOf('Chest Pain Type')] : data;
    }
    if (dataType.includes('Serum Cholesterol')) {
        medicalRecords.serum_cholestorol = (Array.isArray(data)) ? data[dataType.indexOf('Serum Cholesterol')] : data;
    }
    if (dataType.includes('Exercise Induced Angina')) {
        medicalRecords.exercise_induced_angina = (Array.isArray(data)) ? data[dataType.indexOf('Exercise Induced Angina')] : data;
    }
    if (dataType.includes('oldpeak')) {
        medicalRecords.oldpeak = (Array.isArray(data)) ? data[dataType.indexOf('oldpeak')] : data;
    }
    if (dataType.includes('Slope')) {
        medicalRecords.slope = (Array.isArray(data)) ? data[dataType.indexOf('Slope')] : data;
    }
    if (dataType.includes('Vessels')) {
        medicalRecords.number_of_major_vessels = (Array.isArray(data)) ? data[dataType.indexOf('Vessels')] : data;
    }
    if (dataType.includes('Thallium Stress Test Result')) {
        medicalRecords.thallium_stress_test = (Array.isArray(data)) ? data[dataType.indexOf('Thallium Stress Test Result')] : data;
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

    let cardiovascularPercentage;
    // TODO replace hardcode
    let input = [medicalRecords.age, translateGender(medicalRecords), translateChestPain(medicalRecords), medicalRecords.systolic,
        medicalRecords.serum_cholestorol, translateFastingBloodSugar(medicalRecords), 2, medicalRecords.heartbeats_rate,
        translateExersiceAngina(medicalRecords), medicalRecords.oldpeak, translateSlope(medicalRecords), 
        medicalRecords.number_of_major_vessels, translateThalliumStressTest(medicalRecords)];
    Algorithmia.client("simA8QkOa7w0eKkYu3Z4BZMloOm1")
        .algo("HakemShubar/cardiovascular_prediction/1.0.1?timeout=300") // timeout is optional
        .pipe(input)
        .then(function(algoResponse) {
            console.log(algoResponse.get());
            cardiovascularPercentage = Math.round(parseFloat(algoResponse.get()) * 100);
            console.log(cardiovascularPercentage);
            medicalRecords.save(function (error) {
                if (error) {
                    console.log(error);
                }
                response.render('result_views/result', {
                    isSaved: 1,
                    cardiovascularPercentage: cardiovascularPercentage,
                    medicalRecords: medicalRecords
                });
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
