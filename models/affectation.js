const mongoose = require('mongoose');
let ObjectId = require('mongodb').ObjectID;

let Affectation = mongoose.model('affectation', {

    user: ObjectId,
    form: ObjectId,
    date: Date

});

module.exports = { Affectation };