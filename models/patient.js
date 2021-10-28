const mongoose = require('mongoose');

let Patient = mongoose.model('patient', {

    name: String,
    lastname: String,
    birthday: String,
    photo: String,
    ssn: String,
    adresse: String,
    tel: String,
    email: String,
    password: String,
    added_date: Date,
    account_state: Boolean,
    archived: Boolean,
    gender: String,

});

module.exports = { Patient };