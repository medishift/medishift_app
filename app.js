const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

mongoose.connect('mongodb://localhost/medishift');
let db = mongoose.connection;

// check for db connection
db.once('open', function () {
    console.log('Connected to MongoDB')
});

// check for db errors
db.on('error', function (error) {
    console.log(error);
});
const app = express('8000');

// bring in models
let MedicalRecords = require('./models/medical_records');

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: false}));

// parse application/json
app.use(bodyParser.json());

// Set public folder
app.use(express.static(path.join(__dirname, 'public')));


app.get('/', function (request, response) {
    // let articles = [
    //     {
    //         id: 1,
    //         title: 'Article One',
    //         author: 'Brad Traversy',
    //         body:'This is article one'
    //     },
    //
    //     {
    //         id: 2,
    //         title: 'Article Two',
    //         author: 'Brad Traversy',
    //         body:'This is article two'
    //     },
    //
    //     {
    //         id: 3,
    //         title: 'Article Three',
    //         author: 'Brad Traversy',
    //         body:'This is article three'
    //     }
    // ];

    // Article.find({}, function (error, articles) {
    //     if (error){
    //         console.log(error);
    //         return;
    //     }
    //
    response.render('index', {
        title: 'Article'
    });
    // });
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
        medicalRecords.temperature = (data.length > 1) ? data[dataType.indexOf('Temperature')] : data;
    }
    if (dataType.includes('Blood Pressure')) {
        let bloodPressure = (data.length > 1) ? data[dataType.indexOf('Blood Pressure')] : data;
        bloodPressure = bloodPressure.split('/');
        medicalRecords.systolic = bloodPressure[0];
        medicalRecords.diastolic = bloodPressure[1];
    }
    if (dataType.includes('Heartbeats Rate')) {
        medicalRecords.heartbeats_rate = (data.length > 1) ? data[dataType.indexOf('Heartbeats Rate')] : data;
    }
    if (dataType.indexOf('Oxygen Level') > -1) {
        medicalRecords.oxygen_level = (data.length > 1) ? data[dataType.indexOf('Oxygen Level')] : data;
    }
    if (dataType.includes('Weight')) {

        medicalRecords.weight = (data.length > 1) ? data[dataType.indexOf('Weight')] : data;
    }
    medicalRecords.created_date = new Date();
    console.log(medicalRecords);
    medicalRecords.save(function (error) {
        if (error) {
            console.log(error);
        }
        response.redirect('/');
    });
});

app.listen(8000, function () {
    console.log('server started in port 8000')
});


/*
Mongo commands
show dbs
use <db name>
 db.createCollection(<table name>);
 show collections
 db.<table name>.insert({title:"Article One",author:"Brad Traversy", body:"This is article one"});
db.<table name>.find()
db.<table name>.find().pretty()
 */