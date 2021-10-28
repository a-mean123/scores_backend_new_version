const mongoose = require('mongoose');

let Doctor = mongoose.model('doctor', {

    name: String,
    lastname: String,
    birthday: String,
    photo: String,
    adresse: String,
    tel: String,
    email: String,
    password: String,
    added_date: Date,
    account_state: Boolean,
    archived: Boolean,
    fax: String,
    gender: String,
    job: String,
    adeli: Number,
    rpps: Number,
    role: Number,

});

module.exports = { Doctor };