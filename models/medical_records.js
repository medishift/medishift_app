let mongoose = require('mongoose');

// Article Schema
let medicalRecordsSchema = mongoose.Schema({
    temperature:{
        type: Number,
    },
    systolic:{
        type: Number,
    },
    diastolic:{
        type: Number,
    },
    heartbeats_rate:{
        type: Number,
    },
    oxygen_level:{
        type: Number,
    },
    weight:{
        type: Number,
    },
    created_date:{
        type: Date,
        required: true
    },
    created_day:{
        type: Date,
        required: true
    },
    userID:{
        type: Object,
        required: true
    }
});

let MedicalRecords = module.exports = mongoose.model('MedicalRecords', medicalRecordsSchema, );