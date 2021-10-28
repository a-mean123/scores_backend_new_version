const mongoose = require('mongoose');

let Admin = mongoose.model('admin', {

    name: String,
    lastname: String,
    photo: String,
    email: String,
    password: String,
    added_date: Date,
    account_state: Boolean,
    archived: Boolean,

});

module.exports = { Admin };