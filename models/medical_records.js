let mongoose = require('mongoose');

// Article Schema
let medicalRecordsSchema = mongoose.Schema({
    temperature:{
        type: Number,
    },
    age:{
        type: Number,
    },
    gender:{
        type: String,
    },
    fasting_blood_sugar:{
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
    serum_cholestorol:{
        type: Number,
    },
    chest_pain:{
        type: String,
    },
    oldpeak:{
        type: Number,
    },
    exercise_induced_angina:{
        type: Boolean,
    },
    slope:{
        type: String,
    },
    number_of_major_vessels:{
        type: Number,
    },
    thallium_stress_test:{
        type: String,
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