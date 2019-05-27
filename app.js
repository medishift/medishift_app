const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

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
    console.log(new Date(Date.parse("2005-07-08T11:22:33+0000")));
    medicalRecords.created_date = new Date();
    console.log(medicalRecords);
    // medicalRecords.save(function (error) {
    //     if (error) {
    //         console.log(error);
    //     }
        // response.render('result_views/result', {
        //     value: medicalRecords
        // })
        response.render('result_views/result', {
            isSaved: 1,
            medicalRecords: medicalRecords
        });
    // });
});

app.get('/report', function (request, response) {
    MedicalRecords.find({}, function (error, medicalRecords) {
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
    MedicalRecords.find({}, function (error, medicalRecords) {
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